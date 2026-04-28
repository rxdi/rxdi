import { Injectable, Inject, OnInit } from '@rxdi/core';
import { NatsClientService } from './nats-client.service';
import { NatsPubSubInterface } from '../interfaces';
import { PubSubAsyncIterator } from './pubsub-async-iterator';

@Injectable()
export class NatsPubSubService implements NatsPubSubInterface, OnInit {
  private subscriptionMap = new Map<number, [string, (m: any) => Promise<void>]>();
  private subsRefsMap = new Map<string, number[]>();
  private currentSubscriptionId = 0;
  private unsubscribeMap = new Map<string, () => void>();

  constructor(private natsClient: NatsClientService) {}

  OnInit(): void {}

  async publish(trigger: string, payload: any): Promise<void> {
    if (!this.natsClient.isReady()) {
      throw new Error('NATS client is not connected');
    }
    await this.natsClient.publish(trigger, payload);
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

      for (const sId of subscribers) {
        const entry = this.subscriptionMap.get(sId);
        if (!entry) continue;
        const [, listener] = entry;
        await listener(msg);
      }
    });

    this.unsubscribeMap.set(trigger, () => this.natsClient.unsubscribe(subId));
    this.subsRefsMap.set(trigger, [id]);

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