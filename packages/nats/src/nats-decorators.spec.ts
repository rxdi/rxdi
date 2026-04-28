import { Container, Service, Module } from '@rxdi/core';
import { NatsModule } from './nats.module';
import { NatsCall, NatsEmit, NatsListener } from './decorators';
import { ConsoleNatsLogger } from './interfaces/nats-logger';

@Service()
class TestServiceWithCall {
  @NatsCall({ channel: 'test.call', timeout: 5000 })
  async handleCall(data: { message: string }) {
    return { received: true, data };
  }
}

@Service()
class TestServiceWithEmit {
  @NatsEmit({ channel: 'test.emit', fireAndForget: true })
  async emitEvent(data: { event: string }) {
    return { emitted: true, data };
  }
}

@Service()
class TestServiceWithListener {
  receivedMessages: any[] = [];

  @NatsListener({ channel: 'test.listener' })
  async handleListener(data: any) {
    this.receivedMessages.push(data);
  }
}

@Module({
  imports: [
    NatsModule.forRoot({
      servers: ['nats://localhost:4222'],
      logging: false,
    } as any),
  ],
  services: [TestServiceWithCall, TestServiceWithEmit, TestServiceWithListener],
})
export class TestModule {}

describe('NatsCall Decorator', () => {
  beforeAll(() => {
    Container.get(TestModule);
  });

  it('should register NatsCall decorated method', () => {
    const service = Container.get(TestServiceWithCall);
    expect(service).toBeDefined();
    expect(typeof service.handleCall).toBe('function');
  });

  it('should call decorated method without root parameter', async () => {
    const service = Container.get(TestServiceWithCall);
    const result = await service.handleCall({ message: 'test' });
    expect(result.received).toBe(true);
    expect(result.data.message).toBe('test');
  });
});

describe('NatsEmit Decorator', () => {
  beforeAll(() => {
    Container.get(TestModule);
  });

  it('should register NatsEmit decorated method', () => {
    const service = Container.get(TestServiceWithEmit);
    expect(service).toBeDefined();
    expect(typeof service.emitEvent).toBe('function');
  });

  it('should return result from emit method', async () => {
    const service = Container.get(TestServiceWithEmit);
    const result = await service.emitEvent({ event: 'test-event' });
    expect(result.emitted).toBe(true);
    expect(result.data.event).toBe('test-event');
  });
});

describe('NatsListener Decorator', () => {
  beforeAll(() => {
    Container.get(TestModule);
  });

  it('should register NatsListener decorated method', () => {
    const service = Container.get(TestServiceWithListener);
    expect(service).toBeDefined();
    expect(typeof service.handleListener).toBe('function');
  });

  it('should store received messages', () => {
    const service = Container.get(TestServiceWithListener);
    expect(service.receivedMessages).toEqual([]);
  });
});