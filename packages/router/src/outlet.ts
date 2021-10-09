import { Router as VaadinRouter } from './vaadin/vaadin-router';
import { RouterOptions, Route } from './injection.tokens';
import { getQueryParams } from './helpers';

interface Detail extends Event {
 detail: { location: { pathname: string } };
}

export class Outlet<C = {}> extends VaadinRouter {
 activePath: string = '/';
 private freeze: boolean;
 private listener: { unsubscribe: () => void };

 constructor(element: Element, private options: RouterOptions) {
  super(element, options);
  this.listener = this.onSnapshotChange((event) => {
   if (this.options.log) {
    console.log(`You are at '${event.detail.location.pathname}'`);
   }
   this.activePath = event.detail.location.pathname;
  });
 }

 onSnapshotChange(callback: (event: Detail) => void) {
  window.addEventListener('vaadin-router-location-changed', callback);
  return {
   unsubscribe: () =>
    window.removeEventListener('vaadin-router-location-changed', callback),
  };
 }

 freezeRouter() {
  this.freeze = true;
 }

 unfreezeRouter() {
  this.freeze = false;
 }

 getQueryParams<T>(params: string[]) {
  return getQueryParams<T>(params);
 }

 /**
  * Takes current routes and set it
  * @param routes: Route<C>[]
  * @returns Route<C>[]
  */
 setRoutes(routes: Route<C>[]): Promise<Node> {
  return super.setRoutes(routes);
 }

 /**
  * Takes current routes and set it
  * @param routes: Route<C>[]
  * @returns void
  */
 setOutlet(outlet: Node): void {
  super.setOutlet(outlet);
 }
 /**
  * Triggers navigation to a new path. Returns a boolean without waiting until the navigation is complete. Returns true if at least one Vaadin.Router has handled the navigation (was subscribed and had baseUrl matching the pathname argument), otherwise returns false.
  * @param pathnamea new in-app path
  * @returns void
  */
 go(path: string): boolean {
  if (this.activePath === path || this.freeze) {
   return false;
  }
  this.activePath = path;
  if (this.options.freeze) {
   this.freezeRouter();
  }
  // window.dispatchEvent(new CustomEvent('vaadin-router-go', {detail: {pathname: '/to/path'}}));
  return VaadinRouter.go(path);
 }

 /**
  * Vaadin Router supports refferring to routes using string names. You can assign a name to a route using the name property of a route object, then generate URLs for that route using the router.urlForName(name, parameters) helper instance method.
  * @param name — the route name
  * @param parameters — optional object with parameters for substitution in the route path
  */
 urlForName(url: string, params: any): string {
  return super.urlForName(url, params);
 }

 /**
  * router.urlForPath(path, parameters) is a helper method that generates a URL for the given route path, optionally performing substitution of parameters.
  * @param path — a string route path defined in express.js syntax
  * @param parameters — optional object with parameters for path substitution
  */
 urlForPath(path: string, params: any): string {
  return super.urlForPath(path, params);
 }

 /**
  * Returns the current router outlet. The initial value is undefined.
  */
 getOutlet(): Node {
  return super.getOutlet();
 }

 /**
  * Inherited from Vaadin.Resolver Returns the current list of routes (as a shallow copy). Adding / removing routes to / from the returned array does not affect the routing config, but modifying the route objects does.
  */
 getRoutes(): Route<C>[] {
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
 render(
  pathnameOrContext:
   | string
   | {
      pathname: string;
      search: string;
      hash: string;
     },
  shouldUpdateHistory,
 ): Promise<Node> {
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
  if (this.listener) {
   this.listener.unsubscribe();
  }
  super.unsubscribe();
 }

 addRoutes(routes: Route<C> | Route<C>[]): Route<C>[] {
  return super.addRoutes(routes);
 }
}
