import { PubSubAsyncIterator } from './pubsub-async-iterator';
import { NatsPubSubInterface } from '../interfaces';

describe('PubSubAsyncIterator', () => {
  let mockPubSub: jest.Mocked<NatsPubSubInterface>;

  beforeEach(() => {
    mockPubSub = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(1),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      asyncIterator: jest.fn(),
      asyncIterableIterator: jest.fn(),
    } as any;
  });

  describe('constructor', () => {
    it('should create iterator with single trigger string', () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      expect(iterator).toBeDefined();
    });

    it('should create iterator with array of triggers', () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, ['channel1', 'channel2']);
      expect(iterator).toBeDefined();
    });
  });

  describe('next', () => {
    it('should subscribe to trigger on first call', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      iterator.next();
      await Promise.resolve();
      expect(mockPubSub.subscribe).toHaveBeenCalledWith('test.channel', expect.any(Function));
    });

    it('should use first trigger when array provided', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, ['channel1', 'channel2']);
      iterator.next();
      await Promise.resolve();
      expect(mockPubSub.subscribe).toHaveBeenCalledWith('channel1', expect.any(Function));
    });
  });

  describe('message buffering (same-tick burst)', () => {
    let handler: (message: string) => Promise<void>;

    beforeEach(() => {
      mockPubSub.subscribe.mockImplementation(async (_trigger, onMessage) => {
        handler = onMessage as (message: string) => Promise<void>;
        return 0; // first id NatsPubSub hands out — must not be treated as falsy
      });
    });

    it('delivers both messages of a back-to-back burst', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const first = iterator.next();
      await Promise.resolve(); // let the subscription settle

      // two publishes in the same tick — the second used to be dropped
      handler('cashed-out-slot-0');
      handler('cashed-out-slot-1');

      expect(await first).toEqual({ value: 'cashed-out-slot-0', done: false });
      expect(await iterator.next()).toEqual({ value: 'cashed-out-slot-1', done: false });
    });

    it('buffers messages arriving while no next() is pending', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const first = iterator.next();
      await Promise.resolve();
      handler('a');
      await first;

      // subscription is live but nothing is pulling
      handler('b');
      handler('c');

      expect(await iterator.next()).toEqual({ value: 'b', done: false });
      expect(await iterator.next()).toEqual({ value: 'c', done: false });
    });

    it('preserves arrival order across buffered and pending pulls', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const first = iterator.next();
      await Promise.resolve();

      handler('1');
      handler('2');
      handler('3');

      expect(await first).toEqual({ value: '1', done: false });
      expect(await iterator.next()).toEqual({ value: '2', done: false });
      expect(await iterator.next()).toEqual({ value: '3', done: false });
    });

    it('subscribes exactly once for concurrent first next() calls', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const pulls = [iterator.next(), iterator.next()];
      await Promise.resolve();

      expect(mockPubSub.subscribe).toHaveBeenCalledTimes(1);

      handler('x');
      handler('y');
      expect(await pulls[0]).toEqual({ value: 'x', done: false });
      expect(await pulls[1]).toEqual({ value: 'y', done: false });
    });

    it('unsubscribes on return() even when the subscription id is 0', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const first = iterator.next();
      await Promise.resolve();
      handler('a');
      await first;

      await iterator.return();
      expect(mockPubSub.unsubscribe).toHaveBeenCalledWith(0);
    });

    it('resolves pending next() calls with done: true on return()', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'game.events');
      const pending = iterator.next();
      await Promise.resolve();

      await iterator.return();
      expect(await pending).toEqual({ value: undefined, done: true });
      expect(await iterator.next()).toEqual({ value: undefined, done: true });
    });
  });

  describe('return', () => {
    it('should unsubscribe when return is called', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      await iterator.return();
      expect(mockPubSub.unsubscribe).not.toHaveBeenCalled();
    });

    it('should return done: true', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      const result = await iterator.return();
      expect(result).toEqual({ value: undefined, done: true });
    });

    it('should handle return when not subscribed', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      const result = await iterator.return();
      expect(result).toEqual({ value: undefined, done: true });
    });
  });

  describe('throw', () => {
    it('should reject with error', async () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      await expect(iterator.throw!(new Error('test error'))).rejects.toThrow('test error');
    });
  });

  describe('Symbol.asyncIterator', () => {
    it('should return itself', () => {
      const iterator = new PubSubAsyncIterator<string>(mockPubSub, 'test.channel');
      expect(iterator[Symbol.asyncIterator]()).toBe(iterator);
    });
  });
});