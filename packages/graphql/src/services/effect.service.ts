import { Service, CacheService, Container, BootstrapLogger } from '@rxdi/core';

@Service()
export class EffectService extends CacheService {
  constructor() {
    super(Container.get(BootstrapLogger));
  }
}
