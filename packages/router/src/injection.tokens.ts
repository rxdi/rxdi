/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container, InjectionToken } from '@rxdi/core';
import { Observable } from 'rxjs';

import { Outlet } from './outlet';

export function Router() {
  return (target: Object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
      get: () => Container.get(RouterRoutlet),
    });
  };
}

export type LazyChildren = (context?: CanActivateContext, commands?: CanActivateCommands) => Promise<any>;
export type Router = Outlet;

export interface Route<C = any> {
  path?: string | string[];
  component?: C | Function | string;
  animate?: boolean | { leave?: string; enter?: string };
  children?: Route<C>[] | LazyChildren;
  redirect?: string;
  freeze?: boolean;
  action?: LazyChildren;
  canActivate?: Function;
}

export interface CanActivateContextKeys {
  delimiter: string | '/';
  name: number;
  optional: boolean;
  partial: boolean;
  pattern: string | '.*';
  prefix: string | '';
  repeat: boolean;
}

export interface RouteContext extends Route {
  parent?: {
    parent?: any;
    path?: string | string[];
  } | null;
}

export interface CanActivateResolver {
  canActivate(
    context: CanActivateContext,
    commands: CanActivateCommands
  ):
    | CanActivateRedirectResult
    | Promise<CanActivateRedirectResult>
    | boolean
    | Promise<boolean>
    | Observable<boolean>
    | void;
}
export interface CanActivateRedirectResult {
  redirect: {
    from: string;
    params: any;
    pathname: string;
  };
}

export interface CanActivateContext {
  pathname: string;
  params: any;
  route: RouteContext;
  chain?: {
    route: RouteContext;
    path: string;
    element?: HTMLElement;
  }[];
  keys: any[];
  next?: (resume?, parent?, prevResult?) => any;
}

export interface CanActivateCommands {
  component: (component: string) => HTMLElement;
  redirect: (path: string) => CanActivateRedirectResult;
}

export const RouterRoutlet = 'router-outlet';
export const Routes = 'router-routes';
export const RouterOptions = new InjectionToken<RouterOptions>('router-options');

export interface RouterOptions {
  baseUrl?: string;
  log?: boolean;
  freeze?: boolean;
}
export type Routes = Route<any>[];

export type RouterRoutlet = Outlet;

export interface OnBeforeEnter {
  onBeforeEnter(): Promise<any> | void;
}

export interface OnAfterEnter {
  onAfterEnter(): void;
}

export interface OnBeforeLeave {
  onBeforeLeave(): void;
}

export interface OnAfterLeave {
  onAfterLeave(): void;
}
