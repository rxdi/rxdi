import { NatsPubSubInterface } from '../interfaces';

/**
 * Async iterator over a NATS subject with an internal message buffer.
 *
 * The buffer is what makes delivery loss-free: the GraphQL execution layer
 * pulls with `next()` one result at a time, and between resolving result N
 * and requesting result N+1 there is always at least one microtask gap. Two
 * messages published back-to-back (e.g. two CASHED_OUT events settled in the
 * same engine tick) used to race that gap — the second message arrived while
 * no `next()` was pending and was silently discarded. Now every incoming
 * message either resolves a pending pull immediately or is queued in arrival
 * order until the next pull (the standard push/pull-queue pattern from
 * graphql-subscriptions' PubSubAsyncIterator).
 *
 * Also fixed relative to the previous implementation:
 * - a subscription id of 0 (the first id NatsPubSub hands out) was treated
 *   as "not subscribed", causing a duplicate subscription on every `next()`;
 *   the subscription is now tracked by promise, not by truthiness of the id.
 * - two concurrent first `next()` calls could each open a subscription; the
 *   shared promise makes the subscription happen exactly once.
 * - `return()` now drains pending pulls with `done: true` so the GraphQL
 *   layer's cleanup never hangs on an unresolved `next()`.
 */
export class PubSubAsyncIterator<T> implements AsyncIterator<T> {
  private pullQueue: Array<(result: IteratorResult<T>) => void> = [];
  private pushQueue: T[] = [];
  private running = true;
  private subscriptionPromise: Promise<number> | null = null;

  constructor(
    private pubsub: NatsPubSubInterface,
    private triggers: string | string[]
  ) {}

  async next(): Promise<IteratorResult<T>> {
    await this.subscribeOnce();

    if (!this.running) {
      return { value: undefined as any, done: true };
    }

    if (this.pushQueue.length) {
      return { value: this.pushQueue.shift() as T, done: false };
    }

    return new Promise<IteratorResult<T>>((resolve) => {
      this.pullQueue.push(resolve);
    });
  }

  async return(): Promise<IteratorResult<T>> {
    await this.shutdown();
    return { value: undefined as any, done: true };
  }

  async throw?(error?: any): Promise<never> {
    await this.shutdown();
    return Promise.reject(error);
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }

  /** Subscribe exactly once, no matter how many `next()` calls race here. */
  private subscribeOnce(): Promise<number> {
    if (!this.subscriptionPromise) {
      const trigger = Array.isArray(this.triggers)
        ? this.triggers[0]
        : this.triggers;
      this.subscriptionPromise = this.pubsub.subscribe(
        trigger,
        async (message: T) => this.pushValue(message)
      );
    }
    return this.subscriptionPromise;
  }

  /** Hand the message to a pending pull, or buffer it in arrival order. */
  private pushValue(message: T): void {
    if (!this.running) {
      return;
    }
    const resolve = this.pullQueue.shift();
    if (resolve) {
      resolve({ value: message, done: false });
    } else {
      this.pushQueue.push(message);
    }
  }

  private async shutdown(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.running = false;

    for (const resolve of this.pullQueue) {
      resolve({ value: undefined as any, done: true });
    }
    this.pullQueue.length = 0;
    this.pushQueue.length = 0;

    if (this.subscriptionPromise) {
      const pending = this.subscriptionPromise;
      this.subscriptionPromise = null;
      const subscriptionId = await pending.catch(() => null);
      if (subscriptionId !== null && subscriptionId !== undefined) {
        await this.pubsub.unsubscribe(subscriptionId);
      }
    }
  }
}
