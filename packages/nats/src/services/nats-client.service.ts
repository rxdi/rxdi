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

/**
 * Decode a NATS message payload to a UTF-8 string.
 *
 * `@nats-io/nats-core` delivers `msg.data` as a `Uint8Array`. Depending on how
 * the core reassembles the frame off the socket, that value is sometimes a Node
 * `Buffer` (single read) and sometimes a plain `Uint8Array` (payload spanning
 * multiple reads — common for larger messages). `Buffer.prototype.toString()`
 * decodes UTF-8, but `Uint8Array.prototype.toString()` returns comma-separated
 * byte values (e.g. "123,34,..."), so calling `.toString()` on the raw payload
 * silently corrupts every large message ~a third of the time, making
 * `JSON.parse` throw non-deterministically. `TextDecoder` decodes both
 * correctly, so always route payloads through it.
 */
const textDecoder = new TextDecoder();
function decodePayload(data: Uint8Array | null | undefined): string {
  return data?.length ? textDecoder.decode(data) : '';
}

function isErrorEnvelope(v: unknown): v is { error: string } {
  return (
    !!v &&
    typeof v === 'object' &&
    (v as Record<string, unknown>)[NATS_ERROR_TAG] === true &&
    typeof (v as Record<string, unknown>).error === 'string'
  );
}

interface SubscriptionEntry {
  channel: string;
  queueGroup?: string;
  kind: 'request' | 'plain';
  handler: RequestHandler;
  sub: Subscription;
}

@Injectable()
export class NatsClientService implements OnInit {
  private client: NatsConnection | null = null;
  private subscriptions: Map<number, SubscriptionEntry> = new Map();
  private subscriptionId = 0;
  private isConnected = false;
  private connectionPromise: Promise<void>;
  private resolveConnection!: () => void;
  // Set only by an explicit close() call, so the closed()-watcher below can
  // tell an intentional shutdown apart from a connection that died on its
  // own (fatal server error, auth failure, exhausted reconnects, ...).
  private closing = false;
  // Guards against overlapping reconnect loops if closed() somehow fires
  // more than once for the connection we're currently replacing.
  private reconnecting = false;

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
    // Any explicit connect() call (initial boot or manual retry) re-arms
    // auto-reconnect, in case a prior close() had disarmed it.
    this.closing = false;

    try {
      const options: NodeConnectionOptions = {
        name: this.config?.name || 'rxdi-nats-client',
        maxReconnectAttempts: this.config?.maxReconnectAttempts ?? -1,
        reconnect: true,
      };

      if (this.config?.reconnectTimeWait !== undefined) {
        options.reconnectTimeWait = this.config.reconnectTimeWait;
      }

      if (this.config?.user && this.config?.pass) {
        options.user = this.config.user;
        options.pass = this.config.pass;
      }

      let servers = this.config?.servers;
      if (!servers || servers.length === 0) {
        servers = [`nats://${this.config?.host || 'localhost'}:${this.config?.port || 4222}`];
      }

      options.servers = servers;
      const client = await connect(options);
      this.client = client;
      this.isConnected = true;
      this.resolveConnection();
      this.logger.info(`[NatsClientService] Connected to NATS!`);
      this.watchConnection(client);
      await this.resubscribeAll();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`[NatsClientService] Connection failed: ${err.message}`);
    }
  }

  /**
   * `nats.js` only auto-reconnects transient network blips on the *same*
   * connection object (and transparently re-sends SUB commands for us when
   * it does). When the connection dies for good — exhausted reconnect
   * attempts, a fatal auth error, the server evicting the client, etc. —
   * `client.closed()` resolves and nats.js gives up permanently; it will
   * never reconnect on its own. Without this watcher, `this.client` stays
   * pointed at a dead connection forever and every request/publish call
   * fails until the process is restarted, which is the bug this fixes.
   */
  private watchConnection(client: NatsConnection): void {
    client.closed().then((err) => {
      if (this.closing) {
        return;
      }
      if (this.client !== client) {
        // Already superseded by a newer connection; nothing to do.
        return;
      }
      this.isConnected = false;
      this.client = null;
      this.logger.error(
        `[NatsClientService] Connection closed unexpectedly${err ? `: ${(err as Error).message}` : ''}. Reconnecting...`,
      );
      // Re-arm waitForConnection() so future callers block until the
      // reconnect below actually succeeds, instead of resolving instantly
      // against a connection that no longer exists.
      this.connectionPromise = new Promise((resolve) => {
        this.resolveConnection = resolve;
      });
      void this.reconnectWithBackoff();
    });
  }

  private async reconnectWithBackoff(): Promise<void> {
    if (this.reconnecting) {
      return;
    }
    this.reconnecting = true;
    const delay = this.config?.reconnectTimeWait ?? 2000;
    try {
      while (!this.closing && !this.isConnected) {
        await this.connect();
        if (this.isConnected) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      this.reconnecting = false;
    }
  }

  /**
   * Re-establish every previously-registered subscription/request handler
   * against the freshly reconnected client. This is a no-op on the very
   * first connect (nothing has been registered yet). It's required on
   * reconnect because the old subscriptions' `for await` loops end silently
   * once the dead connection closes — they don't come back on their own.
   */
  private async resubscribeAll(): Promise<void> {
    if (!this.client || this.subscriptions.size === 0) {
      return;
    }
    this.logger.info(`[NatsClientService] Restoring ${this.subscriptions.size} subscription(s) after reconnect...`);
    for (const entry of this.subscriptions.values()) {
      try {
        const sub = this.client.subscribe(entry.channel, { queue: entry.queueGroup });
        entry.sub = sub;
        if (entry.kind === 'request') {
          this.consumeRequestHandler(entry.channel, sub, entry.handler);
        } else {
          this.consumePlain(entry.channel, sub, entry.handler);
        }
      } catch (e) {
        this.logger.error(`[NatsClientService] Failed to resubscribe ${entry.channel}:`, e);
      }
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
    this.subscriptions.set(id, { channel, queueGroup, kind: 'request', handler, sub });
    this.consumeRequestHandler(channel, sub, handler);

    this.logger.debug(`[NatsClientService] Subscribed request handler: ${channel}${queueGroup ? ` (queue: ${queueGroup})` : ''}`);
    return id;
  }

  private consumeRequestHandler(channel: string, sub: Subscription, handler: RequestHandler): void {
    (async () => {
      try {
        for await (const msg of sub) {
          try {
            const text = decodePayload(msg.data);
            const data = text ? JSON.parse(text) : null;

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
  }

  async subscribe(channel: string, callback: (msg: any) => void, queueGroup?: string): Promise<number> {
    if (!this.client) {
      this.logger.warn('[NatsClientService] Client not connected');
      return -1;
    }
    const sub = this.client.subscribe(channel, { queue: queueGroup });
    const id = ++this.subscriptionId;
    const handler: RequestHandler = async (data) => { callback(data); };
    this.subscriptions.set(id, { channel, queueGroup, kind: 'plain', handler, sub });
    this.consumePlain(channel, sub, handler);

    this.logger.debug(`[NatsClientService] Subscribed: ${channel}${queueGroup ? ` (queue: ${queueGroup})` : ''}`);
    return id;
  }

  private consumePlain(channel: string, sub: Subscription, handler: RequestHandler): void {
    (async () => {
      try {
        for await (const msg of sub) {
          const text = decodePayload(msg.data);
          // Parse FIRST, then call the handler exactly once. The old shape
          // (`try { handler(JSON.parse(text)) } catch { handler(text) }`)
          // re-invoked the handler with the raw text whenever the handler
          // itself threw on the parsed payload — a double delivery that an
          // async handler's rejection also triggered once we started
          // awaiting it.
          let payload: unknown;
          try {
            payload = text ? JSON.parse(text) : null;
          } catch {
            payload = text;
          }
          try {
            await handler(payload);
          } catch (e) {
            this.logger.error(`[NatsClientService] Subscription handler error on ${channel}:`, e);
          }
        }
      } catch {
        // Subscription closed
      }
    })();
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
    const text = decodePayload(response.data);
    if (text) {
      let result: unknown;
      try {
        result = JSON.parse(text);
      } catch {
        return text;
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
    this.closing = true;
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