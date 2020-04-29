import { Module, ModuleWithServices } from '@rxdi/core';
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG
} from './config.tokens';
import { SubscriptionService } from './services/subscription.service';
import { PubSubService } from './services/pub-sub.service';
import { PubSubLogger } from './services/logger.service';

@Module()
export class GraphQLPubSubModule {
  public static forRoot(
    config?: GRAPHQL_PUB_SUB_DI_CONFIG
  ): ModuleWithServices {
    return {
      module: GraphQLPubSubModule,
      providers: [
        {
          provide: GRAPHQL_PUB_SUB_CONFIG,
          useValue: config || new GRAPHQL_PUB_SUB_DI_CONFIG()
        },
        PubSubService,
        SubscriptionService,
        PubSubLogger
      ]
    };
  }
}

export * from './config.tokens';
export * from './decorators/index';
export * from './services/index';
export * from './helpers/index';
