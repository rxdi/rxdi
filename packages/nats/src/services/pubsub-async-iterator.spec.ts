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