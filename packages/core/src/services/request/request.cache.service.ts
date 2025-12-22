import { CacheService, CacheLayer, CacheLayerItem } from '../cache/index';
import { Service } from '../../decorators/service/Service';

@Service()
export class RequestCacheService extends CacheService {
  cacheLayer: CacheLayer<CacheLayerItem<any>>;
  constructor() {
    super();
    this.cacheLayer = this.createLayer({ name: 'request-cache-layer' });
  }

  put(key, data) {
    return this.cacheLayer.putItem({ key, data });
  }

  get(key) {
    return this.cacheLayer.getItem(key);
  }
}
