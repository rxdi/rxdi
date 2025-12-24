import { Service, CacheService } from '@rxdi/core';

@Service()
export class EffectService extends CacheService {
  constructor() {
    super();
  }
}
