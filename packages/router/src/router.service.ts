import { Service, Inject } from '@rxdi/core';
import { Outlet } from './outlet';
import { Subscription } from 'rxjs';
import {
  Routes,
  RouterOptions,
  RouterRoutlet,
  RouterInitialized
} from './injection.tokens';

@Service()
export class RouterService {
  private subscription: Subscription;
  constructor(
    @Inject(Routes) private routes: Routes,
    @Inject(RouterOptions) private routerOptions: RouterOptions,
    @Inject(RouterInitialized) private routerInitialized: RouterInitialized,
    @Inject(RouterRoutlet) private routerPlate: RouterRoutlet
  ) {
    this.subscription = this.routerInitialized
      .asObservable()
      .subscribe(async routerOutlet => {
        if (routerOutlet) {
          await routerOutlet.requestUpdate();
          const el = routerOutlet.shadowRoot.querySelector(
            `#${routerOutlet.id}`
          );
          const router = new Outlet(el, this.routerOptions);
          router.setRoutes(this.routes);
          this.routerPlate.next(router);
          this.subscription.unsubscribe();
        }
      });
  }
}
