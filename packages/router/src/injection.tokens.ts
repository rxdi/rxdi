import { Container } from '@rxdi/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Outlet } from './outlet';
import { RouterComponent } from './router.component';

export interface NavigationTrigger {}

export function Router() {
  return (target: Object, propertyKey: string) => {
    Object.defineProperty(target, propertyKey, {
      get: () =>
        (Container.get(RouterRoutlet) as BehaviorSubject<Outlet>).getValue()
    });
  };
}

export type LazyChildren = (
  context?: CanActivateContext,
  commands?: CanActivateCommands
) => Promise<any>;
export type Router = Outlet;

export interface Route<C = any> {
  path: string;
  component?: C | Function;
  animate?: boolean;
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
  parent: {
    parent: any;
    path: string;
  };
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
  from: string;
  params: any;
  pathname: string;
}

export interface CanActivateContext {
  chain: {
    route: RouteContext;
    path: string;
    element: HTMLUnknownElement;
  }[];
  keys: any[];
  next: (resume?, parent?, prevResult?) => any;
}

export interface CanActivateCommands {
  component: () => HTMLUnknownElement;
  redirect: (path: string) => CanActivateRedirectResult;
}

export const RouterRoutlet = 'router-outlet';
export const RouterInitialized = 'router-initialized';
export const Routes = 'router-routes';
export const RouterOptions = 'router-options';

export interface RouterOptions {
  baseUrl?: string;
  log?: boolean;
  freeze?: boolean;
}
export type Routes = Route<any>[];

export type RouterRoutlet = BehaviorSubject<Outlet>;
export type RouterInitialized = BehaviorSubject<RouterComponent>;

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
