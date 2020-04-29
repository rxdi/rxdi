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
const core_1 = require("@rxdi/core");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const subscription_1 = require("graphql/subscription");
const execution_1 = require("graphql/execution");
const hapi_1 = require("@rxdi/hapi");
const hapi_2 = require("hapi");
const graphql_1 = require("@rxdi/graphql");
const config_tokens_1 = require("../config.tokens");
let SubscriptionService = class SubscriptionService {
    constructor(server, config, pubConfig) {
        this.server = server;
        this.config = config;
        this.pubConfig = pubConfig;
    }
    OnInit() {
        console.log('Subscription');
        this.register();
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentC = {
                execute: execution_1.execute,
                subscribe: subscription_1.subscribe,
                schema: this.config.graphqlOptions.schema,
                onConnect(connectionParams) {
                    // return connectionHookService.modifyHooks
                    //   .onSubConnection(connectionParams);
                    return connectionParams;
                },
                onOperation: (connectionParams, params, webSocket) => {
                    return params;
                    // return connectionHookService.modifyHooks
                    //   .onSubOperation(
                    //     connectionParams,
                    //     params,
                    //     webSocket
                    //   );
                }
            };
            if (this.pubConfig.authentication) {
                const auth = core_1.Container.get(this.pubConfig.authentication);
                Object.assign(currentC, auth);
                if (auth.onSubConnection) {
                    currentC.onConnect = auth.onSubConnection.bind(auth);
                }
                if (auth.onSubOperation) {
                    currentC.onOperation = auth.onSubOperation.bind(auth);
                }
                if (auth.onSubOperationComplete) {
                    currentC.onOperationComplete = auth.onSubOperationComplete.bind(auth);
                }
                if (auth.onSubDisconnect) {
                    currentC.onDisconnect = auth.onSubDisconnect.bind(auth);
                }
            }
            new subscriptions_transport_ws_1.SubscriptionServer(currentC, {
                server: this.server.listener,
                path: '/subscriptions'
            });
        });
    }
};
SubscriptionService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(hapi_1.HAPI_SERVER)),
    __param(1, core_1.Inject(graphql_1.GRAPHQL_PLUGIN_CONFIG)),
    __param(2, core_1.Inject(config_tokens_1.GRAPHQL_PUB_SUB_CONFIG)),
    __metadata("design:paramtypes", [hapi_2.Server, Object, config_tokens_1.GRAPHQL_PUB_SUB_DI_CONFIG])
], SubscriptionService);
exports.SubscriptionService = SubscriptionService;
