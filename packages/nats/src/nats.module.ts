import { Module, ModuleWithServices, Injectable } from '@rxdi/core';
import {
  NatsModuleConfiguration,
  NATS_MODULE_CONFIG,
  NATS_PUBSUB_SERVICE,
  NATS_CLIENT_SERVICE,
  NATS_LOGGER,
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
    const logger = new ConsoleNatsLogger(config?.logging ?? false);
    super(config?.logging ?? false, logger);
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
        NatsListenerHost,
        {
          provide: NATS_PUBSUB_SERVICE,
          useClass: NatsPubSubService,
        },
      ],
    };
  }
}