import { Container, CacheService, ModuleService } from '@rxdi/core';
import { EffectService } from '../../services/effect.service';
const moduleService = Container.get(ModuleService);
export function OfType<T>(type: T) {
  return (target, pk, descriptor) => {
    const self = target;
    const cacheService = Container.get(EffectService);
    cacheService
      .getLayer<Array<any>>(<any>type)
      .getItemObservable(<any>type)
      .subscribe(async item => {
        const currentConstructor = moduleService.watcherService.getConstructor(
          self.constructor.name
        );
        const originalDesc = descriptor.value.bind(currentConstructor['value']);
        await originalDesc(...item.data);
      });
  };
}
