import { NatsClientService } from './nats-client.service';
import { NatsLoggerService } from './nats-logger.service';

jest.mock('@nats-io/transport-node', () => ({
  connect: jest.fn(),
}));

function makeService(): NatsClientService {
  return new NatsClientService(
    { servers: ['nats://localhost:4222'], reconnectTimeWait: 10 } as any,
    new NatsLoggerService(false),
  );
}

const fakeConnection = () => ({
  closed: () => new Promise(() => undefined),
  close: jest.fn(async () => undefined),
});

describe('NatsClientService startup (startupTimeout)', () => {
  const { connect } = require('@nats-io/transport-node');

  beforeEach(() => (connect as jest.Mock).mockReset());

  it('rejects and stops retrying when NATS never comes up', async () => {
    (connect as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    const service = makeService();
    service.OnInit();
    await expect(service.waitForStartup(60)).rejects.toThrow(
      /No NATS connection within 60ms/,
    );
    const calls = (connect as jest.Mock).mock.calls.length;
    await new Promise((r) => setTimeout(r, 50));
    expect((connect as jest.Mock).mock.calls.length).toBe(calls);
    expect(service.isReady()).toBe(false);
  });

  it('resolves with the client once a retry connects within the timeout', async () => {
    const conn = fakeConnection();
    (connect as jest.Mock)
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue(conn);
    const service = makeService();
    service.OnInit();
    await expect(service.waitForStartup(1000)).resolves.toBe(conn);
    expect(service.isReady()).toBe(true);
  });
});
