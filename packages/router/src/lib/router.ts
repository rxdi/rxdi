import { compile } from './path-to-regexp';
import { generateUrls, Resolver } from './resolver';
import { CLICK, POPSTATE, setNavigationTriggers } from './triggers';
import {
  ChainItem,
  HTMLElementWithLocation,
  notFoundResult,
  PreventResult,
  RedirectResult,
  RedirectResult as RedirectResultType, // fix for shadowing
  Route,
  RouteCommands,
  RouteContext,
  RouteParams,
  RouteResult,
  RouterLocation,
  RouterOptions,
} from './types';
import {
  ensureRoute,
  fireRouterEvent,
  getNotFoundError,
  isFunction,
  isObject,
  isString,
  loadBundle,
  log,
  logValue,
  runCallbackIfPossible,
  toArray,
} from './utils';

const willAnimate = (elem: HTMLElement): boolean => {
  const name = getComputedStyle(elem).getPropertyValue('animation-name');
  return name && name !== 'none';
};

const waitForAnimation = (elem: HTMLElement, cb: () => void): void => {
  const listener = (): void => {
    elem.removeEventListener('animationend', listener);
    cb();
  };
  elem.addEventListener('animationend', listener);
};

function animate(elem: HTMLElement, className: string): Promise<void> {
  elem.classList.add(className);

  return new Promise<void>((resolve) => {
    if (willAnimate(elem)) {
      const rect = elem.getBoundingClientRect();
      const size = `height: ${rect.bottom - rect.top}px; width: ${rect.right - rect.left}px`;
      elem.setAttribute('style', `position: absolute; ${size}`);
      waitForAnimation(elem, () => {
        elem.classList.remove(className);
        elem.removeAttribute('style');
        resolve();
      });
    } else {
      elem.classList.remove(className);
      resolve();
    }
  });
}

const MAX_REDIRECT_COUNT = 256;

function isResultNotEmpty(result: RouteResult): boolean {
  return result !== null && result !== undefined;
}

function copyContextWithoutNext(context: RouteContext): Omit<RouteContext, 'next'> {
  const copy = Object.assign({}, context);
  delete (copy as Partial<RouteContext>).next;
  return copy;
}

function getPathnameForRouter(pathname: string, router: Resolver): string {
  const base = router.__getEffectiveBaseUrl();
  return base
    ? (router.constructor as typeof Resolver).__createUrl(pathname.replace(/^\//, ''), base).pathname
    : pathname;
}

function getMatchedPath(chain: ChainItem[] | Route[]): string {
  return (chain as ChainItem[])
    .map((item) => {
      const path = (item as ChainItem).path || (item as Route).path || '';
      return Array.isArray(path) ? path[0] : path;
    })
    .reduce((a, b) => {
      if (b.length) {
        return a.replace(/\/$/, '') + '/' + b.replace(/^\//, '');
      }
      return a;
    }, '');
}

function createLocation(
  {
    pathname = '',
    search = '',
    hash = '',
    chain = [],
    params = {},
    redirectFrom,
    resolver,
  }: Partial<RouteContext> & { resolver?: Resolver },
  route?: Route
): RouterLocation {
  const routes = chain.map((item) => item.route);
  return {
    baseUrl: (resolver && resolver.baseUrl) || '',
    pathname,
    search,
    hash,
    routes,
    route: route || (routes.length && routes[routes.length - 1]) || null,
    params,
    redirectFrom,
    getUrl: (userParams: RouteParams = {}): string =>
      getPathnameForRouter(compile(getMatchedPath(routes))(Object.assign({}, params, userParams)), resolver),
  };
}

function createRedirect(context: RouteContext, pathname: string): RedirectResult {
  const params = Object.assign({}, context.params);
  return {
    redirect: {
      pathname,
      from: context.pathname,
      params,
    },
  };
}

function renderElement(context: RouteContext, element: HTMLElement): HTMLElement {
  (element as HTMLElementWithLocation).location = createLocation(context);
  const index = context.chain.map((item) => item.route).indexOf(context.route);
  context.chain[index].element = element;
  return element;
}

function amend(
  amendmentFunction: string,
  args: [RouterLocation, Record<string, unknown>, Router],
  element?: HTMLElement
): (
  amendmentResult?: PreventResult | RedirectResult | void
) => PreventResult | RedirectResult | void | Promise<PreventResult | RedirectResult | void> | undefined {
  return (
    amendmentResult?: PreventResult | RedirectResult | void
  ): PreventResult | RedirectResult | void | Promise<PreventResult | RedirectResult | void> | undefined => {
    if (
      amendmentResult &&
      ((amendmentResult as PreventResult).cancel || (amendmentResult as RedirectResult).redirect)
    ) {
      return amendmentResult;
    }

    if (element) {
      return runCallbackIfPossible(
        (element as HTMLElementWithLocation)[amendmentFunction as keyof HTMLElementWithLocation] as
          | ((
              location: RouterLocation,
              commands: Record<string, unknown>,
              router: Router
            ) => PreventResult | RedirectResult | void | Promise<PreventResult | RedirectResult | void>)
          | undefined,
        args,
        element
      );
    }
    return undefined;
  };
}

function processNewChildren(newChildren: Route[] | Record<string, unknown>, route: Route): void {
  if (!Array.isArray(newChildren) && !isObject(newChildren)) {
    throw new Error(
      log(`Incorrect "children" value for the route ${route.path}: expected array or object, but got ${newChildren}`)
    );
  }

  route.__children = [];
  const childRoutes = toArray(newChildren as Route | Route[]);
  for (let i = 0; i < childRoutes.length; i++) {
    ensureRoute(childRoutes[i]);
    route.__children.push(childRoutes[i]);
  }
}

function removeDomNodes(nodes: HTMLCollection | HTMLElement[]): void {
  if (nodes && nodes.length) {
    const parent = nodes[0].parentNode;
    for (let i = 0; i < nodes.length; i++) {
      parent.removeChild(nodes[i]);
    }
  }
}

/**
 * A simple client-side router for single-page applications. It uses
 * express-style middleware and has a first-class support for Web Components and
 * lazy-loading. Works great in Polymer and non-Polymer apps.
 *
 * Use `new Router(outlet, options)` to create a new Router instance.
 *
 * * The `outlet` parameter is a reference to the DOM node to render
 *   the content into.
 *
 * * The `options` parameter is an optional object with options. The following
 *   keys are supported:
 *   * `baseUrl` — the initial value for [
 *     the `baseUrl` property
 *   ](#/classes/Router#property-baseUrl)
 *
 * The Router instance is automatically subscribed to navigation events
 * on `window`.
 *
 * See [Live Examples](#/classes/Router/demos/demo/index.html) for the detailed usage demo and code snippets.
 *
 * See also detailed API docs for the following methods, for the advanced usage:
 *
 * * [setOutlet](#/classes/Router#method-setOutlet) – should be used to configure the outlet.
 * * [setTriggers](#/classes/Router#method-setTriggers) – should be used to configure the navigation events.
 * * [setRoutes](#/classes/Router#method-setRoutes) – should be used to configure the routes.
 *
 * Only `setRoutes` has to be called manually, others are automatically invoked when creating a new instance.
 *
 * @extends Resolver
 * @demo demo/index.html
 * @summary JavaScript class that renders different DOM content depending on
 *    a given path. It can re-render when triggered or automatically on
 *    'popstate' and / or 'click' events.
 */
export class Router extends Resolver {
  ready: Promise<RouterLocation | Node | undefined>;
  location: RouterLocation;
  __lastStartedRenderId: number;
  __navigationEventHandler: (event?: CustomEvent) => void;
  __outlet?: Node;
  __previousContext?: RouteContext;
  __urlForName?: (routeName: string, params?: RouteParams) => string;
  __createdByRouter: WeakMap<HTMLElement, boolean>;
  __addedByRouter: WeakMap<HTMLElement, boolean>;
  __appearingContent?: HTMLElement[] | null;
  __disappearingContent?: HTMLElement[] | null;

  /**
   * Creates a new Router instance with a given outlet, and
   * automatically subscribes it to navigation events on the `window`.
   * Using a constructor argument or a setter for outlet is equivalent:
   *
   * ```
   * const router = new Router();
   * router.setOutlet(outlet);
   * ```
   * @param outlet
   * @param options
   */
  constructor(outlet?: Node, options?: RouterOptions) {
    const baseElement = document.head.querySelector('base');
    const baseHref = baseElement && baseElement.getAttribute('href');
    super(
      [],
      Object.assign(
        {
          baseUrl: baseHref && Resolver.__createUrl(baseHref, document.URL).pathname.replace(/[^\/]*$/, ''),
        },
        options
      )
    );

    this.resolveRoute = (context: RouteContext) => this.__resolveRoute(context);
    setNavigationTriggers([POPSTATE, CLICK]);

    this.ready = Promise.resolve(outlet);
    this.location = createLocation({ resolver: this });

    this.__lastStartedRenderId = 0;
    this.__navigationEventHandler = this.__onNavigationEvent.bind(this);
    this.setOutlet(outlet);
    this.subscribe();
    this.__createdByRouter = new WeakMap<HTMLElement, boolean>();
    this.__addedByRouter = new WeakMap<HTMLElement, boolean>();
  }

  __resolveRoute(context: RouteContext): Promise<RouteResult | undefined> {
    const route = context.route;

    let callbacks: Promise<void> = Promise.resolve();

    if (isFunction(route.children)) {
      callbacks = callbacks
        .then(() =>
          (route.children as (context: Omit<RouteContext, 'next'>) => Route[] | Promise<Route[]>)(
            copyContextWithoutNext(context)
          )
        )
        .then((children: Route[] | Route) => {
          if (!isResultNotEmpty(children) && !isFunction(route.children)) {
            children = route.children as Route[];
          }
          processNewChildren(children as Route[] | Record<string, unknown>, route);
        });
    }

    const commands: RouteCommands = {
      redirect: (path: string) => createRedirect(context, path),
      component: (component: string) => {
        const element = document.createElement(component);
        this.__createdByRouter.set(element, true);
        return element;
      },
    };

    return callbacks
      .then(() => {
        if (this.__isLatestRender(context)) {
          return runCallbackIfPossible(route.action, [context, commands], route);
        }
        return undefined;
      })
      .then((result: RouteResult | undefined) => {
        if (isResultNotEmpty(result)) {
          if (result instanceof HTMLElement || (result as RedirectResult).redirect || result === notFoundResult) {
            return result;
          }
        }

        if (isString(route.redirect)) {
          return commands.redirect(route.redirect);
        }

        if (route.bundle) {
          return loadBundle(route.bundle).then(
            () => undefined,
            () => {
              throw new Error(log(`Bundle not found: ${route.bundle}. Check if the file name is correct`));
            }
          );
        }
        return undefined;
      })
      .then((result: RouteResult | undefined) => {
        if (isResultNotEmpty(result)) {
          return result;
        }
        if (isString(route.component)) {
          return commands.component(route.component);
        }
        return undefined;
      });
  }

  /**
   * Takes current routes and set it
   * @param routes: Route<C>[]
   * @returns void
   */
  /**
   * Sets the router outlet (the DOM node where the content for the current
   * route is inserted). Any content pre-existing in the router outlet is
   * removed at the end of each render pass.
   *
   * NOTE: this method is automatically invoked first time when creating a new Router instance.
   *
   * @param outlet the DOM node where the content for the current route
   *     is inserted.
   */
  setOutlet(outlet?: Node): void {
    if (outlet) {
      this.__ensureOutlet(outlet);
    }
    this.__outlet = outlet;
  }

  /**
   * Returns the current router outlet. The initial value is undefined.
   */
  /**
   * Returns the current router outlet. The initial value is undefined.
   *
   * @return the current router outlet (or `undefined`)
   */
  getOutlet(): Node | undefined {
    return this.__outlet;
  }

  /**
   * Takes current routes and set it
   * @param routes: Route | Route[]
   * @returns Route | Route[]
   */
  /**
   * Sets the routing config (replacing the existing one) and triggers a
   * navigation event so that the router outlet is refreshed according to the
   * current `window.location` and the new routing config.
   *
   * Each route object may have the following properties, listed here in the processing order:
   * * `path` – the route path (relative to the parent route if any) in the
   * [express.js syntax](https://expressjs.com/en/guide/routing.html#route-paths").
   *
   * * `children` – an array of nested routes or a function that provides this
   * array at the render time. The function can be synchronous or asynchronous:
   * in the latter case the render is delayed until the returned promise is
   * resolved. The `children` function is executed every time when this route is
   * being rendered. This allows for dynamic route structures (e.g. backend-defined),
   * but it might have a performance impact as well. In order to avoid calling
   * the function on subsequent renders, you can override the `children` property
   * of the route object and save the calculated array there
   * (via `context.route.children = [ route1, route2, ...];`).
   * Parent routes are fully resolved before resolving the children. Children
   * 'path' values are relative to the parent ones.
   *
   * * `action` – the action that is executed before the route is resolved.
   * The value for this property should be a function, accepting `context`
   * and `commands` parameters described below. If present, this function is
   * always invoked first, disregarding of the other properties' presence.
   * The action can return a result directly or within a `Promise`, which
   * resolves to the result. If the action result is an `HTMLElement` instance,
   * a `commands.component(name)` result, a `commands.redirect(path)` result,
   * or a `context.next()` result, the current route resolution is finished,
   * and other route config properties are ignored.
   * See also **Route Actions** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `redirect` – other route's path to redirect to. Passes all route parameters to the redirect target.
   * The target route should also be defined.
   * See also **Redirects** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `bundle` – string containing the path to `.js` or `.mjs` bundle to load before resolving the route,
   * or the object with "module" and "nomodule" keys referring to different bundles.
   * Each bundle is only loaded once. If "module" and "nomodule" are set, only one bundle is loaded,
   * depending on whether the browser supports ES modules or not.
   * The property is ignored when either an `action` returns the result or `redirect` property is present.
   * Any error, e.g. 404 while loading bundle will cause route resolution to throw.
   * See also **Code Splitting** section in [Live Examples](#/classes/Router/demos/demo/index.html).
   *
   * * `component` – the tag name of the Web Component to resolve the route to.
   * The property is ignored when either an `action` returns the result or `redirect` property is present.
   * If route contains the `component` property (or an action that return a component)
   * and its child route also contains the `component` property, child route's component
   * will be rendered as a light dom child of a parent component.
   *
   * * `name` – the string name of the route to use in the
   * [`router.urlForName(name, params)`](#/classes/Router#method-urlForName)
   * navigation helper method.
   *
   * For any route function (`action`, `children`) defined, the corresponding `route` object is available inside the callback
   * through the `this` reference. If you need to access it, make sure you define the callback as a non-arrow function
   * because arrow functions do not have their own `this` reference.
   *
   * `context` object that is passed to `action` function holds the following properties:
   * * `context.pathname` – string with the pathname being resolved
   *
   * * `context.search` – search query string
   *
   * * `context.hash` – hash string
   *
   * * `context.params` – object with route parameters
   *
   * * `context.route` – object that holds the route that is currently being rendered.
   *
   * * `context.next()` – function for asynchronously getting the next route
   * contents from the resolution chain (if any)
   *
   * `commands` object that is passed to `action` function has
   * the following methods:
   *
   * * `commands.redirect(path)` – function that creates a redirect data
   * for the path specified.
   *
   * * `commands.component(component)` – function that creates a new HTMLElement
   * with current context. Note: the component created by this function is reused if visiting the same path twice in row.
   *
   *
   * @param routes a single route or an array of those
   * @param skipRender configure the router but skip rendering the
   *     route corresponding to the current `window.location` values
   *
   * @return
   */
  setRoutes(routes: Route | Route[], skipRender = false): Promise<RouterLocation | Node | undefined> {
    this.__previousContext = undefined;
    this.__urlForName = undefined;
    super.setRoutes(routes);
    if (!skipRender) {
      this.__onNavigationEvent();
    }
    return this.ready;
  }

  /**
   * Asynchronously resolves the given pathname and renders the resolved route component into the router outlet. If no router outlet is set at the time of calling this method, or at the time when the route resolution is completed, a TypeError is thrown.
   * Returns a promise that is fulfilled with the router outlet DOM Node after the route component is created and inserted into the router outlet, or rejected if no route matches the given path.
   * If another render pass is started before the previous one is completed, the result of the previous render pass is ignored.
   * @param pathnameOrContext — the pathname to render or a context object with a pathname property and other properties to pass to the resolver.
   * @param shouldUpdateHistory
   */
  /**
   * Asynchronously resolves the given pathname and renders the resolved route
   * component into the router outlet. If no router outlet is set at the time of
   * calling this method, or at the time when the route resolution is completed,
   * a `TypeError` is thrown.
   *
   * Returns a promise that is fulfilled with the router outlet DOM Node after
   * the route component is created and inserted into the router outlet, or
   * rejected if no route matches the given path.
   *
   * If another render pass is started before the previous one is completed, the
   * result of the previous render pass is ignored.
   *
   * @param pathnameOrContext
   *    the pathname to render or a context object with a `pathname` property,
   *    optional `search` and `hash` properties, and other properties
   *    to pass to the resolver.
   * @param shouldUpdateHistory
   *    update browser history with the rendered location
   * @return
   */
  render(
    pathnameOrContext: string | Partial<RouteContext>,
    shouldUpdateHistory?: boolean
  ): Promise<RouterLocation | Node | undefined> {
    const renderId = ++this.__lastStartedRenderId;
    const context: RouteContext = Object.assign(
      {
        search: '',
        hash: '',
      },
      isString(pathnameOrContext) ? { pathname: pathnameOrContext } : pathnameOrContext,
      {
        __renderId: renderId,
      }
    ) as RouteContext;

    this.ready = this.resolve(context)
      .then((context: RouteContext) => this.__fullyResolveChain(context))
      .then((context: RouteContext) => {
        if (this.__isLatestRender(context)) {
          const previousContext = this.__previousContext;

          if (context === previousContext) {
            this.__updateBrowserHistory(previousContext, true);
            return this.location;
          }

          this.location = createLocation(context);

          if (shouldUpdateHistory) {
            this.__updateBrowserHistory(context, renderId === 1);
          }

          fireRouterEvent('location-changed', { location: this.location });

          if (context.__skipAttach) {
            this.__copyUnchangedElements(context, previousContext);
            this.__previousContext = context;
            return this.location;
          }

          this.__addAppearingContent(context, previousContext);
          const animationDone = this.__animateIfNeeded(context);

          this.__runOnAfterEnterCallbacks(context);
          this.__runOnAfterLeaveCallbacks(context, previousContext);

          return animationDone.then(() => {
            if (this.__isLatestRender(context)) {
              this.__removeDisappearingContent();
              this.__previousContext = context;
              return this.location;
            }
            return undefined;
          });
        }
        return undefined;
      })
      .catch((error: Error) => {
        if (renderId === this.__lastStartedRenderId) {
          if (shouldUpdateHistory) {
            this.__updateBrowserHistory(context);
          }
          removeDomNodes(this.__outlet && (this.__outlet as Element).children);
          this.location = createLocation(Object.assign(context, { resolver: this }));
          fireRouterEvent('error', Object.assign({ router: this, error }, context));
          throw error;
        }
        return undefined;
      });
    return this.ready;
  }

  __fullyResolveChain(
    topOfTheChainContextBeforeRedirects: RouteContext,
    contextBeforeRedirects: RouteContext = topOfTheChainContextBeforeRedirects
  ): Promise<RouteContext> {
    return this.__findComponentContextAfterAllRedirects(contextBeforeRedirects).then(
      (contextAfterRedirects: RouteContext) => {
        const redirectsHappened = contextAfterRedirects !== contextBeforeRedirects;
        const topOfTheChainContextAfterRedirects = redirectsHappened
          ? contextAfterRedirects
          : topOfTheChainContextBeforeRedirects;

        const matchedPath = getPathnameForRouter(
          getMatchedPath(contextAfterRedirects.chain),
          contextAfterRedirects.resolver
        );
        const isFound = matchedPath === contextAfterRedirects.pathname;

        const findNextContextIfAny = (
          context: RouteContext,
          parent: Route = context.route,
          prevResult?: RouteResult | null
        ): Promise<RouteContext | typeof notFoundResult | null> => {
          return context
            .next(undefined, parent, prevResult)
            .then((nextContext: RouteContext | typeof notFoundResult) => {
              if (nextContext === null || nextContext === notFoundResult) {
                if (isFound) {
                  return context;
                } else if (parent.parent !== null) {
                  return findNextContextIfAny(context, parent.parent, nextContext);
                } else {
                  return nextContext;
                }
              }

              return nextContext;
            });
        };

        return findNextContextIfAny(contextAfterRedirects).then(
          (nextContext: RouteContext | typeof notFoundResult | null) => {
            if (nextContext === null || nextContext === notFoundResult) {
              throw getNotFoundError(topOfTheChainContextAfterRedirects);
            }

            return nextContext && nextContext !== notFoundResult && nextContext !== contextAfterRedirects
              ? this.__fullyResolveChain(topOfTheChainContextAfterRedirects, nextContext as RouteContext)
              : this.__amendWithOnBeforeCallbacks(contextAfterRedirects);
          }
        );
      }
    );
  }

  __findComponentContextAfterAllRedirects(context: RouteContext): Promise<RouteContext> {
    const result = context.result;
    if (result instanceof HTMLElement) {
      renderElement(context, result);
      return Promise.resolve(context);
    } else if (result && (result as RedirectResult).redirect) {
      return this.__redirect((result as RedirectResult).redirect, context.__redirectCount, context.__renderId).then(
        (context: RouteContext) => this.__findComponentContextAfterAllRedirects(context)
      );
    } else if (result instanceof Error) {
      return Promise.reject(result);
    } else {
      return Promise.reject(
        new Error(
          log(
            `Invalid route resolution result for path "${context.pathname}". ` +
              `Expected redirect object or HTML element, but got: "${logValue(result)}". ` +
              `Double check the action return value for the route.`
          )
        )
      );
    }
  }

  __amendWithOnBeforeCallbacks(contextWithFullChain: RouteContext): Promise<RouteContext> {
    return this.__runOnBeforeCallbacks(contextWithFullChain).then((amendedContext: RouteContext) => {
      if (amendedContext === this.__previousContext || amendedContext === contextWithFullChain) {
        return amendedContext;
      }
      return this.__fullyResolveChain(amendedContext);
    });
  }

  __runOnBeforeCallbacks(newContext: RouteContext): Promise<RouteContext> {
    const previousContext = this.__previousContext || ({} as RouteContext);
    const previousChain = previousContext.chain || [];
    const newChain = newContext.chain;

    let callbacks: Promise<PreventResult | RedirectResult | void | undefined> = Promise.resolve();
    const prevent = (): PreventResult => ({ cancel: true });
    const redirect = (pathname: string): RedirectResult => createRedirect(newContext, pathname);

    newContext.__divergedChainIndex = 0;
    newContext.__skipAttach = false;
    if (previousChain.length) {
      for (let i = 0; i < Math.min(previousChain.length, newChain.length); i = ++newContext.__divergedChainIndex) {
        if (
          previousChain[i].route !== newChain[i].route ||
          (previousChain[i].path !== newChain[i].path && previousChain[i].element !== newChain[i].element) ||
          !this.__isReusableElement(previousChain[i].element, newChain[i].element)
        ) {
          break;
        }
      }

      newContext.__skipAttach =
        newChain.length === previousChain.length &&
        newContext.__divergedChainIndex == newChain.length &&
        this.__isReusableElement(newContext.result as HTMLElement, previousContext.result as HTMLElement);

      if (newContext.__skipAttach) {
        for (let i = newChain.length - 1; i >= 0; i--) {
          callbacks = this.__runOnBeforeLeaveCallbacks(callbacks, newContext, { prevent }, previousChain[i]);
        }
        for (let i = 0; i < newChain.length; i++) {
          callbacks = this.__runOnBeforeEnterCallbacks(callbacks, newContext, { prevent, redirect }, newChain[i]);
          (previousChain[i].element as HTMLElementWithLocation).location = createLocation(
            newContext,
            previousChain[i].route
          );
        }
      } else {
        for (let i = previousChain.length - 1; i >= newContext.__divergedChainIndex; i--) {
          callbacks = this.__runOnBeforeLeaveCallbacks(callbacks, newContext, { prevent }, previousChain[i]);
        }
      }
    }
    if (!newContext.__skipAttach) {
      for (let i = 0; i < newChain.length; i++) {
        if (i < newContext.__divergedChainIndex) {
          if (i < previousChain.length && previousChain[i].element) {
            (previousChain[i].element as HTMLElementWithLocation).location = createLocation(
              newContext,
              previousChain[i].route
            );
          }
        } else {
          callbacks = this.__runOnBeforeEnterCallbacks(callbacks, newContext, { prevent, redirect }, newChain[i]);
          if (newChain[i].element) {
            (newChain[i].element as HTMLElementWithLocation).location = createLocation(newContext, newChain[i].route);
          }
        }
      }
    }
    return callbacks.then((amendmentResult?: PreventResult | RedirectResult | void) => {
      if (amendmentResult) {
        if ((amendmentResult as PreventResult).cancel) {
          this.__previousContext.__renderId = newContext.__renderId;
          return this.__previousContext;
        }
        if ((amendmentResult as RedirectResult).redirect) {
          return this.__redirect(
            (amendmentResult as RedirectResult).redirect,
            newContext.__redirectCount,
            newContext.__renderId
          );
        }
      }
      return newContext;
    });
  }

  __runOnBeforeLeaveCallbacks(
    callbacks: Promise<PreventResult | RedirectResult | void | undefined>,
    newContext: RouteContext,
    commands: { prevent: () => PreventResult },
    chainElement: ChainItem
  ): Promise<PreventResult | RedirectResult | void | undefined> {
    const location = createLocation(newContext);
    return callbacks
      .then((result?: PreventResult | RedirectResult | void) => {
        if (this.__isLatestRender(newContext)) {
          const afterLeaveFunction = amend('onBeforeLeave', [location, commands, this], chainElement.element);
          return afterLeaveFunction(result);
        }
        return undefined;
      })
      .then((result?: PreventResult | RedirectResult | void) => {
        if (!((result || {}) as RedirectResult).redirect) {
          return result;
        }
        return undefined;
      });
  }

  __runOnBeforeEnterCallbacks(
    callbacks: Promise<PreventResult | RedirectResult | void | undefined>,
    newContext: RouteContext,
    commands: { prevent: () => PreventResult; redirect: (pathname: string) => RedirectResult },
    chainElement: ChainItem
  ): Promise<PreventResult | RedirectResult | void | undefined> {
    const location = createLocation(newContext, chainElement.route);
    return callbacks.then((result?: PreventResult | RedirectResult | void) => {
      if (this.__isLatestRender(newContext)) {
        const beforeEnterFunction = amend('onBeforeEnter', [location, commands, this], chainElement.element);
        return beforeEnterFunction(result);
      }
      return undefined;
    });
  }

  __isReusableElement(element?: HTMLElement, otherElement?: HTMLElement): boolean {
    if (element && otherElement) {
      return this.__createdByRouter.get(element) && this.__createdByRouter.get(otherElement)
        ? element.localName === otherElement.localName
        : element === otherElement;
    }
    return false;
  }

  __isLatestRender(context: RouteContext): boolean {
    return context.__renderId === this.__lastStartedRenderId;
  }

  __redirect(
    redirectData: { pathname: string; from: string; params: RouteParams },
    counter?: number,
    renderId?: number
  ): Promise<RouteContext> {
    if ((counter || 0) > MAX_REDIRECT_COUNT) {
      throw new Error(log(`Too many redirects when rendering ${redirectData.from}`));
    }

    return this.resolve({
      pathname: this.urlForPath(redirectData.pathname, redirectData.params),
      redirectFrom: redirectData.from,
      __redirectCount: (counter || 0) + 1,
      __renderId: renderId,
    });
  }

  __ensureOutlet(outlet: Node = this.__outlet): void {
    if (!(outlet instanceof Node)) {
      throw new TypeError(log(`Expected router outlet to be a valid DOM Node (but got ${outlet})`));
    }
  }

  __updateBrowserHistory({ pathname, search = '', hash = '' }: RouteContext, replace?: boolean): void {
    if (window.location.pathname !== pathname || window.location.search !== search || window.location.hash !== hash) {
      const changeState = replace ? 'replaceState' : 'pushState';
      window.history[changeState](null, document.title, pathname + search + hash);
      window.dispatchEvent(new PopStateEvent('popstate', { state: 'router-ignore' }));
    }
  }

  __copyUnchangedElements(context: RouteContext, previousContext?: RouteContext): HTMLElement | Node {
    let deepestCommonParent: HTMLElement | Node = this.__outlet;
    for (let i = 0; i < context.__divergedChainIndex; i++) {
      const unchangedElement = previousContext && previousContext.chain[i].element;
      if (unchangedElement) {
        if (unchangedElement.parentNode === deepestCommonParent) {
          context.chain[i].element = unchangedElement;
          deepestCommonParent = unchangedElement;
        } else {
          break;
        }
      }
    }
    return deepestCommonParent;
  }

  __addAppearingContent(context: RouteContext, previousContext?: RouteContext): void {
    this.__ensureOutlet();

    this.__removeAppearingContent();

    const deepestCommonParent = this.__copyUnchangedElements(context, previousContext);

    this.__appearingContent = [];
    this.__disappearingContent = Array.from(
      (deepestCommonParent as Element).children as HTMLCollectionOf<HTMLElement>
    ).filter((e) => this.__addedByRouter.get(e) && e !== context.result);

    let parentElement: HTMLElement | Node = deepestCommonParent;
    for (let i = context.__divergedChainIndex; i < context.chain.length; i++) {
      const elementToAdd = context.chain[i].element;
      if (elementToAdd) {
        parentElement.appendChild(elementToAdd);
        this.__addedByRouter.set(elementToAdd, true);
        if (parentElement === deepestCommonParent) {
          this.__appearingContent.push(elementToAdd);
        }
        parentElement = elementToAdd;
      }
    }
  }

  __removeDisappearingContent(): void {
    if (this.__disappearingContent) {
      removeDomNodes(this.__disappearingContent);
    }
    this.__disappearingContent = null;
    this.__appearingContent = null;
  }

  __removeAppearingContent(): void {
    if (this.__disappearingContent && this.__appearingContent) {
      removeDomNodes(this.__appearingContent);
      this.__disappearingContent = null;
      this.__appearingContent = null;
    }
  }

  __runOnAfterLeaveCallbacks(currentContext: RouteContext, targetContext?: RouteContext): void {
    if (!targetContext) {
      return;
    }

    for (let i = targetContext.chain.length - 1; i >= currentContext.__divergedChainIndex; i--) {
      if (!this.__isLatestRender(currentContext)) {
        break;
      }
      const currentComponent = targetContext.chain[i].element;
      if (!currentComponent) {
        continue;
      }
      try {
        const location = createLocation(currentContext);
        runCallbackIfPossible(
          (currentComponent as HTMLElementWithLocation).onAfterLeave,
          [location, {}, targetContext.resolver],
          currentComponent
        );
      } finally {
        if (this.__disappearingContent.indexOf(currentComponent) > -1) {
          removeDomNodes(currentComponent.children);
        }
      }
    }
  }

  __runOnAfterEnterCallbacks(currentContext: RouteContext): void {
    for (let i = currentContext.__divergedChainIndex; i < currentContext.chain.length; i++) {
      if (!this.__isLatestRender(currentContext)) {
        break;
      }
      const currentComponent = currentContext.chain[i].element || ({} as HTMLElement);
      const location = createLocation(currentContext, currentContext.chain[i].route);
      runCallbackIfPossible(
        (currentComponent as HTMLElementWithLocation).onAfterEnter,
        [location, {}, currentContext.resolver],
        currentComponent
      );
    }
  }

  __animateIfNeeded(context: RouteContext): Promise<RouteContext> {
    const from = (this.__disappearingContent || [])[0];
    const to = (this.__appearingContent || [])[0];
    const promises: Promise<void>[] = [];

    const chain = context.chain;
    let config: boolean | { leave?: string; enter?: string } | undefined;
    for (let i = chain.length; i > 0; i--) {
      if (chain[i - 1].route.animate) {
        config = chain[i - 1].route.animate;
        break;
      }
    }

    if (from && to && config) {
      const leave = (isObject(config) && (config as { leave?: string; enter?: string }).leave) || 'leaving';
      const enter = (isObject(config) && (config as { leave?: string; enter?: string }).enter) || 'entering';
      promises.push(animate(from, leave));
      promises.push(animate(to, enter));
    }

    return Promise.all(promises).then(() => context);
  }

  /**
   * Subscribes this instance to navigation events on the `window`.
   *
   * NOTE: beware of resource leaks. For as long as a router instance is
   * subscribed to navigation events, it won't be garbage collected.
   */
  subscribe(): void {
    window.addEventListener('router-go', this.__navigationEventHandler as EventListener);
  }

  /**
   * Removes the subscription to navigation events created in the `subscribe()`
   * method.
   */
  unsubscribe(): void {
    window.removeEventListener('router-go', this.__navigationEventHandler as EventListener);
  }

  __onNavigationEvent(event?: CustomEvent): void {
    const { pathname, search, hash } = event ? event.detail : window.location;
    if (isString(this.__normalizePathname(pathname))) {
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      this.render({ pathname, search, hash }, true);
    }
  }

  /**
   * Generates a URL for the route with the given name, optionally performing
   * substitution of parameters.
   *
   * The route is searched in all the Router instances subscribed to
   * navigation events.
   *
   * **Note:** For child route names, only array children are considered.
   * It is not possible to generate URLs using a name for routes set with
   * a children function.
   *
   * @param name the route name or the route’s `component` name.
   * @param params Optional object with route path parameters.
   * Named parameters are passed by name (`params[name] = value`), unnamed
   * parameters are passed by index (`params[index] = value`).
   *
   * @return
   */
  urlForName(name: string, params?: RouteParams): string {
    if (!this.__urlForName) {
      this.__urlForName = generateUrls(this);
    }
    return getPathnameForRouter(this.__urlForName(name, params), this);
  }

  /**
   * Generates a URL for the given route path, optionally performing
   * substitution of parameters.
   *
   * @param path string route path declared in [express.js syntax](https://expressjs.com/en/guide/routing.html#route-paths").
   * @param params Optional object with route path parameters.
   * Named parameters are passed by name (`params[name] = value`), unnamed
   * parameters are passed by index (`params[index] = value`).
   *
   * @return
   */
  urlForPath(path: string, params?: RouteParams): string {
    return getPathnameForRouter(compile(path)(params), this);
  }

  /**
   * Triggers navigation to a new path. Returns a boolean without waiting until
   * the navigation is complete. Returns `true` if at least one `Router`
   * has handled the navigation (was subscribed and had `baseUrl` matching
   * the `path` argument), otherwise returns `false`.
   *
   * @param path
   *   a new in-app path string, or an URL-like object with `pathname`
   *   string property, and optional `search` and `hash` string properties.
   * @return
   */
  static go(path: string | { pathname: string; search?: string; hash?: string }): boolean {
    const { pathname, search, hash } = isString(path) ? this.__createUrl(path, 'http://a') : path;
    return fireRouterEvent('go', { pathname, search: search || '', hash: hash || '' });
  }
}
