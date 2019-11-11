import { Module, ModuleWithServices } from '@rxdi/core';
import { HookService, EffectService, ServerPushPlugin } from './services';
import { ApolloService } from './services/apollo.service';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
import { BootstrapService } from './services/bootstrap.service';
import { GraphiQLService } from './services/graphiql.service';
import { StartService } from './services/start.service';
import { PlaygroundModule } from '@gapi/playground';
import { PluginInit } from './plugin-init';

@Module()
export class GraphQLModule {
  public static forRoot(config: GRAPHQL_PLUGIN_CONFIG): ModuleWithServices {
    config.graphiqlPlaygroundConfig = config.graphiqlPlaygroundConfig || {};
    config.graphiqlPlaygroundConfig.subscriptionEndpoint =
      config.graphiqlOptions.subscriptionsEndpoint ||
      'ws://localhost:9000/subscriptions';
    return {
      module: GraphQLModule,
      providers: [
        EffectService,
        {
          provide: GRAPHQL_PLUGIN_CONFIG,
          useValue: config
        },
        HookService,
        BootstrapService,
        ApolloService,
        GraphiQLService,
        StartService
      ],
      frameworkImports: [
        PlaygroundModule.forRoot({
          path: config.graphiQlPath || '/graphiql',
          endpoint: config.path || '/graphql',
          version: '1.7.1',
          ...config.graphiqlPlaygroundConfig,
          graphiqlPlayground: config.graphiQlPlayground
        })
      ],
      plugins: [ServerPushPlugin, PluginInit]
    };
  }
}

export * from './decorators';
export * from './services';
export * from './config.tokens';
export * from './helpers/index';
export * from './test/index';
