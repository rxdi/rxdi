import { Module, ModuleWithServices } from '@rxdi/core';
import { HookService, EffectService} from './services';
import { GraphqlService } from './services/apollo.service';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
import { BootstrapService } from './services/bootstrap.service';
import { AltairModule } from '@rxdi/altair';
import { PluginInit } from './plugin-init';

@Module()
export class GraphQLModule {
  public static forRoot(config: GRAPHQL_PLUGIN_CONFIG): ModuleWithServices {
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
      frameworkImports: [
        ...(config.altair?.enabled ? [AltairModule.forRoot(config.altair?.options)] : []),
      ],
      plugins: [ PluginInit]
    };
  }
}

export * from './decorators';
export * from './services';
export * from './config.tokens';
export * from './helpers/index';
export * from './test/index';
