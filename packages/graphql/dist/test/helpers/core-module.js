"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_tokens_1 = require("../../config.tokens");
const hapi_1 = require("@rxdi/hapi");
const __1 = require("../..");
const core_1 = require("@rxdi/core");
const plugin_init_1 = require("../../plugin-init");
const rxjs_1 = require("rxjs");
exports.DEFAULT_CONFIG = {
    server: {
        randomPort: true,
        hapi: {
            port: 9000
        }
    },
    graphql: {
        path: '/graphql',
        initQuery: true,
        buildAstDefinitions: true,
        openBrowser: false,
        writeEffects: false,
        graphiql: false,
        graphiQlPlayground: false,
        graphiQlPath: '/graphiql',
        watcherPort: '',
        graphiqlOptions: {
            endpointURL: '/graphql',
            subscriptionsEndpoint: `${process.env.GRAPHIQL_WS_SSH ? 'wss' : 'ws'}://${process.env.GRAPHIQL_WS_PATH || 'localhost'}${process.env.DEPLOY_PLATFORM === 'heroku'
                ? ''
                : `:${process.env.API_PORT || process.env.PORT || 9000}`}/subscriptions`,
            websocketConnectionParams: {
                token: process.env.GRAPHIQL_TOKEN
            }
        },
        graphqlOptions: {
            schema: null
        }
    }
};
exports.setConfigServer = (config = {}) => {
    return Object.assign(Object.assign({}, exports.DEFAULT_CONFIG.server), config);
};
exports.setConfigGraphql = (config = {}) => {
    return Object.assign(Object.assign({}, exports.DEFAULT_CONFIG.graphql), config);
};
exports.startServer = (config = {}, bootstrapOptions) => {
    return core_1.createTestBed({
        imports: [
            hapi_1.HapiModule.forRoot(exports.setConfigServer(config.server)),
            __1.GraphQLModule.forRoot(exports.setConfigGraphql(config.graphql))
        ]
    }, [], bootstrapOptions);
};
exports.stopServer = () => {
    process.exit();
    core_1.Container.get(hapi_1.HAPI_SERVER).stop();
};
exports.getServer = () => rxjs_1.of(core_1.Container.get(hapi_1.HAPI_SERVER));
exports.getGraphqlSchema = () => rxjs_1.of(core_1.Container.get(config_tokens_1.GRAPHQL_PLUGIN_CONFIG).graphqlOptions.schema);
// export const createTestBed = <T, K>(options: ModuleArguments<T, K>, frameworks: any[] = [], bootstrapOptions?: ConfigModel) => {
//     @Module({
//         imports: options.imports || [],
//         providers: options.providers || [],
//         services: options.services || [],
//         bootstrap: options.bootstrap || [],
//         components: options.components || [],
//         controllers: options.controllers || [],
//         effects: options.effects || [],
//         plugins: options.plugins || []
//     })
//     class AppModule { }
//     return BootstrapFramework(AppModule, frameworks, bootstrapOptions);
// };
// export const setup = createTestBed;
exports.sendRequest = (request, url) => core_1.Container.get(plugin_init_1.PluginInit).sendRequest(request, url);
