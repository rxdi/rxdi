import { Router as VaadinRouter } from '@vaadin/router';
import { NavigationTrigger } from './injection.tokens';
import { RouterOptions, Route } from './injection.tokens';
export declare class Outlet<C = {}> extends VaadinRouter {
    private options;
    activePath: string;
    private freeze;
    constructor(element: Element, options: RouterOptions);
    freezeRouter(): void;
    unfreezeRouter(): void;
    /**
     * Takes current routes and set it
     * @param routes: Route<C>[]
     * @returns Route<C>[]
     */
    setRoutes(routes: Route<C>[]): Route<C>[];
    /**
     * Takes current routes and set it
     * @param routes: Route<C>[]
     * @returns void
     */
    setOutlet(outlet: Node): void;
    /**
     * Triggers navigation to a new path. Returns a boolean without waiting until the navigation is complete. Returns true if at least one Vaadin.Router has handled the navigation (was subscribed and had baseUrl matching the pathname argument), otherwise returns false.
     * @param pathnamea new in-app path
     * @returns void
     */
    go(path: string): boolean;
    /**
     * Vaadin Router supports refferring to routes using string names. You can assign a name to a route using the name property of a route object, then generate URLs for that route using the router.urlForName(name, parameters) helper instance method.
     * @param name — the route name
     * @param parameters — optional object with parameters for substitution in the route path
     */
    urlForName(url: string, params: any): string;
    /**
     * router.urlForPath(path, parameters) is a helper method that generates a URL for the given route path, optionally performing substitution of parameters.
     * @param path — a string route path defined in express.js syntax
     * @param parameters — optional object with parameters for path substitution
     */
    urlForPath(path: string, params: any): string;
    /**
     * Configures what triggers Vaadin.Router navigation events:
     * @event POPSTATE: popstate events on the current window
     * @event CLICK: click events on <a> links leading to the current page
     * This method is invoked with the pre-configured values when creating a new Router instance. By default, both POPSTATE and CLICK are enabled. This setup is expected to cover most of the use cases.See the router-config.js for the default navigation triggers config. Based on it, you can create the own one and only import the triggers you need, instead of pulling in all the code, e.g. if you want to handle click differently.
     */
    setTriggers(triggers: NavigationTrigger[]): void;
    /**
     * Returns the current router outlet. The initial value is undefined.
     */
    getOutlet(): Node;
    /**
     * Inherited from Vaadin.Resolver Returns the current list of routes (as a shallow copy). Adding / removing routes to / from the returned array does not affect the routing config, but modifying the route objects does.
     */
    getRoutes(): Route<C>[];
    /**
     * Removes all existing routes from the routing config.
     */
    removeRoutes(): void;
    /**
     * Asynchronously resolves the given pathname and renders the resolved route component into the router outlet. If no router outlet is set at the time of calling this method, or at the time when the route resolution is completed, a TypeError is thrown.
     * Returns a promise that is fulfilled with the router outlet DOM Node after the route component is created and inserted into the router outlet, or rejected if no route matches the given path.
     * If another render pass is started before the previous one is completed, the result of the previous render pass is ignored.
     * @param pathnameOrContext — the pathname to render or a context object with a pathname property and other properties to pass to the resolver.
     * @param shouldUpdateHistory
     */
    render(pathnameOrContext: string | {
        pathname: string;
    }, shouldUpdateHistory: any): Promise<Node>;
    /**
     * Subscribes this instance to navigation events on the window.
     * NOTE: beware of resource leaks. For as long as a router instance is subscribed to navigation events, it won't be garbage collected.
     */
    subscribe(): void;
    /**
     * Removes the subscription to navigation events created in the subscribe() method.
     */
    unsubscribe(): void;
    addRoutes(routes: Route<C> | Route<C>[]): Route<C>[];
}
