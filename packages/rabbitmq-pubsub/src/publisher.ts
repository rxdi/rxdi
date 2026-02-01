import { Channel, Options } from 'amqplib';
import { IRabbitMqConnectionFactory } from './connectionFactory';
import { IQueueNameConfig, asPubSubQueueNameConfig } from './common';
import { createChildLogger, Logger } from './childLogger';

export class RabbitMqPublisher {
 constructor(
  private logger: Logger,
  private connectionFactory: IRabbitMqConnectionFactory,
 ) {
  this.logger = createChildLogger(logger, 'RabbitMqPublisher');
 }

 async publish<T>(
  queue: string | IQueueNameConfig,
  message: T,
  options?: IQueueNameConfig,
 ): Promise<void> {
  const queueConfig = asPubSubQueueNameConfig(queue);

  try {
   const connection = await this.connectionFactory.create();
   const channel = await connection.createChannel();
   if (options?.prefetch) {
    channel.prefetch(options.prefetch, options.globalPrefetch);
   }
   await this.setupChannel<T>(channel, queueConfig);
   channel.publish(queueConfig.exchange, '', this.getMessageBuffer(message));
   this.logger.trace("message sent to exchange '%s' (%j)", queueConfig.exchange, message);
   return channel.close();
  } catch (e) {
   this.logger.error(
    "unable to send message to exchange '%j' {%j}",
    queueConfig.exchange,
    message,
   );
   throw new Error('Unable to send message');
  }
 }

 private setupChannel<T>(channel: Channel, queueConfig: IQueueNameConfig) {
  this.logger.trace("setup '%j'", queueConfig);
  return Promise.all(this.getChannelSetup(channel, queueConfig));
 }

 protected getMessageBuffer<T>(message: T) {
  return Buffer.from(JSON.stringify(message), 'utf8');
 }

 protected getChannelSetup(channel: Channel, queueConfig: IQueueNameConfig) {
  return [channel.assertExchange(queueConfig.exchange, 'fanout', this.getSettings())];
 }

 protected getSettings(): Options.AssertQueue {
  return {
   durable: true,
   autoDelete: true,
  };
 }
}
