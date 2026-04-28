import {
  NatsModuleConfiguration,
  NatsCallOptions,
  NatsListenerOptions,
  NatsEmitOptions,
  NATS_MODULE_CONFIG,
  NATS_CLIENT_SERVICE,
  NATS_PUBSUB_SERVICE,
  NATS_LOGGER,
  NatsLogger,
  NatsLogLevel,
} from '../interfaces';

describe('NatsModuleConfiguration Interface', () => {
  it('should accept full configuration', () => {
    const config: NatsModuleConfiguration = {
      host: 'localhost',
      port: 4222,
      servers: ['nats://localhost:4222', 'nats://localhost:4223'],
      name: 'test-service',
      user: 'admin',
      pass: 'password',
      logging: true,
      serviceName: 'test-queue',
      maxReconnectAttempts: 10,
      reconnectTimeWait: 1000,
      timeout: 5000,
    };

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(4222);
    expect(config.servers).toHaveLength(2);
    expect(config.name).toBe('test-service');
    expect(config.user).toBe('admin');
    expect(config.pass).toBe('password');
    expect(config.logging).toBe(true);
    expect(config.serviceName).toBe('test-queue');
    expect(config.maxReconnectAttempts).toBe(10);
    expect(config.reconnectTimeWait).toBe(1000);
    expect(config.timeout).toBe(5000);
  });

  it('should accept minimal configuration', () => {
    const config: NatsModuleConfiguration = {};
    expect(config).toBeDefined();
  });

  it('should accept only servers array', () => {
    const config: NatsModuleConfiguration = {
      servers: ['nats://custom:5555'],
    };
    expect(config.servers).toEqual(['nats://custom:5555']);
  });

  it('should accept host and port instead of servers', () => {
    const config: NatsModuleConfiguration = {
      host: 'custom-host',
      port: 5555,
    };
    expect(config.host).toBe('custom-host');
    expect(config.port).toBe(5555);
  });

  it('should accept queue group via serviceName', () => {
    const config: NatsModuleConfiguration = {
      serviceName: 'wallet-service-queue',
    };
    expect(config.serviceName).toBe('wallet-service-queue');
  });

  it('should accept logging option', () => {
    const configEnabled: NatsModuleConfiguration = { logging: true };
    const configDisabled: NatsModuleConfiguration = { logging: false };

    expect(configEnabled.logging).toBe(true);
    expect(configDisabled.logging).toBe(false);
  });

  it('should accept maxReconnectAttempts', () => {
    const config: NatsModuleConfiguration = {
      maxReconnectAttempts: -1,
    };
    expect(config.maxReconnectAttempts).toBe(-1);
  });

  it('should accept reconnectTimeWait', () => {
    const config: NatsModuleConfiguration = {
      reconnectTimeWait: 2000,
    };
    expect(config.reconnectTimeWait).toBe(2000);
  });

  it('should accept timeout', () => {
    const config: NatsModuleConfiguration = {
      timeout: 30000,
    };
    expect(config.timeout).toBe(30000);
  });
});

describe('NatsCallOptions Interface', () => {
  it('should accept channel and timeout', () => {
    const options: NatsCallOptions = {
      channel: 'wallet.balance.get',
      timeout: 5000,
    };
    expect(options.channel).toBe('wallet.balance.get');
    expect(options.timeout).toBe(5000);
  });

  it('should accept channel with queueGroup', () => {
    const options: NatsCallOptions = {
      channel: 'wallet.balance.get',
      queueGroup: 'wallet-service',
    };
    expect(options.channel).toBe('wallet.balance.get');
    expect(options.queueGroup).toBe('wallet-service');
  });

  it('should accept all options', () => {
    const options: NatsCallOptions = {
      channel: 'test.channel',
      timeout: 10000,
      queueGroup: 'test-queue',
    };
    expect(options.channel).toBe('test.channel');
    expect(options.timeout).toBe(10000);
    expect(options.queueGroup).toBe('test-queue');
  });
});

describe('NatsListenerOptions Interface', () => {
  it('should accept channel only', () => {
    const options: NatsListenerOptions = {
      channel: 'player.joined',
    };
    expect(options.channel).toBe('player.joined');
  });

  it('should accept channel with queueGroup', () => {
    const options: NatsListenerOptions = {
      channel: 'player.joined',
      queueGroup: 'notification-service',
    };
    expect(options.channel).toBe('player.joined');
    expect(options.queueGroup).toBe('notification-service');
  });
});

describe('NatsEmitOptions Interface', () => {
  it('should accept channel with fireAndForget true', () => {
    const options: NatsEmitOptions = {
      channel: 'wallet.balance.changed',
      fireAndForget: true,
    };
    expect(options.channel).toBe('wallet.balance.changed');
    expect(options.fireAndForget).toBe(true);
  });

  it('should accept channel with fireAndForget false', () => {
    const options: NatsEmitOptions = {
      channel: 'wallet.balance.changed',
      fireAndForget: false,
    };
    expect(options.channel).toBe('wallet.balance.changed');
    expect(options.fireAndForget).toBe(false);
  });
});

describe('Token Exports', () => {
  it('should export NATS_MODULE_CONFIG token', () => {
    expect(NATS_MODULE_CONFIG).toBeDefined();
  });

  it('should export NATS_CLIENT_SERVICE token', () => {
    expect(NATS_CLIENT_SERVICE).toBeDefined();
  });

  it('should export NATS_PUBSUB_SERVICE token', () => {
    expect(NATS_PUBSUB_SERVICE).toBeDefined();
  });

  it('should export NATS_LOGGER token', () => {
    expect(NATS_LOGGER).toBeDefined();
  });
});

describe('NatsLogger Interface', () => {
  it('should accept logger with all methods', () => {
    const logger: NatsLogger = {
      debug: (message: string, ...args: any[]) => {},
      info: (message: string, ...args: any[]) => {},
      warn: (message: string, ...args: any[]) => {},
      error: (message: string, ...args: any[]) => {},
    };
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });
});

describe('NatsLogLevel Enum', () => {
  it('should have correct log levels', () => {
    expect(NatsLogLevel.Debug).toBe('debug');
    expect(NatsLogLevel.Info).toBe('info');
    expect(NatsLogLevel.Warn).toBe('warn');
    expect(NatsLogLevel.Error).toBe('error');
  });
});