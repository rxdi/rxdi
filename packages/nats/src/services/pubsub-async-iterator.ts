import { NatsPubSubInterface } from '../interfaces';

export class PubSubAsyncIterator<T> implements AsyncIterator<T> {
  private subscriptionId: number | null = null;
  private listeners: Array<(value: T) => void> = [];
  private returnPromise: Promise<{ value: T; done: boolean }>;
  private resolveReturn!: (value: { value: T; done: boolean }) => void;
  private rejectPromise!: (reason: any) => void;

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