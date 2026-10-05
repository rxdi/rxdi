import { NatsClientInterface, NatsPubSubInterface } from '../interfaces';
import { PubSubAsyncIterator } from './pubsub-async-iterator';


/**
 * Dispatch one message to every listener at once and wait for all of them,
 * never letting one rejection hide the others. `resolve` looks a subscriber
 * id up at dispatch time, so a listener unsubscribed mid-flight is skipped.
 */
export async function fanOut<T>(
  subscriberIds: readonly number[],
  resolve: (id: number) => ((m: T) => Promise<void>) | undefined,
  message: T,
  onError: (id: number, error: unknown) => void
): Promise<void> {
  const pending: Promise<void>[] = [];
  for (const sId of subscriberIds) {
    const listener = resolve(sId);
    if (!listener) continue;
    let p: Promise<void>;
    try {
      p = Promise.resolve(listener(message));
    } catch (e) {
      onError(sId, e);
      continue;
    }
    pending.push(p.catch((e) => onError(sId, e)));
  }
  if (pending.length) await Promise.all(pending);
}

export class NatsPubSub implements NatsPubSubInterface {
  private subscriptionMap = new Map<number, [string, (m: any) => Promise<void>]>();
  private subsRefsMap = new Map<string, number[]>();
  private currentSubscriptionId = 0;
  private unsubscribeMap = new Map<string, () => void>();
  private subscriptionIds: Map<string, number> = new Map();
  private natsClient: NatsClientInterface;

  constructor(natsClient: NatsClientInterface) {
    this.natsClient = natsClient;
  }

  async publish(trigger: string, payload: any): Promise<void> {
    await this.natsClient.publish(trigger, payload);
  }

  protected onListenerError(trigger: string, subscriberId: number, error: unknown): void {
    console.error(`[NatsPubSub] listener ${subscriberId} on ${trigger} failed:`, error);
  }

  async subscribe<T>(
    trigger: string,
    onMessage: (m: T) => Promise<void>,
    config?: any
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
      this.unsubscribeMap.delete(triggerName);
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

/**
 * Kept as a distinct exported name for backwards compatibility; the buffered,
 * loss-free implementation lives in PubSubAsyncIterator (see its doc comment
 * for the same-tick message-drop bug this fixes).
 */
export class NatsPubSubAsyncIterator<T> extends PubSubAsyncIterator<T> {}

export function createNatsPubSub(natsClient: NatsClientInterface): NatsPubSub {
  return new NatsPubSub(natsClient);
}