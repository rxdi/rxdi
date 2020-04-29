import { Routes, RouterOptions, RouterRoutlet, RouterInitialized } from './injection.tokens';
export declare class RouterService {
    private routes;
    private routerOptions;
    private routerInitialized;
    private routerPlate;
    private subscription;
    constructor(routes: Routes, routerOptions: RouterOptions, routerInitialized: RouterInitialized, routerPlate: RouterRoutlet);
}
