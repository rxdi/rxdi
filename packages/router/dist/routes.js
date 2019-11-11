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
const not_found_component_1 = require("./not-found.component");
exports.ChildRoutesObservable = new rxjs_1.BehaviorSubject(null);
function loadLazyRoutes(routes) {
    if (!routes.filter(r => r.path === '(.*)').length) {
        routes.push(not_found_component_1.NotFoundPathConfig);
    }
    return [...routes].map(route => {
        if (route.children && typeof route.children === 'function') {
            const lazyModule = route.children;
            route.children = function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield lazyModule();
                    const test = exports.ChildRoutesObservable.getValue();
                    debugger;
                    return test;
                });
            };
        }
        return route;
    });
}
exports.loadLazyRoutes = loadLazyRoutes;
