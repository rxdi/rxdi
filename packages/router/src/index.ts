import { Module, ModuleWithServices } from '@rxdi/core';
import { RouterService } from './router.service';
import { BehaviorSubject } from 'rxjs';
import { RouterComponent } from './router.component';
import {
  RouterOptions,
  Route,
  Routes,
  RouterRoutlet,
  RouterInitialized
} from './injection.tokens';
import { ChildRoutesObservable, loadRoutes } from './helpers';
import { NotFoundComponent } from './not-found.component';

@Module()
export class RouterModule {
  public static forRoot<C>(
    routes: Route<C>[],
    options?: RouterOptions
  ): ModuleWithServices {
    return {
      module: RouterModule,
      services: [
        {
          provide: RouterOptions,
          useValue: options || {}
        },
        {
          provide: Routes,
          useValue: loadRoutes(routes)
        },
        {
          provide: RouterInitialized,
          useFactory: () => new BehaviorSubject(null)
        },
        {
          provide: RouterRoutlet,
          useFactory: () => new BehaviorSubject(null)
        },
        {
          provide: 'initRouter',
          deps: [RouterService],
          useFactory: (r: RouterService) => r
        },
      ],
      components: [RouterComponent]
    };
  }

  public static forChild(routes: Route<any>[]) {
      ChildRoutesObservable.next(loadRoutes(routes));
      return RouterModule;
  }
}

export * from './injection.tokens';
export * from './outlet';
export * from './decorators';
export * from './router.component';
export * from './not-found.component';
export * from './helpers';

declare global {
  interface HTMLElementTagNameMap {
    'router-outlet': RouterComponent;
    'default-not-found-component': NotFoundComponent;
  }
}
