import { NatsPubSubInterface } from './interfaces';

export class NatsPubSub implements NatsPubSubInterface {
  private subscriptionMap = new Map<number, [string, (m: any) => Promise<void>]>();
  private subsRefsMap = new Map<string, number[]>();
  private currentSubscriptionId = 0;
  private unsubscribeMap = new Map<string, () => void>();
  private subscriptionIds: Map<string, number> = new Map();
  private natsClient: any;

  constructor(natsClient: any) {
    this.natsClient = natsClient;
  }

  async publish(trigger: string, payload: any): Promise<void> {
    await this.natsClient.publish(trigger, payload);
  }

  async subscribe<T>(
    trigger: string,
    onMessage: (m: T) => Promise<void>
  ): Promise<number> {
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

    this.subscriptionIds.set(trigger, subId);
    this.subsRefsMap.set(trigger, [id]);

    return id;
  }

  async unsubscribe(subId: number): Promise<void> {
    const entry = this.subscriptionMap.get(subId);
    const triggerName = entry?.[0];

    if (!triggerName) {
      return;
    }

    const refs = this.subsRefsMap.get(triggerName);
    if (!refs) return;

    if (refs.length === 1) {
      const natsSubId = this.subscriptionIds.get(triggerName);
      if (natsSubId !== undefined) {
        this.natsClient.unsubscribe(natsSubId);
        this.subscriptionIds.delete(triggerName);
      }
      this.subsRefsMap.delete(triggerName);
    } else {
      this.subsRefsMap.set(
        triggerName,
        refs.filter((id) => id !== subId)
      );
    }

    this.subscriptionMap.delete(subId);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new NatsPubSubAsyncIterator<T>(this, triggers);
  }

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return new NatsPubSubAsyncIterator<T>(this, triggers);
  }
}

export class NatsPubSubAsyncIterator<T> implements AsyncIterator<T> {
  private subscriptionId: number | null = null;
  private listeners: Array<(value: T) => void> = [];
  private resolveReturn!: (value: { value: T; done: boolean }) => void;
  private rejectPromise!: (reason: any) => void;
  private returnPromise: Promise<{ value: T; done: boolean }>;

  constructor(
    private pubsub: NatsPubSubInterface,
    private triggers: string | string[]
  ) {
    this.returnPromise = new Promise<{ value: T; done: boolean }>((resolve, reject) => {
      this.resolveReturn = resolve;
      this.rejectPromise = reject;
    });
  }

  async next(): Promise<{ value: T; done: boolean }> {
    if (!this.subscriptionId) {
      const trigger = Array.isArray(this.triggers) ? this.triggers[0] : this.triggers;
      this.subscriptionId = await this.pubsub.subscribe(
        trigger,
        async (message: T) => {
          for (const listener of this.listeners) {
            listener(message);
          }
        }
      ) as any;
    }

    return new Promise<{ value: T; done: boolean }>((resolve) => {
      const listener = (value: T) => {
        this.listeners = this.listeners.filter((l) => l !== listener);
        resolve({ value, done: false });
      };
      this.listeners.push(listener);
    });
  }

  async return(): Promise<{ value: T; done: boolean }> {
    if (this.subscriptionId) {
      await this.pubsub.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
    return { value: undefined as any, done: true };
  }

  async throw?(error?: any): Promise<never> {
    if (this.subscriptionId) {
      await this.pubsub.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }
    return Promise.reject(error);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }
}

export function createNatsPubSub(natsClient: any): NatsPubSub {
  return new NatsPubSub(natsClient);
}