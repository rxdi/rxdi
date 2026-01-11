import { Router } from '.';
import { Resolver } from './resolver';

export interface RouteParams {
  [key: string]: string | string[];
}

export interface ChainItem {
  path: string;
  route: Route;
  element?: HTMLElement;
}

export interface RouteContext {
  pathname: string;
  search?: string;
  hash?: string;
  params: RouteParams;
  keys: PathToken[];
  route: Route;
  chain?: ChainItem[];
  result?: RouteResult;
  next?: (
    resume?: boolean,
    parent?: Route,
    prevResult?: RouteResult | null
  ) => Promise<RouteContext | typeof notFoundResult>;
  resolver?: Resolver;
  redirectFrom?: string;
  __renderId?: number;
  __redirectCount?: number;
  __divergedChainIndex?: number;
  __skipAttach?: boolean;
}

export interface RouterLocation {
  baseUrl: string;
  pathname: string;
  search: string;
  hash: string;
  routes: Route[];
  route: Route | null;
  params: RouteParams;
  redirectFrom?: string;
  getUrl: (userParams?: RouteParams) => string;
}

export interface RouteCommands {
  redirect: (path: string) => RedirectResult;
  component: (component: string) => HTMLElement;
}

export type RouteAction = (
  context: RouteContext,
  commands?: RouteCommands
) => RouteResult | Promise<RouteResult> | undefined | Promise<undefined>;

export type RouteChildren = Route[] | ((context: Omit<RouteContext, 'next'>) => Route[] | Promise<Route[]>);

export interface RouteBundle {
  module?: string;
  nomodule?: string;
}

export interface Route {
  path?: string | string[];
  name?: string;
  component?: string;
  redirect?: string;
  bundle?: string | RouteBundle;
  action?: RouteAction;
  children?: RouteChildren;
  animate?: boolean | { leave?: string; enter?: string };
  parent?: Route | null;
  __children?: Route[] | RouteChildren | undefined;
  __synthetic?: boolean;
  fullPath?: string;
}

export type RouteResult = HTMLElement | RedirectResult | Error | typeof notFoundResult | null | undefined;

export interface RedirectResult {
  redirect: {
    pathname: string;
    from: string;
    params: RouteParams;
  };
}

export interface PreventResult {
  cancel: boolean;
}

export interface ResolverOptions {
  baseUrl?: string;
  errorHandler?: (error: Error) => RouteResult;
  resolveRoute?: (context: RouteContext) => RouteResult | Promise<RouteResult> | undefined | Promise<undefined>;
  context?: Partial<RouteContext>;
}

export type RouterOptions = ResolverOptions;

export interface NavigationTrigger {
  activate: () => void;
  inactivate: () => void;
}

export interface PathToken {
  name: string | number;
  prefix: string;
  delimiter: string;
  optional: boolean;
  repeat: boolean;
  partial: boolean;
  pattern: string;
}

export interface PathRegexp {
  keys: PathToken[];
  pattern: RegExp;
}

export interface MatchResult {
  path: string;
  keys: PathToken[];
  params: RouteParams;
  route?: Route;
}

export interface PathToRegexpOptions {
  sensitive?: boolean;
  strict?: boolean;
  end?: boolean;
  start?: boolean;
  delimiter?: string;
  endsWith?: string | string[];
  delimiters?: string;
}

export interface CompileOptions {
  encode?: (value: string, token: PathToken) => string;
}

export interface MatchIterator {
  next: (routeToSkip?: Route) => IteratorResult<MatchResult, undefined>;
}

export type UrlGenerator = (routeName: string, params?: RouteParams) => string;

export interface GenerateUrlsOptions {
  encode?: (value: string, token: PathToken) => string;
  stringifyQueryParams?: (params: Record<string, unknown>) => string;
}

export interface HTMLElementWithLocation extends HTMLElement {
  location?: RouterLocation;
  onBeforeEnter?: (
    location: RouterLocation,
    commands: Record<string, unknown>,
    router: Router
  ) => PreventResult | RedirectResult | void | Promise<PreventResult | RedirectResult | void>;
  onBeforeLeave?: (
    location: RouterLocation,
    commands: Record<string, unknown>,
    router: Router
  ) => PreventResult | RedirectResult | void | Promise<PreventResult | RedirectResult | void>;
  onAfterEnter?: (location: RouterLocation, commands: Record<string, unknown>, resolver: Resolver) => void;
  onAfterLeave?: (location: RouterLocation, commands: Record<string, unknown>, resolver: Resolver) => void;
}

// TODO: Move this to a better place or import it
export const notFoundResult = new (class NotFoundResult {})();
