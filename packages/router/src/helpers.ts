import { BehaviorSubject, isObservable } from 'rxjs';
import {
  Route,
  CanActivateResolver,
  RouterOptions,
  RouteContext
} from './injection.tokens';
import { Container } from '@rxdi/core';

const RouteCache = new Map();

export const ChildRoutesObservable: BehaviorSubject<
  Route<any>[]
> = new BehaviorSubject(null);

function assignChildren(route: Route) {
  if (route.children && typeof route.children === 'function') {
    const lazyModule = route.children;
    route.children = async function(context, commands) {
      await lazyModule(context, commands);
      let params = [
        ...ChildRoutesObservable.getValue().map(r => Object.assign({}, r))
      ];
      if (!RouteCache.has(route.path)) {
        RouteCache.set(route.path, params);
      }
      return RouteCache.get(route.path);
    };
  }
  return route;
}

async function activateGuard(result, commands, route: RouteContext) {
  if (isObservable(result)) {
    result = result.toPromise();
  }
  if (await result) {
    return result;
  } else {
    const routerOptions = Container.get(RouterOptions) as any;
    let redirect;
    if (route.path === '/') {
      redirect = commands.redirect('/not-found');
    } else {
      redirect = commands.redirect(route.parent.path || '/');
    }
    if (routerOptions.log) {
      console.error(`Guard ${route.canActivate['originalName']} activated!`);
    }
    return redirect;
  }
}

function assignAction(route: Route) {
  if (route.canActivate) {
    const guard: CanActivateResolver = Container.get(route.canActivate);
    if (route.action) {
      const originalAction = route.action;
      route.action = async function(context, commands) {
        await originalAction(context, commands);
        const result = guard.canActivate.bind(guard)(context, commands);
        return activateGuard(result, commands, route as any);
      };
    } else {
      route.action = guard.canActivate.bind(guard);
      const originalAction = route.action;
      route.action = async function(context, commands) {
        const result = await originalAction(context, commands);
        return activateGuard(result, commands, route as any);
      };
    }
  }
  return route;
}

function assignStaticIs(route: Route) {
  if (typeof route.component === 'function') {
    route.component = route.component.is();
  }
  return route;
}

export function loadRoutes(routes: Route[]) {
  const notFoundRoute = routes.find(v => v.path === '(.*)');
  routes = routes.sort(function(a, b) {
    if (a.path < b.path) {
      return -1;
    }
    if (b.path < a.path) {
      return 1;
    }
    return 0;
  });

  if (notFoundRoute) {
    routes.splice(routes.indexOf(notFoundRoute), 1);
    routes.push(notFoundRoute);
  }

  const r = [...routes].map(route =>
    assignStaticIs(assignAction(assignChildren(route)))
  );
  ChildRoutesObservable.next(null);
  return r;
}
