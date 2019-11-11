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
var GraphQLModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const services_1 = require("./services");
const apollo_service_1 = require("./services/apollo.service");
const config_tokens_1 = require("./config.tokens");
const bootstrap_service_1 = require("./services/bootstrap.service");
const graphiql_service_1 = require("./services/graphiql.service");
const start_service_1 = require("./services/start.service");
const playground_1 = require("@gapi/playground");
const plugin_init_1 = require("./plugin-init");
let GraphQLModule = GraphQLModule_1 = class GraphQLModule {
    static forRoot(config) {
        config.graphiqlPlaygroundConfig = config.graphiqlPlaygroundConfig || {};
        config.graphiqlPlaygroundConfig.subscriptionEndpoint =
            config.graphiqlOptions.subscriptionsEndpoint ||
                'ws://localhost:9000/subscriptions';
        return {
            module: GraphQLModule_1,
            providers: [
                services_1.EffectService,
                {
                    provide: config_tokens_1.GRAPHQL_PLUGIN_CONFIG,
                    useValue: config
                },
                services_1.HookService,
                bootstrap_service_1.BootstrapService,
                apollo_service_1.ApolloService,
                graphiql_service_1.GraphiQLService,
                start_service_1.StartService
            ],
            frameworkImports: [
                playground_1.PlaygroundModule.forRoot(Object.assign({ path: config.graphiQlPath || '/graphiql', endpoint: config.path || '/graphql', version: '1.7.1' }, config.graphiqlPlaygroundConfig, { graphiqlPlayground: config.graphiQlPlayground }))
            ],
            plugins: [services_1.ServerPushPlugin, plugin_init_1.PluginInit]
        };
    }
};
GraphQLModule = GraphQLModule_1 = __decorate([
    core_1.Module()
], GraphQLModule);
exports.GraphQLModule = GraphQLModule;
__export(require("./decorators"));
__export(require("./services"));
__export(require("./config.tokens"));
__export(require("./helpers/index"));
__export(require("./test/index"));
