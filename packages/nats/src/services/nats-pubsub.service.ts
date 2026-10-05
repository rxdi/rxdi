import { Injectable, Inject, OnInit } from '@rxdi/core';
import { NatsClientService } from './nats-client.service';
import { NatsPubSubInterface, NATS_LOGGER } from '../interfaces';
import { NatsLoggerService } from './nats-logger.service';
import { PubSubAsyncIterator } from './pubsub-async-iterator';
import { fanOut } from './nats-pubsub.class';

@Injectable()
export class NatsPubSubService implements NatsPubSubInterface, OnInit {
  private subscriptionMap = new Map<number, [string, (m: any) => Promise<void>]>();
  private subsRefsMap = new Map<string, number[]>();
  private currentSubscriptionId = 0;
  private unsubscribeMap = new Map<string, () => void>();

  constructor(
    private natsClient: NatsClientService,
    @Inject(NATS_LOGGER) private logger: NatsLoggerService
  ) {}

  OnInit(): void {}

  private onListenerError(trigger: string, subscriberId: number, error: unknown): void {
    this.logger.error(`[NatsPubSubService] listener ${subscriberId} on ${trigger} failed:`, error);
  }

  async publish(trigger: string, payload: any): Promise<void> {
    if (!this.natsClient.isReady()) {
      throw new Error('NATS client is not connected');
    }
    await this.natsClient.publish(trigger, payload);
    this.logger.debug(`[NatsPubSubService] Published to ${trigger}:`, payload);
  }

  async subscribe<T>(
    trigger: string,
    onMessage: (m: T) => Promise<void>
  ): Promise<number> {
    if (!this.natsClient.isReady()) {
      throw new Error('NATS client is not connected');
    }

    const id = this.currentSubscriptionId++;
    this.subscriptionMap.set(id, [trigger, onMessage as (m: any) => Promise<void>]);

    const refs = this.subsRefsMap.get(trigger);
    if (refs?.length) {
      this.subsRefsMap.set(trigger, [...refs, id]);
      return id;
    }

    const subId = await this.natsClient.subscribe(trigger, async (msg: any) => {
      const subscribers = this.subsRefsMap.get(trigger);
      if (!subscribers?.length) return;

      // Fan out to every subscriber CONCURRENTLY and isolate failures. The
      // previous `for … await listener(msg)` chained all N listeners behind
      // each other (the last subscriber waited for N-1 others on every
      // message, so delivery skew grew linearly with N), and one rejecting
      // listener aborted the loop so every subscriber after it silently
      // missed the message. A listener is a buffered iterator push in the
      // GraphQL case, so this is also what keeps a 200 ms tick feed from
      // queueing behind hundreds of sequential awaits.
      await fanOut(subscribers, (sId) => this.subscriptionMap.get(sId)?.[1], msg, (sId, err) =>
        this.onListenerError(trigger, sId, err));
    });

    this.unsubscribeMap.set(trigger, () => this.natsClient.unsubscribe(subId));
    this.subsRefsMap.set(trigger, [id]);

    this.logger.debug(`[NatsPubSubService] Subscribed to ${trigger}`);
    return id;
  }

  async unsubscribe(subId: number): Promise<void> {
    const entry = this.subscriptionMap.get(subId);
    const triggerName = entry?.[0];

    if (!triggerName) return;

    const refs = this.subsRefsMap.get(triggerName);
    if (!refs) return;

    if (refs.length === 1) {
      const unsubscribe = this.unsubscribeMap.get(triggerName);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      this.unsubscribeMap.delete(triggerName);
      this.subsRefsMap.delete(triggerName);
    } else {
      this.subsRefsMap.set(triggerName, refs.filter((id) => id !== subId));
    }

    this.subscriptionMap.delete(subId);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers);
  }

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers);
  }
}