import { Module, ModuleWithServices } from '@rxdi/core';

import { ChildRoutesObservable, loadRoutes } from './helpers';
import { Route, RouterOptions, Routes } from './injection.tokens';
import { NotFoundComponent } from './not-found.component';
import { RouterComponent } from './router.component';

@Module()
export class RouterModule {
  public static forRoot<C>(routes: Route<C>[], options?: RouterOptions): ModuleWithServices {
    return {
      module: RouterModule,
      services: [
        {
          provide: RouterOptions,
          useValue: options || {},
        },
        {
          provide: Routes,
          useValue: loadRoutes(routes),
        },
      ],
      components: [RouterComponent],
    };
  }

  public static forChild(routes: Route[]) {
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
