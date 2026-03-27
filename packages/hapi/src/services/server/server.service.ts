import { Service, Inject, BootstrapLogger, ExitHandlerService } from "@rxdi/core";
import { HAPI_SERVER, HAPI_PLUGINS, HAPI_CONFIG, HapiConfigModel } from "../../hapi.module.config";
import { Server, PluginBase, PluginNameVersion, PluginPackage } from "@hapi/hapi";

export type PluginType<T> = (PluginBase<T, any> & (PluginNameVersion | PluginPackage))[];

@Service()
export class ServerService {

  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(HAPI_PLUGINS) private plugins: PluginType<any>,
    @Inject(HAPI_CONFIG) private config: HapiConfigModel,
    private logger: BootstrapLogger,
    private exitHandler: ExitHandlerService,
    
    
  ) {
    this.exitHandler.errorHandler.subscribe(async () => await this.server.stop());
  }

  async start() {
    if (this.plugins.length) {
      await this.registerPlugins(this.plugins);
    }
    try {
      if (this.config.mode === 'lambda') {
          await this.server.initialize();
      } else {
        await this.server.start();
        this.logger.log(
          `
                Server running at: http://${this.server.info.address}:${this.server.info.port},
                Environment: ${process.env.NODE_ENV || 'development'}
                `
        );
      }
    }
    catch (err) {
      throw new Error(err);
    }

  }

  async registerPlugins<T>(plugins: PluginType<T>) {
    return await Promise.all(plugins.map(async p => await this.server.register(p)))
  }

}