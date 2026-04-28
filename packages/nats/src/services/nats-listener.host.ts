import { Injectable, OnInit, Container } from '@rxdi/core';
import { NatsClientService } from './nats-client.service';

export interface ListenerEntry {
  targetClass: Function;
  methodName: string;
  channel: string;
}

@Injectable()
export class NatsListenerHost implements OnInit {
  private static listeners: ListenerEntry[] = [];

  static register(targetClass: Function, methodName: string, channel: string): void {
    NatsListenerHost.listeners.push({ targetClass, methodName, channel });
    console.log(`[@NatsListener] Registered: ${targetClass.name}.${methodName} on ${channel}`);
  }

  OnInit(): void {
    console.log('[NatsListenerHost] Initializing...');
    this.setupListeners();
  }

  private setupListeners(): void {
    const trySetup = () => {
      try {
        const natsClient = Container.get(NatsClientService);
        if (!natsClient.isReady()) {
          setTimeout(trySetup, 500);
          return;
        }
        this.subscribeAllListeners(natsClient);
      } catch (e) {
        console.error('[NatsListenerHost] Error:', e);
        setTimeout(trySetup, 500);
      }
    };
    setTimeout(trySetup, 100);
  }

  private subscribeAllListeners(natsClient: NatsClientService): void {
    for (const entry of NatsListenerHost.listeners) {
      try {
        const instance: any = Container.get(entry.targetClass as any);
        console.log(`[@NatsListenerHost] Subscribing: ${entry.channel} -> ${instance.constructor.name}.${entry.methodName}`);

        natsClient.subscribe(entry.channel, async (data: any) => {
          try {
            await instance[entry.methodName](null, data);
          } catch (e) {
            console.error(`[@NatsListenerHost] Error calling ${entry.methodName}:`, e);
          }
        });
      } catch (e) {
        console.error(`[@NatsListenerHost] Could not get instance of ${entry.targetClass.name}:`, e);
      }
    }
  }
}