import { Module, ModuleWithServices, Container } from '@rxdi/core';
import { HookService, EffectService} from './services';
import { GraphqlService } from './services/graphql.service';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
import { BootstrapService } from './services/bootstrap.service';
import { PluginInit } from './plugin-init';

@Module()
export class GraphQLModule {
  public static forRoot(config: GRAPHQL_PLUGIN_CONFIG): ModuleWithServices {
    // Idempotent path: if GRAPHQL_PLUGIN_CONFIG is already in the container
    // (Lambforge container pre-bootstrap, user AppModule re-declaring
    // CoreModule.forRoot), merge into the live config instead of re-binding.
    // GraphqlService is a singleton; its handler reads from this same object
    // reference, so mutations are picked up immediately.
    if (Container.has(GRAPHQL_PLUGIN_CONFIG)) {
      const live = Container.get<GRAPHQL_PLUGIN_CONFIG>(GRAPHQL_PLUGIN_CONFIG);
      Object.assign(live, config);
      return { module: GraphQLModule, providers: [] };
    }
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
        GraphqlService,
      ],
      plugins: [ PluginInit]
    };
  }
}
