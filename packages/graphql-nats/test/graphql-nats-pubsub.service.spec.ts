import { GraphQLNatsPubSubService } from '../src/graphql-nats-pubsub.service';
import { NatsPubSub } from '../src/nats-pubsub.class';

jest.mock('../src/nats-pubsub.class', () => ({
  NatsPubSub: jest.fn().mockImplementation(() => ({
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(1),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    asyncIterableIterator: jest.fn().mockReturnValue({
      next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
      [Symbol.asyncIterator]: function() { return this; }
    }),
    asyncIterator: jest.fn().mockReturnValue({
      next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
      [Symbol.asyncIterator]: function() { return this; }
    }),
  })),
}));

jest.mock('@rxdi/core', () => ({
  Container: {
    get: jest.fn().mockReturnValue({
      isReady: jest.fn().mockReturnValue(true),
    }),
  },
  Service: () => () => {},
}));

(global as any).NatsClientService = {
  isReady: jest.fn().mockReturnValue(true),
};

describe('GraphQLNatsPubSubService', () => {
  let service: GraphQLNatsPubSubService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GraphQLNatsPubSubService();
  });

  describe('constructor', () => {
    it('should create NatsPubSub instance', () => {
      expect(NatsPubSub).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should call natsPubSub.publish', async () => {
      await service.publish('game.crash', { crashPoint: 2.5 });
      expect(service.natsPubSub.publish).toHaveBeenCalledWith('game.crash', { crashPoint: 2.5 });
    });

    it('should publish string data', async () => {
      await service.publish('test.channel', 'hello');
      expect(service.natsPubSub.publish).toHaveBeenCalledWith('test.channel', 'hello');
    });
  });

  describe('subscribe', () => {
    it('should call natsPubSub.subscribe', async () => {
      const callback = jest.fn();
      const subId = await service.subscribe('test.channel', callback);
      expect(service.natsPubSub.subscribe).toHaveBeenCalledWith('test.channel', callback);
      expect(subId).toBe(1);
    });
  });

  describe('unsubscribe', () => {
    it('should call natsPubSub.unsubscribe', async () => {
      await service.unsubscribe(1);
      expect(service.natsPubSub.unsubscribe).toHaveBeenCalledWith(1);
    });
  });

  describe('asyncIterator', () => {
    it('should return iterator from natsPubSub', () => {
      const iterator = service.asyncIterator('test.channel');
      expect(service.natsPubSub.asyncIterableIterator).toHaveBeenCalledWith('test.channel');
      expect(iterator).toBeDefined();
    });
  });

  describe('asyncIterableIterator', () => {
    it('should return iterator from natsPubSub', () => {
      const iterator = service.asyncIterableIterator('test.channel');
      expect(service.natsPubSub.asyncIterableIterator).toHaveBeenCalledWith('test.channel');
      expect(iterator).toBeDefined();
    });
  });

  describe('publishSignal', () => {
    it('should call natsPubSub.publish', async () => {
      await service.publishSignal('game.crash', { crashPoint: 1.5 });
      expect(service.natsPubSub.publish).toHaveBeenCalledWith('game.crash', { crashPoint: 1.5 });
    });
  });
});