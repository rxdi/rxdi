import { Module, ModuleWithServices, Container } from '@rxdi/core';
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
    // Idempotent path: if GRAPHQL_PUB_SUB_CONFIG is already in the container,
    // merge into the live config. SubscriptionService reads this on its next
    // register() — which the GraphqlService schema-reload hook triggers
    // automatically once the user module finishes wiring controllers.
    if (Container.has(GRAPHQL_PUB_SUB_CONFIG)) {
      const live = Container.get<GRAPHQL_PUB_SUB_DI_CONFIG>(GRAPHQL_PUB_SUB_CONFIG);
      Object.assign(live, config || new GRAPHQL_PUB_SUB_DI_CONFIG());
      return { module: GraphQLPubSubModule, providers: [] };
    }
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
