import { ChannelModel, connect } from 'amqplib';
import { createChildLogger, Logger } from './childLogger';

export interface IRabbitMqConnectionFactory {
 create(): Promise<ChannelModel>;
}

export interface IRabbitMqConnectionConfig {
 host: string;
 port: number;
}

function isConnectionConfig(
 config: IRabbitMqConnectionConfig | string,
): config is IRabbitMqConnectionConfig {
 if (
  (config as IRabbitMqConnectionConfig).host &&
  (config as IRabbitMqConnectionConfig).port
 ) {
  return true;
 }
}

export class RabbitMqConnectionFactory implements IRabbitMqConnectionFactory {
 private connection: string;
 connect;
 constructor(private logger: Logger, config: IRabbitMqConnectionConfig | string) {
  this.connection = isConnectionConfig(config)
   ? `amqp://${config.host}:${config.port}`
   : config;
  this.logger = createChildLogger(logger, 'RabbitMqConnectionFactory');
 }

 create(): Promise<ChannelModel> {
  this.logger.debug('connecting to %s', this.connection);
  if (this.connect) {
   return Promise.resolve(this.connect);
  }
  return Promise.resolve(connect(this.connection))
   .then((connect) => {
    this.connect = connect;
    return connect;
   })
   .catch((err) => {
    this.logger.error("failed to create connection '%s'", this.connection);
    return Promise.reject(err);
   });
 }
}

export class RabbitMqSingletonConnectionFactory implements IRabbitMqConnectionFactory {
 private connection: string;
 private promise: Promise<ChannelModel>;
 constructor(private logger: Logger, config: IRabbitMqConnectionConfig | string) {
  this.connection = isConnectionConfig(config)
   ? `amqp://${config.host}:${config.port}`
   : config;
 }

 create(): Promise<ChannelModel> {
  if (this.promise) {
   this.logger.trace('reusing connection to %s', this.connection);
   return this.promise;
  }
  this.logger.debug('creating connection to %s', this.connection);
  // Enable heartbeats so a half-open (silently dead) TCP connection is
  // detected instead of hanging every publish/subscribe forever.
  const url =
   this.connection.indexOf('heartbeat=') === -1
    ? this.connection +
      (this.connection.indexOf('?') === -1 ? '?' : '&') +
      'heartbeat=30'
    : this.connection;
  return (this.promise = Promise.resolve(connect(url))
   .then((conn) => {
    // If the connection dies, drop the cached promise so the NEXT
    // create() re-establishes it instead of reusing a dead connection.
    const reset = (err?: Error) => {
     if (this.promise) {
      this.logger.error(
       err,
       "connection to '%s' lost, will reconnect on next use",
       this.connection,
      );
      this.promise = undefined;
     }
    };
    conn.on('error', reset);
    conn.on('close', () => reset());
    return conn;
   })
   .catch((err) => {
    // Never cache a rejected connection — clear it so we retry next time
    // (e.g. when the broker finishes starting up).
    this.promise = undefined;
    this.logger.error("failed to create connection '%s'", this.connection);
    return Promise.reject(err);
   }));
 }
}
