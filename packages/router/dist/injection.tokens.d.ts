import { BehaviorSubject, Observable } from 'rxjs';
import { Outlet } from './outlet';
import { RouterComponent } from './router.component';
export interface NavigationTrigger {
}
export declare function Router(): (target: Object, propertyKey: string) => void;
export declare type LazyChildren = (context?: CanActivateContext, commands?: CanActivateCommands) => Promise<any>;
export declare type Router = Outlet;
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
    canActivate(context: CanActivateContext, commands: CanActivateCommands): CanActivateRedirectResult | Promise<CanActivateRedirectResult> | boolean | Promise<boolean> | Observable<boolean> | void;
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
    next: (resume?: any, parent?: any, prevResult?: any) => any;
}
export interface CanActivateCommands {
    component: () => HTMLUnknownElement;
    redirect: (path: string) => CanActivateRedirectResult;
}
export declare const RouterRoutlet = "router-outlet";
export declare const RouterInitialized = "router-initialized";
export declare const Routes = "router-routes";
export declare const RouterOptions = "router-options";
export interface RouterOptions {
    baseUrl?: string;
    log?: boolean;
    freeze?: boolean;
}
export declare type Routes = Route<any>[];
export declare type RouterRoutlet = BehaviorSubject<Outlet>;
export declare type RouterInitialized = BehaviorSubject<RouterComponent>;
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
