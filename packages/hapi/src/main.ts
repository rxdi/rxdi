import { Server } from '@hapi/hapi';
import { HapiPlugin } from './plugins/hapi.plugin';
import { ServerService } from './services/server/server.service';
import { ModuleWithServices, Module, Container } from '@rxdi/core';
import { HAPI_CONFIG, HapiConfigModel, HAPI_SERVER, HAPI_PLUGINS } from './hapi.module.config';
import { InertPlugin } from './plugins/inert/inert.plugin';
import { PluginBase, PluginNameVersion, PluginPackage } from '@hapi/hapi';

@Module({
  services: [],
  plugins: []
})
export class HapiModule {
  public static forRoot(config?: HapiConfigModel): ModuleWithServices {
    config = Object.assign({}, config || new HapiConfigModel());

    // Idempotent path: if HAPI_SERVER is already in the container (e.g.
    // Lambforge container pre-bootstrapped hapi, and now the user's
    // AppModule re-calls CoreModule.forRoot which transitively calls
    // HapiModule.forRoot), we don't recreate the server. We merge as much
    // configuration as can be applied to a live hapi server, warn on the
    // rest, and return a no-op ModuleWithServices.
    if (Container.has(HAPI_SERVER)) {
      mergeIntoLiveServer(config);
      return { module: HapiModule, providers: [] };
    }

    config.randomPort && config.hapi.port ? config.hapi.port = null : null;
    return {
      module: HapiModule,
      providers: [
        {
          provide: HAPI_CONFIG,
          useValue: config || new HapiConfigModel()
        },
        {
          provide: HAPI_SERVER,
          deps: [HAPI_CONFIG],
          useFactory: (config: HapiConfigModel) => {
            delete config.plugins;
            return new Server(config.hapi);
          }
        },
        {
          provide: HAPI_PLUGINS,
          useValue: config.plugins || []
        },
        ServerService,
      ],
      plugins: [HapiPlugin, InertPlugin]
    };
  }
}

/**
 * Merges a HapiConfigModel into an already-bootstrapped hapi server.
 *
 * Semantics:
 *  - `hapi.port`: ignored with a warning if it differs — the live server is
 *    bound, port changes would require a restart.
 *  - `hapi.routes.*`: merged into `server.settings.routes` so routes
 *    registered AFTER this call (e.g. user controllers, GraphqlService
 *    registering /graphql in the lambda flow) pick them up. Already
 *    registered routes keep their original settings.
 *  - `plugins`: appended to HAPI_PLUGINS so HapiPlugin's later registration
 *    pass picks them up. (No effect if HapiPlugin already finished init.)
 *  - HAPI_CONFIG is updated in-place so any later reader sees the new shape.
 */
function mergeIntoLiveServer(config: HapiConfigModel): void {
  const liveServer = Container.get<Server>(HAPI_SERVER);
  const liveConfig = Container.get<HapiConfigModel>(HAPI_CONFIG);

  const requestedPort = config.hapi && config.hapi.port;
  const livePort = liveServer.info && liveServer.info.port;
  if (requestedPort !== undefined && requestedPort !== null && livePort !== undefined && String(requestedPort) !== String(livePort)) {
    console.warn(
      `[HapiModule] Port ${requestedPort} requested but live server is on ${livePort}; ` +
      `port is fixed at container start. Ignoring requested port.`
    );
  }

  if (config.hapi && config.hapi.routes) {
    const liveRoutes = (liveServer.settings.routes as Record<string, unknown> | undefined) || {};
    Object.assign(liveRoutes, config.hapi.routes);
    (liveServer.settings as { routes?: Record<string, unknown> }).routes = liveRoutes;
  }

  if (config.plugins && config.plugins.length) {
    const livePlugins = Container.get<Array<PluginBase<unknown, unknown> & (PluginNameVersion | PluginPackage)>>(HAPI_PLUGINS);
    livePlugins.push(...config.plugins);
  }

  if (liveConfig) {
    Object.assign(liveConfig, config);
  }
}

export * from './hapi.module.config';
export * from './plugins/index';
export * from './services/index';