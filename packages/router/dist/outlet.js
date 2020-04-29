"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("@vaadin/router");
class Outlet extends router_1.Router {
    constructor(element, options) {
        super(element, options);
        this.options = options;
        this.activePath = '/';
        window.addEventListener('vaadin-router-location-changed', event => {
            if (this.options.log) {
                console.log(`You are at '${event['detail'].location.pathname}'`);
            }
            this.activePath = event['detail'].location.pathname;
        });
    }
    freezeRouter() {
        this.freeze = true;
    }
    unfreezeRouter() {
        this.freeze = false;
    }
    /**
     * Takes current routes and set it
     * @param routes: Route<C>[]
     * @returns Route<C>[]
     */
    setRoutes(routes) {
        super.setRoutes(routes);
        return routes;
    }
    /**
     * Takes current routes and set it
     * @param routes: Route<C>[]
     * @returns void
     */
    setOutlet(outlet) {
        super.setOutlet(outlet);
    }
    /**
     * Triggers navigation to a new path. Returns a boolean without waiting until the navigation is complete. Returns true if at least one Vaadin.Router has handled the navigation (was subscribed and had baseUrl matching the pathname argument), otherwise returns false.
     * @param pathnamea new in-app path
     * @returns void
     */
    go(path) {
        if (this.activePath === path || this.freeze) {
            return false;
        }
        this.activePath = path;
        if (this.options.freeze) {
            this.freezeRouter();
        }
        // window.dispatchEvent(new CustomEvent('vaadin-router-go', {detail: {pathname: '/to/path'}}));
        return router_1.Router.go(path);
    }
    /**
     * Vaadin Router supports refferring to routes using string names. You can assign a name to a route using the name property of a route object, then generate URLs for that route using the router.urlForName(name, parameters) helper instance method.
     * @param name — the route name
     * @param parameters — optional object with parameters for substitution in the route path
     */
    urlForName(url, params) {
        return super.urlForName(url, params);
    }
    /**
     * router.urlForPath(path, parameters) is a helper method that generates a URL for the given route path, optionally performing substitution of parameters.
     * @param path — a string route path defined in express.js syntax
     * @param parameters — optional object with parameters for path substitution
     */
    urlForPath(path, params) {
        return super.urlForPath(path, params);
    }
    /**
     * Configures what triggers Vaadin.Router navigation events:
     * @event POPSTATE: popstate events on the current window
     * @event CLICK: click events on <a> links leading to the current page
     * This method is invoked with the pre-configured values when creating a new Router instance. By default, both POPSTATE and CLICK are enabled. This setup is expected to cover most of the use cases.See the router-config.js for the default navigation triggers config. Based on it, you can create the own one and only import the triggers you need, instead of pulling in all the code, e.g. if you want to handle click differently.
     */
    setTriggers(triggers) {
        router_1.Router.setTriggers(triggers);
    }
    /**
     * Returns the current router outlet. The initial value is undefined.
     */
    getOutlet() {
        return super.getOutlet();
    }
    /**
     * Inherited from Vaadin.Resolver Returns the current list of routes (as a shallow copy). Adding / removing routes to / from the returned array does not affect the routing config, but modifying the route objects does.
     */
    getRoutes() {
        return super.getRoutes();
    }
    /**
     * Removes all existing routes from the routing config.
     */
    removeRoutes() {
        super.removeRoutes();
    }
    /**
     * Asynchronously resolves the given pathname and renders the resolved route component into the router outlet. If no router outlet is set at the time of calling this method, or at the time when the route resolution is completed, a TypeError is thrown.
     * Returns a promise that is fulfilled with the router outlet DOM Node after the route component is created and inserted into the router outlet, or rejected if no route matches the given path.
     * If another render pass is started before the previous one is completed, the result of the previous render pass is ignored.
     * @param pathnameOrContext — the pathname to render or a context object with a pathname property and other properties to pass to the resolver.
     * @param shouldUpdateHistory
     */
    render(pathnameOrContext, shouldUpdateHistory) {
        return super.render(pathnameOrContext, shouldUpdateHistory);
    }
    /**
     * Subscribes this instance to navigation events on the window.
     * NOTE: beware of resource leaks. For as long as a router instance is subscribed to navigation events, it won't be garbage collected.
     */
    subscribe() {
        super.subscribe();
    }
    /**
     * Removes the subscription to navigation events created in the subscribe() method.
     */
    unsubscribe() {
        super.unsubscribe();
    }
    addRoutes(routes) {
        return super.addRoutes(routes);
    }
}
exports.Outlet = Outlet;
