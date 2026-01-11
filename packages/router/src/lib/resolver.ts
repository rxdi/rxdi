import { parse, pathToRegexp, tokensToFunction } from './path-to-regexp';
import {
  ChainItem,
  GenerateUrlsOptions,
  MatchIterator,
  MatchResult,
  notFoundResult,
  PathRegexp,
  PathToken,
  RedirectResult,
  ResolverOptions,
  Route,
  RouteChildren,
  RouteContext,
  RouteParams,
  RouteResult,
  UrlGenerator,
} from './types';
import { ensureRoutes, getNotFoundError, isFunction, isObject, isString, log, toArray } from './utils';

const { hasOwnProperty } = Object.prototype;
const cache = new Map<string, PathRegexp>();
cache.set('|false', {
  keys: [],
  pattern: /(?:)/,
});

function decodeParam(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPath(
  routepath: string | string[],
  path: string,
  exact: boolean,
  parentKeys?: PathToken[],
  parentParams?: RouteParams
): MatchResult | null {
  exact = !!exact;
  const cacheKey = `${routepath}|${exact}`;
  let regexp = cache.get(cacheKey);

  if (!regexp) {
    const keys: PathToken[] = [];
    regexp = {
      keys,
      pattern: pathToRegexp(routepath, keys, {
        end: exact,
        strict: routepath === '',
      }),
    };
    cache.set(cacheKey, regexp);
  }

  const m = regexp.pattern.exec(path);
  if (!m) {
    return null;
  }

  const params = Object.assign({}, parentParams);

  for (let i = 1; i < m.length; i++) {
    const key = regexp.keys[i - 1];
    const prop = key.name;
    const value = m[i];
    if (value !== undefined || !hasOwnProperty.call(params, prop)) {
      if (key.repeat) {
        params[prop] = value ? value.split(key.delimiter).map(decodeParam) : [];
      } else {
        params[prop] = value ? decodeParam(value) : value;
      }
    }
  }

  return {
    path: m[0],
    keys: (parentKeys || []).concat(regexp.keys),
    params,
  };
}

function matchRoute(
  route: Route,
  pathname: string,
  ignoreLeadingSlash: boolean,
  parentKeys?: PathToken[],
  parentParams?: RouteParams
): MatchIterator {
  let match: MatchResult | null;
  let childMatches: MatchIterator | null;
  let childIndex = 0;
  let routepath: string | string[] = route.path || '';
  let isAbsolute = false;

  if (Array.isArray(routepath)) {
    routepath = routepath.map((path) => {
      if (path.charAt(0) === '/') {
        isAbsolute = true;
        return ignoreLeadingSlash ? path.substr(1) : path;
      }
      return path;
    });
  } else if (routepath.charAt(0) === '/') {
    isAbsolute = true;
    if (ignoreLeadingSlash) {
      routepath = routepath.substr(1);
    }
  }

  if (isAbsolute) {
    ignoreLeadingSlash = true;
  }

  return {
    next(routeToSkip?: Route): IteratorResult<MatchResult, undefined> {
      if (route === routeToSkip) {
        return { done: true, value: undefined };
      }

      const children = (route.__children = route.__children || route.children) as Route[] | undefined;

      if (!match) {
        match = matchPath(routepath, pathname, !children, parentKeys, parentParams);

        if (match) {
          return {
            done: false,
            value: {
              route,
              keys: match.keys,
              params: match.params,
              path: match.path,
            },
          };
        }
      }

      if (match && children) {
        while (childIndex < children.length) {
          if (!childMatches) {
            const childRoute = children[childIndex];
            childRoute.parent = route;

            let matchedLength = match.path.length;
            if (matchedLength > 0 && pathname.charAt(matchedLength) === '/') {
              matchedLength += 1;
            }

            childMatches = matchRoute(
              childRoute,
              pathname.substr(matchedLength),
              ignoreLeadingSlash,
              match.keys,
              match.params
            );
          }

          const childMatch = childMatches.next(routeToSkip);
          if (!childMatch.done) {
            return {
              done: false,
              value: childMatch.value,
            };
          }

          childMatches = null;
          childIndex++;
        }
      }

      return { done: true, value: undefined };
    },
  };
}

function resolveRoute(context: RouteContext): RouteResult | Promise<RouteResult> | undefined | Promise<undefined> {
  if (isFunction(context.route.action)) {
    return context.route.action(context);
  }
  return undefined;
}

function isChildRoute(parentRoute: Route, childRoute: Route): boolean {
  let route: Route | null | undefined = childRoute;
  while (route) {
    route = route.parent;
    if (route === parentRoute) {
      return true;
    }
  }
  return false;
}

function generateErrorMessage(currentContext: RouteContext): string {
  let errorMessage = `Path '${currentContext.pathname}' is not properly resolved due to an error.`;
  const routePath = (currentContext.route || {}).path;
  if (routePath) {
    errorMessage += ` Resolution had failed on route: '${routePath}'`;
  }
  return errorMessage;
}

function updateChainForRoute(context: RouteContext, match: MatchResult & { route: Route }): void {
  const { route, path } = match;

  if (route && !route.__synthetic) {
    const item: ChainItem = { path, route };
    if (!context.chain) {
      context.chain = [];
    } else {
      if (route.parent) {
        let i = context.chain.length;
        while (i-- && context.chain[i].route && context.chain[i].route !== route.parent) {
          context.chain.pop();
        }
      }
    }
    context.chain.push(item);
  }
}

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright (c) 2015-present Kriasoft.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
export class Resolver {
  baseUrl: string;
  errorHandler?: (error: Error) => RouteResult;
  resolveRoute: (context: RouteContext) => RouteResult | Promise<RouteResult> | undefined | Promise<undefined>;
  context: Partial<RouteContext> & { resolver: Resolver };
  root: Route;

  constructor(routes: Route | Route[], options: ResolverOptions = {}) {
    if (Object(routes) !== routes) {
      throw new TypeError('Invalid routes');
    }

    this.baseUrl = options.baseUrl || '';
    this.errorHandler = options.errorHandler;
    this.resolveRoute = options.resolveRoute || resolveRoute;
    this.context = Object.assign({ resolver: this }, options.context);
    this.root = Array.isArray(routes) ? { path: '', __children: routes, parent: null, __synthetic: true } : routes;
    this.root.parent = null;
  }

  /**
   * Returns the current list of routes (as a shallow copy). Adding / removing
   * routes to / from the returned array does not affect the routing config,
   * but modifying the route objects does.
   *
   * @return
   */
  getRoutes(): Route[] {
    const children = this.root.__children;
    return Array.isArray(children) ? [...children] : [];
  }

  /**
   * Sets the routing config (replacing the existing one).
   *
   * @param routes a single route or an array of those
   *    (the array is shallow copied)
   */
  setRoutes(routes: Route | Route[]): void {
    ensureRoutes(routes);
    const newRoutes = [...toArray(routes)];
    this.root.__children = newRoutes;
  }

  /**
   * Appends one or several routes to the routing config and returns the
   * effective routing config after the operation.
   *
   * @param routes a single route or an array of those
   *    (the array is shallow copied)
   * @return
   * @protected
   */
  addRoutes(routes: Route | Route[]): Route[] {
    ensureRoutes(routes);
    if (!this.root.__children || !Array.isArray(this.root.__children)) {
      this.root.__children = [];
    }
    this.root.__children.push(...toArray(routes));
    return this.getRoutes();
  }

  /**
   * Removes all existing routes from the routing config.
   */
  removeRoutes(): void {
    this.setRoutes([]);
  }

  /**
   * Asynchronously resolves the given pathname, i.e. finds all routes matching
   * the pathname and tries resolving them one after another in the order they
   * are listed in the routes config until the first non-null result.
   *
   * Returns a promise that is fulfilled with the return value of an object that consists of the first
   * route handler result that returns something other than `null` or `undefined` and context used to get this result.
   *
   * If no route handlers return a non-null result, or if no route matches the
   * given pathname the returned promise is rejected with a 'page not found'
   * `Error`.
   *
   * @param pathnameOrContext the pathname to
   *    resolve or a context object with a `pathname` property and other
   *    properties to pass to the route resolver functions.
   * @return
   */
  resolve(pathnameOrContext: string | Partial<RouteContext>): Promise<RouteContext> {
    const context: RouteContext = Object.assign(
      {},
      this.context,
      isString(pathnameOrContext) ? { pathname: pathnameOrContext } : pathnameOrContext
    ) as RouteContext;
    const match = matchRoute(this.root, this.__normalizePathname(context.pathname), !!this.baseUrl);
    const resolve = this.resolveRoute;
    let matches: IteratorResult<MatchResult, undefined> | null = null;
    let nextMatches: IteratorResult<MatchResult, undefined> | null = null;
    let currentContext = context;

    function next(
      resume?: boolean,
      parent: Route = matches.value.route,
      prevResult?: RouteResult | null
    ): Promise<RouteContext | typeof notFoundResult> {
      const routeToSkip = prevResult === null && matches.value.route;
      matches = nextMatches || match.next(routeToSkip);
      nextMatches = null;

      if (!resume) {
        if (matches.done || !isChildRoute(parent, matches.value.route)) {
          nextMatches = matches;
          return Promise.resolve(notFoundResult);
        }
      }

      if (matches.done) {
        return Promise.reject(getNotFoundError(context));
      }

      currentContext = Object.assign(
        currentContext ? { chain: currentContext.chain ? currentContext.chain.slice(0) : [] } : {},
        context,
        matches.value
      ) as RouteContext;
      updateChainForRoute(currentContext, matches.value as MatchResult & { route: Route });

      return Promise.resolve(resolve(currentContext)).then((resolution) => {
        if (resolution !== null && resolution !== undefined && resolution !== notFoundResult) {
          currentContext.result = (resolution as RedirectResult).redirect
            ? resolution
            : (resolution as HTMLElement).tagName
            ? resolution
            : resolution;
          return currentContext;
        }
        return next(resume, parent, resolution);
      });
    }

    context.next = next;

    return Promise.resolve()
      .then(() => next(true, this.root))
      .then((result) => {
        if (result === notFoundResult) {
          throw getNotFoundError(context);
        }
        return result as RouteContext;
      })
      .catch((error: Error & { context?: RouteContext; code?: number }) => {
        const errorMessage = generateErrorMessage(currentContext);
        if (!error) {
          error = new Error(errorMessage) as Error & { context?: RouteContext; code?: number };
        } else {
          console.warn(errorMessage);
        }
        error.context = error.context || currentContext;
        if (!(error instanceof DOMException)) {
          error.code = error.code || 500;
        }
        if (this.errorHandler) {
          currentContext.result = this.errorHandler(error);
          return currentContext;
        }
        throw error;
      });
  }

  static __createUrl(url: string, base: string): URL {
    return new URL(url, base);
  }

  __getEffectiveBaseUrl(): string {
    return this.baseUrl
      ? (this.constructor as typeof Resolver)
          .__createUrl(this.baseUrl, document.baseURI || document.URL)
          .href.replace(/[^\/]*$/, '')
      : '';
  }

  __normalizePathname(pathname: string): string | undefined {
    if (!this.baseUrl) {
      return pathname;
    }

    const base = this.__getEffectiveBaseUrl();
    const normalizedUrl = (this.constructor as typeof Resolver).__createUrl(pathname, base).href;
    if (normalizedUrl.slice(0, base.length) === base) {
      return normalizedUrl.slice(base.length);
    }
    return undefined;
  }
}

const cache$1 = new Map<
  string,
  { toPath: (params?: RouteParams, options?: GenerateUrlsOptions) => string; keys: Record<string | number, boolean> }
>();

function cacheRoutes(
  routesByName: Map<string, Route[]>,
  route: Route,
  routes: Route[] | RouteChildren | undefined
): void {
  const name = route.name || route.component;
  if (name) {
    if (routesByName.has(name)) {
      routesByName.get(name).push(route);
    } else {
      routesByName.set(name, [route]);
    }
  }

  if (Array.isArray(routes)) {
    for (let i = 0; i < routes.length; i++) {
      const childRoute = routes[i];
      childRoute.parent = route;
      cacheRoutes(routesByName, childRoute, childRoute.__children || childRoute.children);
    }
  }
}

function getRouteByName(routesByName: Map<string, Route[]>, routeName: string): Route | undefined {
  const routes = routesByName.get(routeName);
  if (routes && routes.length > 1) {
    throw new Error(`Duplicate route with name "${routeName}".` + ` Try seting unique 'name' route properties.`);
  }
  return routes && routes[0];
}

function getRoutePath(route: Route): string {
  let path = route.path;
  path = Array.isArray(path) ? path[0] : path;
  return path !== undefined ? path : '';
}

export function generateUrls(router: Resolver, options: GenerateUrlsOptions = {}): UrlGenerator {
  if (!(router instanceof Resolver)) {
    throw new TypeError('An instance of Resolver is expected');
  }

  const routesByName = new Map<string, Route[]>();

  return (routeName: string, params?: RouteParams): string => {
    let route = getRouteByName(routesByName, routeName);
    if (!route) {
      routesByName.clear();
      cacheRoutes(routesByName, router.root, router.root.__children);

      route = getRouteByName(routesByName, routeName);
      if (!route) {
        throw new Error(`Route "${routeName}" not found`);
      }
    }

    let regexp = cache$1.get(route.fullPath);
    if (!regexp) {
      let fullPath = getRoutePath(route);
      let rt: Route | null | undefined = route.parent;
      while (rt) {
        const path = getRoutePath(rt);
        if (path) {
          fullPath = path.replace(/\/$/, '') + '/' + fullPath.replace(/^\//, '');
        }
        rt = rt.parent;
      }
      const tokens = parse(fullPath);
      const toPath = tokensToFunction(tokens);
      const keys: Record<string | number, boolean> = Object.create(null);
      for (let i = 0; i < tokens.length; i++) {
        if (!isString(tokens[i])) {
          keys[(tokens[i] as PathToken).name] = true;
        }
      }
      regexp = { toPath, keys };
      cache$1.set(fullPath, regexp);
      route.fullPath = fullPath;
    }

    let url = regexp.toPath(params, options) || '/';

    if (options.stringifyQueryParams && params) {
      const queryParams: Record<string, unknown> = {};
      const keys = Object.keys(params);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!regexp.keys[key]) {
          queryParams[key] = params[key];
        }
      }
      const query = options.stringifyQueryParams(queryParams);
      if (query) {
        url += query.charAt(0) === '?' ? query : `?${query}`;
      }
    }

    return url;
  };
}
