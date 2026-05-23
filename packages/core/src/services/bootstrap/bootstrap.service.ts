import { of, combineLatest, from, Observable } from 'rxjs';
import { Container } from '../../container';
import { BootstrapLogger } from '../bootstrap-logger/bootstrap-logger';
import { CacheService } from '../cache/cache-layer.service';
import { InternalLayers, InternalEvents } from '../../helpers/events';
import { LazyFactory } from '../lazy-factory/lazy-factory.service';
import { ConfigService } from '../config/config.service';
import { PluginService } from '../plugin/plugin.service';
import { ConfigModel } from '../config/config.model';
import { take, map, switchMap, shareReplay } from 'rxjs/operators';
import { CacheLayer, CacheLayerItem } from '../cache/index';
import { EffectsService } from '../effect/effect.service';
import { ControllersService } from '../controllers/controllers.service';
import { ComponentsService } from '../components/components.service';
import { BootstrapsServices } from '../bootstraps/bootstraps.service';
import { ServicesService } from '../services/services.service';
import { AfterStarterService } from '../after-starter/after-starter.service';
import {
  ServiceArgumentsInternal,
  SystemIngridientsType
} from '../../decorators/module/module.interfaces';
import { logExtendedInjectables } from '../../helpers/log';
import { Service } from '../../decorators/service/Service';
import { PluginInterface } from '../../decorators';
import { ObservableContainer } from '../../container/observable-interface';

@Service()
export class BootstrapService {
  private globalConfig: CacheLayer<CacheLayerItem<ConfigModel>>;

  constructor(
    private logger: BootstrapLogger,
    private cacheService: CacheService,
    private lazyFactoriesService: LazyFactory,
    public configService: ConfigService,
    private controllersService: ControllersService,
    private effectsService: EffectsService,
    private pluginService: PluginService,
    private componentsService: ComponentsService,
    private bootstrapsService: BootstrapsServices,
    private servicesService: ServicesService,
    private afterStarterService: AfterStarterService
  ) {
    this.globalConfig = this.cacheService.createLayer<ConfigModel>({
      name: InternalLayers.globalConfig
    });
  }

  public start(app, config?: ConfigModel) {
    this.configService.setConfig(config);
    this.globalConfig.putItem({ key: InternalEvents.config, data: config });
    Container.get(app);
    const lazyFactoryKeys = Array.from(
      this.lazyFactoriesService.lazyFactories.keys()
    );
    return of<string[]>(lazyFactoryKeys).pipe(
      map(factories => this.prepareAsyncChainables(factories)),
      switchMap(res =>
        combineLatest(res).pipe(
          take(1),
          map(c => this.attachLazyLoadedChainables(lazyFactoryKeys, c)),
          map(() => this.validateSystem()),
          switchMap(() => combineLatest(this.asyncChainableControllers())),
          switchMap(() =>
            combineLatest(this.asyncChainablePluginsBeforeRegister())
          ),
          switchMap(() => combineLatest(this.asyncChainablePluginsRegister())),
          switchMap(() =>
            combineLatest(this.asyncChainablePluginsAfterRegister())
          ),
          switchMap(() => combineLatest(this.asyncChainableServices())),
          switchMap(() => combineLatest(this.asyncChainableEffects())),
          switchMap(() => combineLatest(this.asyncChainableComponents())),
          map(() => this.loadApplication()),
          switchMap(() => combineLatest(this.asyncChainableBootstraps())),
          map(() => this.final())
        )
      )
    );
  }

  private final(): ObservableContainer {
    this.afterStarterService.appStarted.next(true);
    if (!this.configService.config.init) {
      this.logger.log('Bootstrap -> press start!');
    }
    return Container as ObservableContainer;
  }

  private asyncChainableComponents() {
    return [
      of(true),
      ...this.componentsService
        .getComponents()
        .filter(c => this.genericFilter(c, 'components'))
        .map(async c => await Container.get(c))
    ];
  }

  private asyncChainableBootstraps() {
    return [
      of(true),
      ...this.bootstrapsService
        .getBootstraps()
        .map(async c => await Container.get(c))
    ];
  }

  private asyncChainableEffects() {
    return [
      of(true),
      ...this.effectsService
        .getEffects()
        .filter(c => this.genericFilter(c, 'effects'))
        .map(async c => await Container.get(c))
    ];
  }

  private asyncChainableServices() {
    return [
      of(true),
      ...this.servicesService
        .getServices()
        .filter(c => this.genericFilter(c, 'services'))
        .map(async c => await Container.get(c))
    ];
  }

  private asyncChainableControllers() {
    return [
      of(true),
      ...this.controllersService
        .getControllers()
        .filter(c => this.genericFilter(c, 'controllers'))
        .map(async c => await Container.get(c))
    ];
  }

  private asyncChainablePluginsRegister() {
    return [
      of(true),
      ...this.pluginService
        .getPlugins()
        .filter(c => this.genericFilter(c, 'plugins'))
        .map(async c => await this.registerPlugin(c))
    ];
  }

  private asyncChainablePluginsAfterRegister() {
    return [
      of(true),
      ...this.pluginService
        .getAfterPlugins()
        .filter(c => this.genericFilter(c, 'pluginsAfter'))
        .map(async c => await this.registerPlugin(c))
    ];
  }

  private asyncChainablePluginsBeforeRegister() {
    return [
      of(true),
      ...this.pluginService
        .getBeforePlugins()
        .filter(c => this.genericFilter(c, 'pluginsBefore'))
        .map(async c => await this.registerPlugin(c))
    ];
  }

  private genericFilter(
    c: ServiceArgumentsInternal,
    name: SystemIngridientsType
  ) {
    return (
      this.configService.config.initOptions[name] ||
      (c.metadata.options && c.metadata.options['init']) ||
      this.configService.config.init
    );
  }

  private async registerPlugin(pluggable: ServiceArgumentsInternal) {
    const plugin = Container.get<PluginInterface>(pluggable);
    if (typeof plugin?.register === 'function') {
      await plugin.register();
    }
    return plugin;
  }

  private prepareAsyncChainables(injectables: any[]) {
    const asynChainables = [of(true)];
    const injectableLog: {
      [key: string]: { started: number; end: number };
    } = {} as any;
    const getName = n => n.name || n;
    injectables.map(i => {
      const date = Date.now();
      injectableLog[getName(i)] = {
        started: date,
        end: null
      };
      this.logger.log(`Bootstrap -> @Service('${getName(i)}'): loading...`);
      const somethingAsync = from(<Promise<any> | Observable<any>>(
        this.lazyFactoriesService.getLazyFactory(i)
      )).pipe(shareReplay(1));
      asynChainables.push(somethingAsync);
      somethingAsync.subscribe(() => {
        this.logger.log(
          `Bootstrap -> @Service('${getName(
            i
          )}'): loading finished after ${Date.now() -
            injectableLog[getName(i)].started}ms !`
        );
        delete injectableLog[getName(i)];
      });
    });
    return asynChainables;
  }

  private validateSystem() {
    if (this.configService.config.strict) {
      this.cacheService.searchForDuplicateDependenciesInsideApp();
    }
  }

  private attachLazyLoadedChainables(res, chainables) {
    // Remove first chainable unused observable
    chainables.splice(0, 1);
    let count = 0;
    res.map(name => {
      logExtendedInjectables(
        name,
        this.configService.config.experimental.logExtendedInjectables
      );
      Container.set(name, chainables[count++]);
    });
    return true;
  }

  loadApplication() {
    Array.from(
      this.cacheService.getLayer<Function>(InternalLayers.modules).map.keys()
    ).forEach(m =>
      this.cacheService.getLayer(m).putItem({
        key: InternalEvents.load,
        data: this.configService.config.init
      })
    );
    return true;
  }

  /**
   * Wires a module into an already-bootstrapped container. Used by dynamic
   * runtimes (e.g. Lambforge specialize) where the AppModule is not known at
   * container start time.
   *
   * Walks `imports` recursively via the existing GenericConstruct path,
   * then runs the same lifecycle order as `start()` but ONLY against newly
   * registered entries — existing services keep their identity, OnInit and
   * plugin `register()` are not invoked twice for things already live.
   *
   * Provider conflicts: last-write-wins. A user-module provider whose token
   * already has a value in the container will silently replace it. Idempotent
   * `forRoot` calls (PR3) detect well-known framework tokens and refuse to
   * override them; arbitrary user tokens are the user's responsibility.
   */
  async applyModule(moduleClass: Function): Promise<void> {
    const before = this.snapshotRegistries();
    Container.get(moduleClass);
    const after = this.snapshotRegistries();

    const newBeforePlugins = this.diff(before.beforePlugins, after.beforePlugins);
    const newPlugins = this.diff(before.plugins, after.plugins);
    const newAfterPlugins = this.diff(before.afterPlugins, after.afterPlugins);
    const newControllers = this.diff(before.controllers, after.controllers);
    const newServices = this.diff(before.services, after.services);
    const newEffects = this.diff(before.effects, after.effects);
    const newComponents = this.diff(before.components, after.components);
    const newBootstraps = this.diff(before.bootstraps, after.bootstraps);

    // Controllers come first in start() — keep the same ordering here so
    // any plugin that depends on controllers being resolved sees them.
    await Promise.all(newControllers.map(c => Container.get(c)));

    for (const p of newBeforePlugins) {
      await this.registerNewPlugin(p);
    }
    for (const p of newPlugins) {
      await this.registerNewPlugin(p);
    }
    for (const p of newAfterPlugins) {
      await this.registerNewPlugin(p);
    }

    await Promise.all(newServices.map(s => Container.get(s)));
    await Promise.all(newEffects.map(e => Container.get(e)));
    await Promise.all(newComponents.map(c => Container.get(c)));
    await Promise.all(newBootstraps.map(b => Container.get(b)));
  }

  private snapshotRegistries() {
    return {
      controllers: new Set(this.controllersService.getControllers()),
      services: new Set(this.servicesService.getServices()),
      effects: new Set(this.effectsService.getEffects()),
      components: new Set(this.componentsService.getComponents()),
      bootstraps: new Set(this.bootstrapsService.getBootstraps()),
      plugins: new Set(this.pluginService.getPlugins()),
      beforePlugins: new Set(this.pluginService.getBeforePlugins()),
      afterPlugins: new Set(this.pluginService.getAfterPlugins())
    };
  }

  private diff(
    before: Set<ServiceArgumentsInternal>,
    after: Set<ServiceArgumentsInternal>
  ): ServiceArgumentsInternal[] {
    const result: ServiceArgumentsInternal[] = [];
    after.forEach(item => {
      if (!before.has(item)) {
        result.push(item);
      }
    });
    return result;
  }

  private async registerNewPlugin(pluggable: ServiceArgumentsInternal): Promise<void> {
    const plugin = Container.get<PluginInterface>(pluggable);
    if (typeof plugin?.register === 'function') {
      await plugin.register();
    }
  }
}
