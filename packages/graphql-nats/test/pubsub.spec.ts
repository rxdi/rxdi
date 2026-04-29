import { NatsPubSub, NatsPubSubAsyncIterator, createNatsPubSub } from '../src/nats-pubsub.class';
import { NatsPubSubInterface } from '../src/interfaces';

const createMockNatsClient = () => {
  const subscriptions = new Map<number, { unsubscribe: jest.Mock }>();
  let subscriptionId = 0;

  return {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockImplementation((channel: string, callback: (msg: any) => void) => {
      const id = ++subscriptionId;
      subscriptions.set(id, { unsubscribe: jest.fn() });
      return id;
    }),
    unsubscribe: jest.fn().mockImplementation((id: number) => {
      const sub = subscriptions.get(id);
      if (sub) {
        sub.unsubscribe();
        subscriptions.delete(id);
      }
    }),
    isReady: jest.fn().mockReturnValue(true),
  };
};

describe('NatsPubSub', () => {
  let mockNatsClient: ReturnType<typeof createMockNatsClient>;
  let pubsub: NatsPubSub;

  beforeEach(() => {
    mockNatsClient = createMockNatsClient();
    pubsub = new NatsPubSub(mockNatsClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publish', () => {
    it('should publish message to trigger channel', async () => {
      await pubsub.publish('game.crash', { crashPoint: 2.5 });
      expect(mockNatsClient.publish).toHaveBeenCalledWith('game.crash', { crashPoint: 2.5 });
    });

    it('should publish with string payload', async () => {
      await pubsub.publish('test.channel', 'hello');
      expect(mockNatsClient.publish).toHaveBeenCalledWith('test.channel', 'hello');
    });

    it('should publish multiple messages', async () => {
      await pubsub.publish('channel.1', { data: 1 });
      await pubsub.publish('channel.2', { data: 2 });
      await pubsub.publish('channel.3', { data: 3 });
      expect(mockNatsClient.publish).toHaveBeenCalledTimes(3);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to channel and return subscription id', async () => {
      const callback = jest.fn();
      const subId = await pubsub.subscribe('test.channel', callback);
      expect(subId).toBeDefined();
      expect(typeof subId).toBe('number');
      expect(mockNatsClient.subscribe).toHaveBeenCalledWith('test.channel', expect.any(Function));
    });

    it('should call callback when message is published', async () => {
      const callback = jest.fn();
      await pubsub.subscribe('game.crash', callback);
      const subscribeCallback = mockNatsClient.subscribe.mock.calls[0][1];
      const message = { crashPoint: 1.5, timestamp: Date.now() };
      await subscribeCallback(message);
      expect(callback).toHaveBeenCalledWith(message);
    });

    it('should handle multiple subscribers on same channel', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const subId1 = await pubsub.subscribe('game.crash', callback1);
      const subId2 = await pubsub.subscribe('game.crash', callback2);
      expect(subId1).not.toBe(subId2);
      const subscribeCallback = mockNatsClient.subscribe.mock.calls[0][1];
      const message = { crashPoint: 2.0 };
      await subscribeCallback(message);
      expect(callback1).toHaveBeenCalledWith(message);
      expect(callback2).toHaveBeenCalledWith(message);
    });

    it('should return different subscription ids for different channels', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const subId1 = await pubsub.subscribe('channel.1', callback1);
      const subId2 = await pubsub.subscribe('channel.2', callback2);
      expect(subId1).not.toBe(subId2);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe from channel', async () => {
      const callback = jest.fn();
      const subId = await pubsub.subscribe('test.channel', callback);
      await pubsub.unsubscribe(subId);
      expect(mockNatsClient.unsubscribe).toHaveBeenCalled();
    });

    it('should handle unsubscribe from non-existent subscription', async () => {
      await expect(pubsub.unsubscribe(9999)).resolves.not.toThrow();
    });

    it('should not unsubscribe nats client when multiple subscribers exist', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const subId1 = await pubsub.subscribe('game.crash', callback1);
      const subId2 = await pubsub.subscribe('game.crash', callback2);
      await pubsub.unsubscribe(subId1);
      expect(mockNatsClient.unsubscribe).not.toHaveBeenCalled();
      await pubsub.unsubscribe(subId2);
      expect(mockNatsClient.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('asyncIterator', () => {
    it('should return NatsPubSubAsyncIterator instance', () => {
      const iterator = pubsub.asyncIterator('test.channel');
      expect(iterator).toBeInstanceOf(NatsPubSubAsyncIterator);
    });

    it('should return iterator for asyncIterableIterator', () => {
      const iterator = pubsub.asyncIterableIterator('test.channel');
      expect(iterator).toBeInstanceOf(NatsPubSubAsyncIterator);
    });
  });
});

describe('NatsPubSubAsyncIterator', () => {
  let mockNatsClient: ReturnType<typeof createMockNatsClient>;
  let mockPubSub: NatsPubSubInterface;
  let iterator: NatsPubSubAsyncIterator<{ crashPoint: number }>;

  beforeEach(() => {
    mockNatsClient = createMockNatsClient();
    mockPubSub = new NatsPubSub(mockNatsClient);
    iterator = new NatsPubSubAsyncIterator(mockPubSub, 'game.crash');
  });

  describe('next', () => {
    it('should subscribe to trigger on first call', async () => {
      iterator.next();
      await Promise.resolve();
      expect(mockNatsClient.subscribe).toHaveBeenCalledWith('game.crash', expect.any(Function));
    });
  });

  describe('return', () => {
    it('should return done: true', async () => {
      const result = await iterator.return();
      expect(result).toEqual({ value: undefined, done: true });
    });
  });

  describe('throw', () => {
    it('should reject with error', async () => {
      await expect(iterator.throw!(new Error('test error'))).rejects.toThrow('test error');
    });
  });

  describe('Symbol.asyncIterator', () => {
    it('should return itself', () => {
      expect(iterator[Symbol.asyncIterator]()).toBe(iterator);
    });
  });
});

describe('createNatsPubSub factory', () => {
  it('should create NatsPubSub instance', () => {
    const mockClient = createMockNatsClient();
    const pubsub = createNatsPubSub(mockClient);
    expect(pubsub).toBeInstanceOf(NatsPubSub);
  });
});

describe('NatsPubSub Integration Style Tests', () => {
  let mockNatsClient: ReturnType<typeof createMockNatsClient>;
  let pubsub: NatsPubSub;

  beforeEach(() => {
    mockNatsClient = createMockNatsClient();
    pubsub = new NatsPubSub(mockNatsClient);
  });

  it('should handle pubsub workflow like crash game events', async () => {
    const crashEvents: any[] = [];
    const cashOutEvents: any[] = [];

    const crashSubId = await pubsub.subscribe('game.crash', (msg) => {
      crashEvents.push(msg);
    });

    const cashOutSubId = await pubsub.subscribe('game.cashout', (msg) => {
      cashOutEvents.push(msg);
    });

    expect(crashSubId).toBeDefined();
    expect(cashOutSubId).toBeDefined();
    expect(crashSubId).not.toBe(cashOutSubId);

    const crashCallback = mockNatsClient.subscribe.mock.calls[0][1];
    const cashOutCallback = mockNatsClient.subscribe.mock.calls[1][1];

    await crashCallback({ crashPoint: 1.23, timestamp: Date.now() });
    await cashOutCallback({ playerId: 'player1', amount: 50 });

    expect(crashEvents).toHaveLength(1);
    expect(crashEvents[0].crashPoint).toBe(1.23);
    expect(cashOutEvents).toHaveLength(1);
    expect(cashOutEvents[0].playerId).toBe('player1');

    await pubsub.unsubscribe(crashSubId);

    await crashCallback({ crashPoint: 5.67, timestamp: Date.now() });

    expect(crashEvents).toHaveLength(1);
    expect(cashOutEvents).toHaveLength(1);
  });

  it('should handle bet placement workflow', async () => {
    const betPlacedEvents: any[] = [];
    const subId = await pubsub.subscribe('game.bet.placed', async (msg) => {
      betPlacedEvents.push(msg);
    });

    const callback = mockNatsClient.subscribe.mock.calls[0][1];

    await callback({
      betId: 'bet_123',
      playerId: 'player_abc',
      amount: 100,
      autoCashOut: 2.0
    });

    expect(betPlacedEvents).toHaveLength(1);
    expect(betPlacedEvents[0]).toEqual({
      betId: 'bet_123',
      playerId: 'player_abc',
      amount: 100,
      autoCashOut: 2.0
    });

    await pubsub.unsubscribe(subId);
  });
});