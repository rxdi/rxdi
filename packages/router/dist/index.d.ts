import { ModuleWithServices } from '@rxdi/core';
import { RouterComponent } from './router.component';
import { RouterOptions, Route } from './injection.tokens';
import { NotFoundComponent } from './not-found.component';
export declare class RouterModule {
    static forRoot<C>(routes: Route<C>[], options?: RouterOptions): ModuleWithServices;
    static forChild(routes: Route<any>[]): typeof RouterModule;
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
