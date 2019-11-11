"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const injection_tokens_1 = require("./injection.tokens");
const core_1 = require("@rxdi/core");
const RouteCache = new Map();
exports.ChildRoutesObservable = new rxjs_1.BehaviorSubject(null);
function assignChildren(route) {
    if (route.children && typeof route.children === 'function') {
        const lazyModule = route.children;
        route.children = function (context, commands) {
            return __awaiter(this, void 0, void 0, function* () {
                yield lazyModule(context, commands);
                let params = [
                    ...exports.ChildRoutesObservable.getValue().map(r => Object.assign({}, r))
                ];
                if (!RouteCache.has(route.path)) {
                    RouteCache.set(route.path, params);
                }
                return RouteCache.get(route.path);
            });
        };
    }
    return route;
}
function activateGuard(result, commands, route) {
    return __awaiter(this, void 0, void 0, function* () {
        if (rxjs_1.isObservable(result)) {
            result = result.toPromise();
        }
        if (yield result) {
            return result;
        }
        else {
            const routerOptions = core_1.Container.get(injection_tokens_1.RouterOptions);
            let redirect;
            if (route.path === '/') {
                redirect = commands.redirect('/not-found');
            }
            else {
                redirect = commands.redirect(route.parent.path || '/');
            }
            if (routerOptions.log) {
                console.error(`Guard ${route.canActivate['originalName']} activated!`);
            }
            return redirect;
        }
    });
}
function assignAction(route) {
    if (route.canActivate) {
        const guard = core_1.Container.get(route.canActivate);
        if (route.action) {
            const originalAction = route.action;
            route.action = function (context, commands) {
                return __awaiter(this, void 0, void 0, function* () {
                    yield originalAction(context, commands);
                    const result = guard.canActivate.bind(guard)(context, commands);
                    return activateGuard(result, commands, route);
                });
            };
        }
        else {
            route.action = guard.canActivate.bind(guard);
            const originalAction = route.action;
            route.action = function (context, commands) {
                return __awaiter(this, void 0, void 0, function* () {
                    const result = yield originalAction(context, commands);
                    return activateGuard(result, commands, route);
                });
            };
        }
    }
    return route;
}
function assignStaticIs(route) {
    if (typeof route.component === 'function') {
        route.component = route.component.is();
    }
    return route;
}
function loadRoutes(routes) {
    const notFoundRoute = routes.find(v => v.path === '(.*)');
    routes = routes.sort(function (a, b) {
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
    const r = [...routes].map(route => assignStaticIs(assignAction(assignChildren(route))));
    exports.ChildRoutesObservable.next(null);
    return r;
}
exports.loadRoutes = loadRoutes;
