"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_service_1 = require("./error.service");
const core_1 = require("@rxdi/core");
const config_tokens_1 = require("../config.tokens");
const bootstrap_service_1 = require("./bootstrap.service");
const effect_service_1 = require("./effect.service");
const rxjs_1 = require("rxjs");
const fs_extra_1 = require("fs-extra");
let HookService = class HookService {
    constructor(config, effectService, logger) {
        this.config = config;
        this.effectService = effectService;
        this.logger = logger;
        this.methodBasedEffects = [];
    }
    AttachHooks(graphQLFields) {
        graphQLFields.forEach(type => {
            if (!type) {
                return;
            }
            const resolvers = type.getFields();
            Object.keys(resolvers).forEach(resolver => this.applyMeta(resolvers[resolver]));
        });
        this.writeEffectTypes();
    }
    writeEffectTypes(effects) {
        if (!this.config.writeEffects) {
            return;
        }
        const types = `
/* tslint:disable */
function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
export const EffectTypes = strEnum(${JSON.stringify(effects || this.methodBasedEffects)
            .replace(/'/g, `'`)
            .replace(/,/g, ',\n')});
export type EffectTypes = keyof typeof EffectTypes;
`;
        try {
            const folder = process.env.INTROSPECTION_FOLDER || `./src/app/core/api-introspection/`;
            fs_extra_1.ensureDirSync(folder);
            fs_extra_1.writeFileSync(folder + 'EffectTypes.ts', types, 'utf8');
        }
        catch (e) {
            console.error(e, 'Effects are not saved to directory');
        }
    }
    applyMeta(resolver) {
        const rxdiResolver = this.bootstrap.getResolverByName(resolver.name);
        if (rxdiResolver) {
            resolver.resolve = rxdiResolver.resolve;
            resolver.subscribe = rxdiResolver.subscribe;
            resolver['target'] = rxdiResolver['target'];
            resolver['method_name'] = rxdiResolver['method_name'];
            resolver['method_type'] = rxdiResolver['method_type'];
            resolver['interceptor'] = rxdiResolver['interceptor'];
            resolver['effect'] = rxdiResolver['effect'];
            resolver['guards'] = rxdiResolver['guards'];
            resolver['scope'] = rxdiResolver['scope'] || [
                process.env.APP_DEFAULT_SCOPE || 'ADMIN'
            ];
            this.applyTypeFields(resolver, rxdiResolver);
            this.AddHooks(resolver);
            this.applyMetaToResolver(resolver);
        }
    }
    applyTypeFields(resolver, rxdiResolver) {
        if (rxdiResolver['type']['getFields']) {
            const typeFields = rxdiResolver['type']['getFields']();
            const typeRes = resolver['type']['getFields']();
            Object.keys(typeFields).forEach(f => {
                if (typeFields[f].resolve) {
                    typeRes[f].resolve = typeFields[f].resolve;
                }
            });
        }
    }
    applyGuards(desc, a) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = a;
            yield Promise.all(desc.guards.map((guard) => __awaiter(this, void 0, void 0, function* () {
                const currentGuard = core_1.Container.get(guard);
                yield this.validateGuard(currentGuard.canActivate.bind(currentGuard)(args[2], args[1], desc));
            })));
        });
    }
    validateGuard(res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (res.constructor === Boolean) {
                if (!res) {
                    this.logger.error(`Guard activated!`);
                    throw new Error('unauthorized');
                }
            }
            else if (res.constructor === Promise) {
                yield this.validateGuard(yield res);
            }
            else if (res.constructor === rxjs_1.Observable) {
                yield this.validateGuard(yield res['toPromise']());
            }
        });
    }
    applyMetaToResolver(resolver) {
        const events = this.effectService;
        const self = this;
        const effectName = resolver.effect ? resolver.effect : resolver.method_name;
        this.methodBasedEffects.push(effectName);
        const originalResolve = resolver.resolve.bind(resolver.target);
        if (resolver.subscribe) {
            const originalSubscribe = resolver.subscribe;
            resolver.subscribe = function subscribe(...args) {
                return originalSubscribe.bind(resolver.target)(resolver.target, ...args);
            };
        }
        resolver.resolve = function resolve(...args) {
            return __awaiter(this, void 0, void 0, function* () {
                let result;
                try {
                    if (!resolver.public &&
                        resolver.guards &&
                        resolver.guards.length &&
                        !self.config.disableGlobalGuards) {
                        yield self.applyGuards(resolver, args);
                    }
                    let val = originalResolve.apply(resolver.target, args);
                    if (!val && !process.env.STRICT_RETURN_TYPE) {
                        val = {};
                    }
                    if (!val && process.env.STRICT_RETURN_TYPE) {
                        throw new Error(`Return type of graph: ${resolver.method_name} is undefined or null \n To remove strict return type check remove environment variable STRICT_RETURN_TYPE=true`);
                    }
                    if (val.constructor === Object ||
                        val.constructor === Array ||
                        val.constructor === String ||
                        val.constructor === Number) {
                        val = rxjs_1.of(val);
                    }
                    let observable = rxjs_1.from(val);
                    if (resolver.interceptor) {
                        observable = yield core_1.Container.get(resolver.interceptor).intercept(observable, args[2], args[1], resolver);
                    }
                    if (observable.constructor === Object) {
                        result = observable;
                    }
                    else {
                        result = yield observable.toPromise();
                    }
                    if (events.map.has(resolver.method_name) ||
                        events.map.has(resolver.effect)) {
                        events.getLayer(effectName).putItem({
                            key: effectName,
                            data: [result, ...args].filter(i => i && i !== 'undefined')
                        });
                    }
                }
                catch (error) {
                    result = error;
                    console.error({
                        method_type: resolver.method_type,
                        method_name: resolver.method_name,
                        hasInterceptor: !!resolver.interceptor,
                        args,
                        error
                    });
                }
                return result;
            });
        };
    }
    canAccess(resolverScope, context) {
        return context &&
            context.user &&
            resolverScope.filter(scope => scope === context.user.type).length
            ? true
            : error_service_1.errorUnauthorized();
    }
    AuthenticationHooks(resolver, context) {
        this.canAccess(resolver['scope'], context);
    }
    ResolverHooks(resolver, root, args, context, info) {
        if (!resolver['public']) {
            this.AuthenticationHooks(resolver, context);
        }
    }
    AddHooks(resolver) {
        const resolve = resolver.resolve;
        const self = this;
        if (this.config.authentication) {
            console.log('Should be depreceted in the next minor release consider using RESOLVER_HOOK token');
            resolver.resolve = function (root, args, context, info, ...a) {
                self.ResolverHooks(resolver, root, args, context, info);
                return resolve(root, args, context, info, ...a);
            };
        }
        else {
            let resolverHook;
            try {
                resolverHook = core_1.Container.get(config_tokens_1.RESOLVER_HOOK);
            }
            catch (e) { }
            if (resolverHook) {
                resolverHook(resolver);
            }
        }
    }
};
__decorate([
    core_1.Inject(() => bootstrap_service_1.BootstrapService),
    __metadata("design:type", bootstrap_service_1.BootstrapService)
], HookService.prototype, "bootstrap", void 0);
HookService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [Object, effect_service_1.EffectService,
        core_1.BootstrapLogger])
], HookService);
exports.HookService = HookService;
