import { NatsClientService } from './nats-client.service';
import { NatsLoggerService } from './nats-logger.service';

const encoder = new TextEncoder();

interface FakeMsg {
  data: Uint8Array;
  reply?: string;
}

class FakeSubscription implements AsyncIterable<FakeMsg> {
  readonly channel: string;
  private queue: FakeMsg[] = [];
  private waiters: ((r: IteratorResult<FakeMsg>) => void)[] = [];
  private ended = false;

  constructor(channel: string) {
    this.channel = channel;
  }

  push(msg: FakeMsg): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value: msg, done: false });
    } else {
      this.queue.push(msg);
    }
  }

  unsubscribe(): void {
    this.ended = true;
    while (this.waiters.length) {
      this.waiters.shift()!({ value: undefined as any, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<FakeMsg> {
    return {
      next: (): Promise<IteratorResult<FakeMsg>> => {
        if (this.queue.length) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.ended) {
          return Promise.resolve({ value: undefined as any, done: true });
        }
        return new Promise((resolve) => this.waiters.push(resolve));
      },
    };
  }
}

class FakeConnection {
  subs: FakeSubscription[] = [];
  published: { channel: string; message: string }[] = [];
  private closedResolvers: ((err?: Error) => void)[] = [];

  subscribe(channel: string): FakeSubscription {
    const sub = new FakeSubscription(channel);
    this.subs.push(sub);
    return sub;
  }

  publish(channel: string, message: string): void {
    this.published.push({ channel, message });
  }

  closed(): Promise<void | Error> {
    return new Promise((resolve) => this.closedResolvers.push(resolve as any));
  }

  async close(): Promise<void> {
    this.die();
  }

  /** Simulates the connection dying on its own (fatal error / evicted / exhausted reconnects). */
  die(err?: Error): void {
    for (const sub of this.subs) sub.unsubscribe();
    const resolvers = this.closedResolvers;
    this.closedResolvers = [];
    for (const resolve of resolvers) resolve(err);
  }

  findSub(channel: string): FakeSubscription {
    const sub = [...this.subs].reverse().find((s) => s.channel === channel);
    if (!sub) throw new Error(`no subscription for ${channel}`);
    return sub;
  }
}

const connections: FakeConnection[] = [];

jest.mock('@nats-io/transport-node', () => ({
  connect: jest.fn(),
}));

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('waitFor: condition not met before timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function makeService(): NatsClientService {
  return new NatsClientService(
    { servers: ['nats://localhost:4222'], reconnectTimeWait: 10 } as any,
    new NatsLoggerService(false),
  );
}

describe('NatsClientService reconnect behaviour', () => {
  beforeEach(() => {
    connections.length = 0;
    const { connect } = require('@nats-io/transport-node');
    (connect as jest.Mock).mockClear();
    (connect as jest.Mock).mockImplementation(async () => {
      const conn = new FakeConnection();
      connections.push(conn);
      return conn;
    });
  });

  it('re-establishes request handlers against a new connection after the old one dies unexpectedly', async () => {
    const service = makeService();
    await service.connect();
    expect(service.isReady()).toBe(true);
    expect(connections).toHaveLength(1);

    const results: any[] = [];
    await service.subscribeRequestHandler('card-game-engine.create-match-with-bot', async (data) => {
      results.push(data);
      return { ok: true };
    });

    const firstConn = connections[0];
    const firstSub = firstConn.findSub('card-game-engine.create-match-with-bot');
    firstSub.push({ data: encoder.encode(JSON.stringify({ n: 1 })), reply: 'reply.1' });
    await waitFor(() => results.length === 1);
    await waitFor(() => firstConn.published.length === 1);
    expect(JSON.parse(firstConn.published[0].message)).toEqual({ ok: true });

    // Simulate the connection dying for good (fatal error), the exact
    // scenario from the "Connection is closed." bug report — no restart
    // should be required to recover.
    firstConn.die(new Error('Connection is closed.'));

    await waitFor(() => connections.length === 2, 5000);
    await waitFor(() => service.isReady(), 5000);

    const secondConn = connections[1];
    const secondSub = secondConn.findSub('card-game-engine.create-match-with-bot');
    secondSub.push({ data: encoder.encode(JSON.stringify({ n: 2 })), reply: 'reply.2' });
    await waitFor(() => results.length === 2);
    expect(results).toEqual([{ n: 1 }, { n: 2 }]);
    await waitFor(() => secondConn.published.length === 1);
    expect(JSON.parse(secondConn.published[0].message)).toEqual({ ok: true });
  }, 10000);

  it('re-establishes plain subscriptions after reconnect', async () => {
    const service = makeService();
    await service.connect();

    const received: any[] = [];
    await service.subscribe('some.topic', (msg) => {
      received.push(msg);
    });

    const firstConn = connections[0];
    firstConn.die(new Error('boom'));

    await waitFor(() => connections.length === 2, 5000);
    await waitFor(() => service.isReady(), 5000);

    const secondSub = connections[1].findSub('some.topic');
    secondSub.push({ data: encoder.encode(JSON.stringify({ hello: 'world' })) });
    await waitFor(() => received.length === 1);
    expect(received[0]).toEqual({ hello: 'world' });
  }, 10000);

  it('does not attempt to reconnect after an explicit close()', async () => {
    const service = makeService();
    await service.connect();
    expect(connections).toHaveLength(1);

    await service.close();
    expect(service.isReady()).toBe(false);

    // Give the (absent) reconnect loop a chance to have kicked in if the
    // closing flag were not respected.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(connections).toHaveLength(1);
    expect(service.isReady()).toBe(false);
  });
});
