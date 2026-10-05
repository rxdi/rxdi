import { fanOut, NatsPubSub } from './nats-pubsub.class';
import { NatsClientInterface } from '../interfaces';

/** A fake NATS client that records the one callback NatsPubSub registers per channel. */
function fakeClient() {
  const callbacks = new Map<string, (msg: any) => Promise<void>>();
  const client = {
    connect: jest.fn(),
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(async (channel: string, cb: (msg: any) => Promise<void>) => {
      callbacks.set(channel, cb);
      return 1;
    }),
    unsubscribe: jest.fn(),
    request: jest.fn(),
    close: jest.fn(),
    isReady: () => true,
    getClient: () => null,
  } as unknown as NatsClientInterface;
  return { client, deliver: (channel: string, msg: any) => callbacks.get(channel)!(msg) };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('NatsPubSub fan-out', () => {
  it('opens ONE NATS subscription per trigger and delivers every message to every subscriber', async () => {
    const { client, deliver } = fakeClient();
    const pubsub = new NatsPubSub(client);
    const a: any[] = [];
    const b: any[] = [];
    await pubsub.subscribe('game.events', async (m) => { a.push(m); });
    await pubsub.subscribe('game.events', async (m) => { b.push(m); });
    expect(client.subscribe).toHaveBeenCalledTimes(1);

    await deliver('game.events', { tick: 1 });
    await deliver('game.events', { tick: 2 });
    expect(a).toEqual([{ tick: 1 }, { tick: 2 }]);
    expect(b).toEqual([{ tick: 1 }, { tick: 2 }]);
  });

  it('does not chain subscribers: a slow listener never delays the others', async () => {
    const { client, deliver } = fakeClient();
    const pubsub = new NatsPubSub(client);
    const order: string[] = [];
    let releaseSlow!: () => void;
    await pubsub.subscribe('t', () => new Promise<void>((resolve) => { releaseSlow = () => { order.push('slow'); resolve(); }; }));
    await pubsub.subscribe('t', async () => { order.push('fast'); });

    const done = deliver('t', 'msg');
    await tick();
    // With the old sequential loop 'fast' could only run after 'slow' resolved.
    expect(order).toEqual(['fast']);
    releaseSlow();
    await done;
    expect(order).toEqual(['fast', 'slow']);
  });

  it('isolates a throwing listener: the remaining subscribers still receive the message', async () => {
    const { client, deliver } = fakeClient();
    const pubsub = new NatsPubSub(client);
    const errors: unknown[] = [];
    (pubsub as any).onListenerError = (_t: string, _id: number, e: unknown) => errors.push(e);
    const got: any[] = [];
    await pubsub.subscribe('t', async () => { throw new Error('boom-async'); });
    await pubsub.subscribe('t', (() => { throw new Error('boom-sync'); }) as any);
    await pubsub.subscribe('t', async (m) => { got.push(m); });

    await expect(deliver('t', 42)).resolves.toBeUndefined();
    expect(got).toEqual([42]);
    expect(errors.map((e) => (e as Error).message).sort()).toEqual(['boom-async', 'boom-sync']);
  });

  it('skips a subscriber that unsubscribed, and drops the NATS subscription with the last one', async () => {
    const { client, deliver } = fakeClient();
    const pubsub = new NatsPubSub(client);
    const got: any[] = [];
    const id1 = await pubsub.subscribe('t', async (m) => { got.push(['1', m]); });
    const id2 = await pubsub.subscribe('t', async (m) => { got.push(['2', m]); });
    await pubsub.unsubscribe(id1);
    await deliver('t', 'x');
    expect(got).toEqual([['2', 'x']]);
    expect(client.unsubscribe).not.toHaveBeenCalled();
    await pubsub.unsubscribe(id2);
    expect(client.unsubscribe).toHaveBeenCalledWith(1);
  });

  it('fanOut preserves per-subscriber ordering across back-to-back messages', async () => {
    const seen: number[] = [];
    const listener = async (m: number) => { await tick(); seen.push(m); };
    const resolve = () => listener;
    await fanOut([0], resolve, 1, () => undefined);
    await fanOut([0], resolve, 2, () => undefined);
    expect(seen).toEqual([1, 2]);
  });
});
