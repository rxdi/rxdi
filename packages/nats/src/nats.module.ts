import { Module, ModuleWithServices } from '@rxdi/core';
import {
  NatsModuleConfiguration,
  NATS_MODULE_CONFIG,
  NATS_PUBSUB_SERVICE,
  NATS_CLIENT_SERVICE,
  ServiceDiscoveryOptions,
} from './interfaces';
import { NatsClientService } from './services/nats-client.service';
import { NatsPubSubService } from './services/nats-pubsub.service';
import { ServiceDiscoveryService } from './services/service-discovery.service';
import { NatsListenerHost } from './services/nats-listener.host';

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