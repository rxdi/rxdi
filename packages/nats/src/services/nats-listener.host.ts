import { Injectable, Inject, OnInit } from '@rxdi/core';
import { NatsClientService } from './nats-client.service';
import { NATS_LOGGER } from '../interfaces';
import { NatsLoggerService } from './nats-logger.service';
import { Container } from '@rxdi/core';

export interface CallEntry {
  targetClass: Function;
  methodName: string;
  channel: string;
  timeout: number;
  queueGroup?: string;
}

export interface ListenerEntry {
  targetClass: Function;
  methodName: string;
  channel: string;
  queueGroup?: string;
}

@Injectable()
export class NatsListenerHost implements OnInit {
  private static callEntries: CallEntry[] = [];
  private static listenerEntries: ListenerEntry[] = [];
  private static initialized = false;
  private static connectionReady = false;

  constructor(
    @Inject(NATS_LOGGER) private logger: NatsLoggerService
  ) {}

  static registerCall(targetClass: Function, methodName: string, channel: string, timeout: number, queueGroup?: string): void {
    NatsListenerHost.callEntries.push({ targetClass, methodName, channel, timeout, queueGroup });
  }

  static registerListener(targetClass: Function, methodName: string, channel: string, queueGroup?: string): void {
    NatsListenerHost.listenerEntries.push({ targetClass, methodName, channel, queueGroup });
  }

  OnInit(): void {
    this.logger.debug('[NatsListenerHost] Initializing...');
    this.setupWithRetry();
  }

  private setupWithRetry(maxRetries = 30, retryDelayMs = 100): void {
    let retries = 0;

    const trySetup = () => {
      try {
        const natsClient = Container.get(NatsClientService);

        if (!natsClient.isReady()) {
          if (retries < maxRetries) {
            retries++;
            setTimeout(trySetup, retryDelayMs);
            return;
          }
          this.logger.error('[NatsListenerHost] Max retries reached, NATS client not ready');
          return;
        }

        if (!NatsListenerHost.connectionReady) {
          NatsListenerHost.connectionReady = true;
          this.setupAll(natsClient);
        }
      } catch (e) {
        this.logger.error('[NatsListenerHost] Error:', e);
        if (retries < maxRetries) {
          retries++;
          setTimeout(trySetup, retryDelayMs);
        }
      }
    };

    trySetup();
  }

  private setupAll(natsClient: NatsClientService): void {
    if (NatsListenerHost.initialized) {
      return;
    }

    this.logger.info('[NatsListenerHost] Setting up all handlers...');
    this.setupCallHandlers(natsClient);
    this.setupListenerHandlers(natsClient);
    NatsListenerHost.initialized = true;
    this.logger.info('[NatsListenerHost] All handlers subscribed');
  }

  private setupCallHandlers(natsClient: NatsClientService): void {
    for (const entry of NatsListenerHost.callEntries) {
      try {
        const instance: any = Container.get(entry.targetClass as any);
        this.logger.info(`[@NatsCall] Subscribing request handler: ${entry.channel} -> ${instance.constructor.name}.${entry.methodName}${entry.queueGroup ? ` (queue: ${entry.queueGroup})` : ''}`);

        natsClient.subscribeRequestHandler(entry.channel, async (request: any) => {
          try {
            this.logger.debug(`[@NatsCall] Received request on ${entry.channel}:`, request);
            const result = await instance[entry.methodName](request);
            this.logger.debug(`[@NatsCall] Handler result for ${entry.channel}:`, result);
            return result;
          } catch (e) {
            this.logger.error(`[@NatsCall] Error in handler ${entry.methodName}:`, e);
            return { error: (e as Error).message };
          }
        }, entry.queueGroup);
      } catch (e) {
        this.logger.error(`[@NatsCall] Could not get instance of ${entry.targetClass.name}:`, e);
      }
    }
  }

  private setupListenerHandlers(natsClient: NatsClientService): void {
    for (const entry of NatsListenerHost.listenerEntries) {
      try {
        const instance: any = Container.get(entry.targetClass as any);
        this.logger.info(`[@NatsListener] Subscribing: ${entry.channel} -> ${instance.constructor.name}.${entry.methodName}${entry.queueGroup ? ` (queue: ${entry.queueGroup})` : ''}`);

        natsClient.subscribe(entry.channel, async (data: any) => {
          try {
            await instance[entry.methodName](data);
          } catch (e) {
            this.logger.error(`[@NatsListener] Error calling ${entry.methodName}:`, e);
          }
        }, entry.queueGroup);
      } catch (e) {
        this.logger.error(`[@NatsListener] Could not get instance of ${entry.targetClass.name}:`, e);
      }
    }
  }
}