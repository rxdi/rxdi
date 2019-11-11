"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var RouterModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const router_service_1 = require("./router.service");
const rxjs_1 = require("rxjs");
const router_component_1 = require("./router.component");
const injection_tokens_1 = require("./injection.tokens");
const helpers_1 = require("./helpers");
let RouterModule = RouterModule_1 = class RouterModule {
    static forRoot(routes, options) {
        return {
            module: RouterModule_1,
            services: [
                {
                    provide: injection_tokens_1.RouterOptions,
                    useValue: options || {}
                },
                {
                    provide: injection_tokens_1.Routes,
                    useValue: helpers_1.loadRoutes(routes)
                },
                {
                    provide: injection_tokens_1.RouterInitialized,
                    useFactory: () => new rxjs_1.BehaviorSubject(null)
                },
                {
                    provide: injection_tokens_1.RouterRoutlet,
                    useFactory: () => new rxjs_1.BehaviorSubject(null)
                },
                {
                    provide: 'initRouter',
                    deps: [router_service_1.RouterService],
                    useFactory: (r) => r
                },
            ],
            components: [router_component_1.RouterComponent]
        };
    }
    static forChild(routes) {
        helpers_1.ChildRoutesObservable.next(helpers_1.loadRoutes(routes));
        return RouterModule_1;
    }
};
RouterModule = RouterModule_1 = __decorate([
    core_1.Module()
], RouterModule);
exports.RouterModule = RouterModule;
__export(require("./injection.tokens"));
__export(require("./outlet"));
__export(require("./decorators"));
__export(require("./router.component"));
__export(require("./not-found.component"));
__export(require("./helpers"));
