import { Module, ModuleWithServices, Injectable } from '@rxdi/core';
import {
  NatsModuleConfiguration,
  NATS_MODULE_CONFIG,
  NATS_PUBSUB_SERVICE,
  NATS_CLIENT_SERVICE,
  NATS_LOGGER,
  NATS_CONNECTION,
  ServiceDiscoveryOptions,
} from './interfaces';
import { NatsClientService } from './services/nats-client.service';
import { NatsPubSubService } from './services/nats-pubsub.service';
import { ServiceDiscoveryService } from './services/service-discovery.service';
import { NatsListenerHost } from './services/nats-listener.host';
import { NatsLoggerService } from './services/nats-logger.service';
import { ConsoleNatsLogger, NatsLogger } from './interfaces/nats-logger';

@Injectable()
export class ConfiguredNatsLogger extends NatsLoggerService {
  constructor(config: NatsModuleConfiguration) {
    // The inner console logger is always on; the `logging` flag gates
    // debug/info/warn in NatsLoggerService. Errors are printed regardless
    // (see error() below).
    const logger = new ConsoleNatsLogger(true);
    super(config?.logging ?? false, logger);
    this.alwaysOn = logger;
  }

  private alwaysOn: NatsLogger;

  /**
   * Errors always print, even with `logging: false`: a failed connection or
   * a crashing handler must show up in the service log, otherwise a process
   * that cannot reach NATS looks perfectly healthy.
   */
  error(message: string, ...args: any[]): void {
    this.alwaysOn.error(message, ...args);
  }
}

@Module()
export class NatsModule {
  static forRoot(
    config: NatsModuleConfiguration,
    discovery?: ServiceDiscoveryOptions
  ): ModuleWithServices {
    return {
      module: NatsModule,
      providers: [
        {
          provide: NATS_MODULE_CONFIG,
          useValue: config,
        },
        {
          provide: NATS_LOGGER,
          useClass: ConfiguredNatsLogger,
        },
        NatsClientService,
        {
          provide: NATS_CLIENT_SERVICE,
          useClass: NatsClientService,
        },
        {
          // NATS_CONNECTION: a lazy async factory, so Bootstrap() awaits it
          // before controllers and services start. With `startupTimeout` it
          // waits for the first connection and rejects on timeout (the app
          // does not start); without it it resolves at once with the current
          // client (possibly null). Built here, per forRoot call: the core
          // rewrites `deps` / `useFactory` on the object it registers.
          provide: NATS_CONNECTION,
          lazy: true,
          deps: [NATS_MODULE_CONFIG, NatsClientService],
          useFactory: (
            moduleConfig: NatsModuleConfiguration,
            client: NatsClientService
          ) =>
            moduleConfig?.startupTimeout
              ? client.waitForStartup(moduleConfig.startupTimeout)
              : Promise.resolve(client.getClient()),
        },
        NatsListenerHost,
        {
          provide: NATS_PUBSUB_SERVICE,
          useClass: NatsPubSubService,
        },
        ...(discovery?.enabled ? [ServiceDiscoveryService] : []),
      ],
    };
  }

  static forRootAsync(config: {
    useFactory: () => NatsModuleConfiguration;
    deps?: any[];
  }): ModuleWithServices {
    return {
      module: NatsModule,
      providers: [
        {
          provide: NATS_MODULE_CONFIG,
          useFactory: config.useFactory,
          deps: config.deps || [],
        },
        {
          provide: NATS_LOGGER,
          useClass: ConfiguredNatsLogger,
        },
        NatsClientService,
        {
          provide: NATS_CLIENT_SERVICE,
          useClass: NatsClientService,
        },
        {
          // NATS_CONNECTION: a lazy async factory, so Bootstrap() awaits it
          // before controllers and services start. With `startupTimeout` it
          // waits for the first connection and rejects on timeout (the app
          // does not start); without it it resolves at once with the current
          // client (possibly null). Built here, per forRoot call: the core
          // rewrites `deps` / `useFactory` on the object it registers.
          provide: NATS_CONNECTION,
          lazy: true,
          deps: [NATS_MODULE_CONFIG, NatsClientService],
          useFactory: (
            moduleConfig: NatsModuleConfiguration,
            client: NatsClientService
          ) =>
            moduleConfig?.startupTimeout
              ? client.waitForStartup(moduleConfig.startupTimeout)
              : Promise.resolve(client.getClient()),
        },
        NatsListenerHost,
        {
          provide: NATS_PUBSUB_SERVICE,
          useClass: NatsPubSubService,
        },
      ],
    };
  }
}