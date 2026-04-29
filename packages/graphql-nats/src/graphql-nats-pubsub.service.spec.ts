import { Container } from '@rxdi/core';
import {
  NatsPubSub,
  NatsPubSubAsyncIterator,
  createNatsPubSub,
} from './nats-pubsub.class';
import {
  PubSubProtocol,
  NatsPubSubInterface,
} from './interfaces';
import { GraphQLNatsPubSubService } from './graphql-nats-pubsub.service';
import { GraphQLNatsModule } from './index';

function createMockNatsClient() {
  const subscriptions = new Map<number, (msg: any) => void>();
  const subscriptionHandlers = new Map<number, { channel: string; callback: (msg: any) => void }>();
  let natsSubIdCounter = 0;

  return {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockImplementation((channel: string, callback: (msg: any) => void) => {
      const natsSubId = ++natsSubIdCounter;
      subscriptions.set(natsSubId, callback);
      subscriptionHandlers.set(natsSubId, { channel, callback });
      return Promise.resolve(natsSubId);
    }),
    unsubscribe: jest.fn().mockImplementation((natsSubId: number) => {
      subscriptions.delete(natsSubId);
      subscriptionHandlers.delete(natsSubId);
    }),
    _getSubscriptions: () => subscriptions,
    _getSubscriptionHandler: (natsSubId: number) => subscriptionHandlers.get(natsSubId),
    _triggerSubscription: (natsSubId: number, msg: any) => {
      const callback = subscriptions.get(natsSubId);
      if (callback) {
        callback(msg);
      }
    },
  };
}

describe('NatsPubSub', () => {
  let natsClient: ReturnType<typeof createMockNatsClient>;
  let natsPubSub: NatsPubSub;

  beforeEach(() => {
    natsClient = createMockNatsClient();
    natsPubSub = new NatsPubSub(natsClient);
  });

  describe('publish', () => {
    it('should call natsClient.publish with trigger and payload', async () => {
      await natsPubSub.publish('test.channel', { message: 'hello' });
      expect(natsClient.publish).toHaveBeenCalledWith('test.channel', { message: 'hello' });
    });

    it('should handle string payloads', async () => {
      await natsPubSub.publish('string.channel', 'plain string');
      expect(natsClient.publish).toHaveBeenCalledWith('string.channel', 'plain string');
    });

    it('should handle null payloads', async () => {
      await natsPubSub.publish('null.channel', null);
      expect(natsClient.publish).toHaveBeenCalledWith('null.channel', null);
    });

    it('should handle object payloads', async () => {
      const payload = { nested: { data: [1, 2, 3] } };
      await natsPubSub.publish('object.channel', payload);
      expect(natsClient.publish).toHaveBeenCalledWith('object.channel', payload);
    });
  });

  describe('subscribe', () => {
    it('should return a subscription id', async () => {
      const subId = await natsPubSub.subscribe('test.channel', async (msg) => {});
      expect(typeof subId).toBe('number');
      expect(subId).toBeGreaterThanOrEqual(0);
    });

    it('should call natsClient.subscribe for first subscription to a channel', async () => {
      await natsPubSub.subscribe('test.channel', async (msg) => {});
      expect(natsClient.subscribe).toHaveBeenCalledWith('test.channel', expect.any(Function));
    });

    it('should not call natsClient.subscribe for subsequent subscriptions to same channel', async () => {
      await natsPubSub.subscribe('test.channel', async (msg) => {});
      await natsPubSub.subscribe('test.channel', async (msg) => {});
      expect(natsClient.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should return different ids for different channels', async () => {
      const subId1 = await natsPubSub.subscribe('channel1', async (msg) => {});
      const subId2 = await natsPubSub.subscribe('channel2', async (msg) => {});
      expect(subId1).not.toBe(subId2);
    });

    it('should notify subscriber when message arrives on their channel', async () => {
      const handler = jest.fn();
      await natsPubSub.subscribe('test.channel', handler);

      const natsSubId = await natsClient.subscribe.mock.results[0].value;
      natsClient._triggerSubscription(natsSubId, { data: 'test message' });

      expect(handler).toHaveBeenCalledWith({ data: 'test message' });
    });

    it('should notify all subscribers on the same channel', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      await natsPubSub.subscribe('test.channel', handler1);
      await natsPubSub.subscribe('test.channel', handler2);

      const natsSubId = await natsClient.subscribe.mock.results[0].value;
      natsClient._triggerSubscription(natsSubId, { data: 'broadcast' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledWith({ data: 'broadcast' });
      expect(handler2).toHaveBeenCalledWith({ data: 'broadcast' });
    });
  });

  describe('unsubscribe', () => {
    it('should remove subscription from subscription map', async () => {
      const subId = await natsPubSub.subscribe('test.channel', async (msg) => {});
      await natsPubSub.unsubscribe(subId);

      const entry = (natsPubSub as any).subscriptionMap.get(subId);
      expect(entry).toBeUndefined();
    });

    it('should call natsClient.unsubscribe when last subscriber unsubscribes', async () => {
      const subId = await natsPubSub.subscribe('test.channel', async (msg) => {});
      await natsPubSub.unsubscribe(subId);

      expect(natsClient.unsubscribe).toHaveBeenCalled();
    });

    it('should not call natsClient.unsubscribe when other subscribers remain', async () => {
      const subId1 = await natsPubSub.subscribe('test.channel', async (msg) => {});
      await natsPubSub.subscribe('test.channel', async (msg) => {});

      await natsPubSub.unsubscribe(subId1);
      expect(natsClient.unsubscribe).not.toHaveBeenCalled();
    });

    it('should handle unsubscribing non-existent subscription', async () => {
      await expect(natsPubSub.unsubscribe(9999)).resolves.toBeUndefined();
    });

    it('should clean up subsRefsMap when last subscriber unsubscribes', async () => {
      const subId = await natsPubSub.subscribe('test.channel', async (msg) => {});
      await natsPubSub.unsubscribe(subId);

      const refs = (natsPubSub as any).subsRefsMap.get('test.channel');
      expect(refs).toBeUndefined();
    });
  });

  describe('asyncIterator', () => {
    it('should return NatsPubSubAsyncIterator instance', () => {
      const iterator = natsPubSub.asyncIterator('test.channel');
      expect(iterator).toBeInstanceOf(NatsPubSubAsyncIterator);
    });

    it('should accept array of triggers', () => {
      const iterator = natsPubSub.asyncIterator(['channel1', 'channel2']);
      expect(iterator).toBeInstanceOf(NatsPubSubAsyncIterator);
    });
  });

  describe('asyncIterableIterator', () => {
    it('should return NatsPubSubAsyncIterator instance', () => {
      const iterator = natsPubSub.asyncIterableIterator('test.channel');
      expect(iterator).toBeInstanceOf(NatsPubSubAsyncIterator);
    });
  });
});

describe('NatsPubSubAsyncIterator', () => {
  let natsClient: ReturnType<typeof createMockNatsClient>;
  let pubsub: NatsPubSubInterface;

  beforeEach(() => {
    natsClient = createMockNatsClient();
    pubsub = new NatsPubSub(natsClient);
  });

  describe('asyncIterator symbol', () => {
    it('should return itself when asyncIterator is called', () => {
      const iterator = pubsub.asyncIterator('test.channel') as NatsPubSubAsyncIterator<any>;
      expect(iterator[Symbol.asyncIterator]()).toBe(iterator);
    });
  });

  describe('initial state', () => {
    it('should start with null subscriptionId', () => {
      const iterator = pubsub.asyncIterator('test.channel') as NatsPubSubAsyncIterator<any>;
      expect((iterator as any).subscriptionId).toBeNull();
    });

    it('should start with empty listeners array', () => {
      const iterator = pubsub.asyncIterator('test.channel') as NatsPubSubAsyncIterator<any>;
      expect((iterator as any).listeners).toEqual([]);
    });
  });
});

describe('createNatsPubSub', () => {
  it('should create NatsPubSub instance with given nats client', () => {
    const natsClient = createMockNatsClient();
    const pubsub = createNatsPubSub(natsClient);

    expect(pubsub).toBeInstanceOf(NatsPubSub);
  });

  it('should use the provided nats client for operations', async () => {
    const natsClient = createMockNatsClient();
    const pubsub = createNatsPubSub(natsClient);

    await pubsub.publish('test', { data: 'test' });
    expect(natsClient.publish).toHaveBeenCalled();
  });
});

describe('PubSubProtocol', () => {
  it('should have DEFAULT protocol set to DEFAULT string', () => {
    expect(PubSubProtocol.DEFAULT).toBe('DEFAULT');
  });

  it('should have NATS protocol set to NATS string', () => {
    expect(PubSubProtocol.NATS).toBe('NATS');
  });

  it('should have RABBITMQ protocol set to RABBITMQ string', () => {
    expect(PubSubProtocol.RABBITMQ).toBe('RABBITMQ');
  });
});

describe('GraphQLNatsModule', () => {
  describe('forRoot', () => {
    it('should have moduleName in metadata', () => {
      const config = GraphQLNatsModule.forRoot() as any;
      expect(config.metadata?.moduleName).toBe('GraphQLNatsModule');
    });

    it('should have moduleHash in metadata', () => {
      const config = GraphQLNatsModule.forRoot() as any;
      expect(config.metadata?.moduleHash).toBeDefined();
    });

    it('should have type as module in metadata', () => {
      const config = GraphQLNatsModule.forRoot() as any;
      expect(config.metadata?.type).toBe('module');
    });

    it('should have providers array with GraphQLNatsPubSubService in metadata raw source', () => {
      const config = GraphQLNatsModule.forRoot() as any;
      const raw = config.metadata?.raw || '';
      expect(raw).toContain('GraphQLNatsPubSubService');
    });
  });
});

describe('NatsPubSubInterface contract', () => {
  let natsClient: ReturnType<typeof createMockNatsClient>;
  let pubsub: NatsPubSubInterface;

  beforeEach(() => {
    natsClient = createMockNatsClient();
    pubsub = new NatsPubSub(natsClient);
  });

  it('should implement publish method', () => {
    expect(typeof pubsub.publish).toBe('function');
  });

  it('should implement subscribe method', () => {
    expect(typeof pubsub.subscribe).toBe('function');
  });

  it('should implement unsubscribe method', () => {
    expect(typeof pubsub.unsubscribe).toBe('function');
  });

  it('should implement asyncIterator method', () => {
    expect(typeof pubsub.asyncIterator).toBe('function');
  });

  it('should implement asyncIterableIterator method', () => {
    expect(typeof pubsub.asyncIterableIterator).toBe('function');
  });

  it('publish should return a promise', () => {
    const result = pubsub.publish('test', {});
    expect(result).toBeInstanceOf(Promise);
  });

  it('subscribe should return a promise that resolves to number', async () => {
    const result = pubsub.subscribe('test', async () => {});
    expect(result).toBeInstanceOf(Promise);
    const subId = await result;
    expect(typeof subId).toBe('number');
  });
});