import { Injectable, Inject, OnInit } from '@rxdi/core';
import { connect, NodeConnectionOptions } from '@nats-io/transport-node';
import { NatsConnection, Subscription } from '@nats-io/nats-core';


import { NatsModuleConfiguration, NATS_MODULE_CONFIG, NATS_LOGGER } from '../interfaces';
import { NatsLoggerService } from './nats-logger.service';

export type RequestHandler = (data: any) => Promise<any>;

/**
 * Thrown by `NatsClientService.request()` when the remote handler threw and
 * the listener replied with an error envelope ({ error: string }). Lets
 * callers handle remote handler failures like normal exceptions instead of
 * receiving a silent garbage payload masquerading as data.
 */
export class NatsHandlerError extends Error {
  readonly channel: string;
  readonly remoteError: string;
  constructor(channel: string, remoteError: string) {
    super(`[NATS handler error on ${channel}] ${remoteError}`);
    this.name = 'NatsHandlerError';
    this.channel = channel;
    this.remoteError = remoteError;
  }
}

/**
 * Shape of the error envelope produced by `subscribeRequestHandler` and the
 * `@NatsCall` decorator wrapper. We mark it with `__natsError: true` so
 * the caller can distinguish it from a legitimate response that happens to
 * carry an `error` field of its own.
 */
const NATS_ERROR_TAG = '__natsError';
function isErrorEnvelope(v: unknown): v is { error: string } {
  return (
    !!v &&
    typeof v === 'object' &&
    (v as Record<string, unknown>)[NATS_ERROR_TAG] === true &&
    typeof (v as Record<string, unknown>).error === 'string'
  );
}

@Injectable()
export class NatsClientService implements OnInit {
  private client: NatsConnection | null = null;
  private subscriptions: Map<number, { sub: Subscription; handler: RequestHandler }> = new Map();
  private subscriptionId = 0;
  private isConnected = false;
  private connectionPromise: Promise<void>;
  private resolveConnection!: () => void;

  constructor(
    @Inject(NATS_MODULE_CONFIG) private config: NatsModuleConfiguration,
    @Inject(NATS_LOGGER) private logger: NatsLoggerService
  ) {
    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;
    });
  }

  async waitForConnection(): Promise<void> {
    return this.connectionPromise;
  }

  OnInit(): void {
    this.connect().catch((error: unknown) => {
      const err = error as Error;
      this.logger.error(`[NatsClientService] Initial connection failed: ${err.message}`);
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const options: NodeConnectionOptions = {
        name: this.config?.name || 'rxdi-nats-client',
        maxReconnectAttempts: this.config?.maxReconnectAttempts ?? -1,
        reconnect: true,
      };

      if (this.config?.user && this.config?.pass) {
        options.user = this.config.user;
        options.pass = this.config.pass;
      }

      let servers = this.config?.servers;
      if (!servers || servers.length === 0) {
        servers = [`nats://${this.config?.host || 'localhost'}:${this.config?.port || 4222}`];
      }

      options.servers = servers;
      this.client = await connect(options);
      this.isConnected = true;
      this.resolveConnection();
      this.logger.info(`[NatsClientService] Connected to NATS!`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`[NatsClientService] Connection failed: ${err.message}`);
    }
  }

  async publish(channel: string, data: any): Promise<void> {
    if (!this.client) {
      this.logger.warn('[NatsClientService] Client not connected');
      return;
    }
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.client.publish(channel, message);
    this.logger.debug(`[NatsClientService] Published to ${channel}:`, data);
  }

  async subscribeRequestHandler(channel: string, handler: RequestHandler, queueGroup?: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('[NatsClientService] Client not connected');
      return -1;
    }

    const sub = this.client.subscribe(channel, { queue: queueGroup });
    const id = ++this.subscriptionId;
    this.subscriptions.set(id, { sub, handler });

    (async () => {
      try {
        for await (const msg of sub) {
          try {
            const data = msg.data ? JSON.parse(msg.data.toString()) : null;

            const result = await handler(data);

            if (msg.reply) {
              this.client?.publish(msg.reply, JSON.stringify(result));
            }
          } catch (e) {
            this.logger.error(`[NatsClientService] Request handler error on ${channel}:`, e);
            if (msg.reply) {
              this.client?.publish(
                msg.reply,
                JSON.stringify({ [NATS_ERROR_TAG]: true, error: String(e) }),
              );
            }
          }
        }
      } catch {
        // Subscription closed
      }
    })();

    this.logger.debug(`[NatsClientService] Subscribed request handler: ${channel}${queueGroup ? ` (queue: ${queueGroup})` : ''}`);
    return id;
  }

  async subscribe(channel: string, callback: (msg: any) => void, queueGroup?: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('[NatsClientService] Client not connected');
      return -1;
    }
    const sub = this.client.subscribe(channel, { queue: queueGroup });
    const id = ++this.subscriptionId;
    this.subscriptions.set(id, { sub, handler: async (data) => { callback(data); } });

    (async () => {
      try {
        for await (const msg of sub) {
          try {
            const data = msg.data ? JSON.parse(msg.data.toString()) : null;
            callback(data);
          } catch {
            callback(msg.data.toString());
          }
        }
      } catch {
        // Subscription closed
      }
    })();

    this.logger.debug(`[NatsClientService] Subscribed: ${channel}${queueGroup ? ` (queue: ${queueGroup})` : ''}`);
    return id;
  }

  unsubscribe(subId: number): void {
    const entry = this.subscriptions.get(subId);
    if (entry) {
      entry.sub.unsubscribe();
      this.subscriptions.delete(subId);
    }
  }

  async request(channel: string, data: any, timeout = 30000): Promise<any> {
    if (!this.client) {
      throw new Error('NATS client is not connected');
    }
    this.logger.debug(`[NatsClientService] Sending request to ${channel}:`, data);
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const response = await this.client.request(channel, message, { timeout });
    if (response.data) {
      let result: unknown;
      try {
        result = JSON.parse(response.data.toString());
      } catch {
        return response.data.toString();
      }
      // Remote handler threw — surface as a real exception instead of
      // letting a garbage payload silently flow back to the caller.
      if (isErrorEnvelope(result)) {
        throw new NatsHandlerError(channel, result.error);
      }
      this.logger.debug(`[NatsClientService] Request response from ${channel}:`, result);
      return result;
    }
    return null;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
    }
  }

  isReady(): boolean {
    return this.isConnected && !!this.client;
  }

  getClient(): NatsConnection | null {
    return this.client;
  }
}