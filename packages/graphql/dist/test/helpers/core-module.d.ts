import { GRAPHQL_PLUGIN_CONFIG } from '../../config.tokens';
import { HapiConfigModel } from '@rxdi/hapi';
import { ConfigModel } from '@rxdi/core';
import { SendRequestQueryType } from '../../plugin-init';
import { Server } from 'hapi';
export interface CoreModuleConfig {
    server?: HapiConfigModel;
    graphql?: GRAPHQL_PLUGIN_CONFIG;
}
export declare const DEFAULT_CONFIG: {
    server: {
        randomPort: boolean;
        hapi: {
            port: number;
        };
    };
    graphql: {
        path: string;
        initQuery: boolean;
        buildAstDefinitions: boolean;
        openBrowser: boolean;
        writeEffects: boolean;
        graphiql: boolean;
        graphiQlPlayground: boolean;
        graphiQlPath: string;
        watcherPort: string;
        graphiqlOptions: {
            endpointURL: string;
            subscriptionsEndpoint: string;
            websocketConnectionParams: {
                token: string;
            };
        };
        graphqlOptions: {
            schema: any;
        };
    };
};
export declare const setConfigServer: (config?: HapiConfigModel) => {
    randomPort: boolean;
    staticConfig?: import("hapi").ServerRoute | import("hapi").ServerRoute[];
    hapi: {
        port: number;
    } | import("hapi").ServerOptions;
    plugins?: ((import("hapi").PluginBase<any> & import("hapi").PluginNameVersion) | (import("hapi").PluginBase<any> & import("hapi").PluginPackage))[];
};
export declare const setConfigGraphql: (config?: GRAPHQL_PLUGIN_CONFIG) => {
    path: string;
    initQuery: boolean;
    disableGlobalGuards?: boolean;
    directives?: any[] | import("graphql").GraphQLDirective[];
    buildAstDefinitions: boolean;
    graphiQlPlayground: boolean;
    graphiql: boolean;
    graphiQlPath: string;
    writeEffects: boolean;
    openBrowser: boolean;
    watcherPort: string | number;
    authentication?: Function | import("@rxdi/core").InjectionToken<any>;
    vhost?: string;
    route?: {
        cors?: boolean;
    };
    graphqlOptions: import("apollo-server-core").GraphQLOptions<Record<string, any>, any> | {
        schema: any;
    };
    graphiqlOptions: import("apollo-server-module-graphiql").GraphiQLData | {
        endpointURL: string;
        subscriptionsEndpoint: string;
        websocketConnectionParams: {
            token: string;
        };
    };
    graphiqlPlaygroundConfig?: import("graphql-playground-html").RenderPageOptions;
};
export declare const startServer: (config?: CoreModuleConfig, bootstrapOptions?: ConfigModel) => import("rxjs").Observable<import("@rxdi/core/dist/container/observable-interface").ObservableContainer>;
export declare const stopServer: () => Promise<void>;
export declare const getServer: () => import("rxjs").Observable<Server>;
export declare const getGraphqlSchema: () => import("rxjs").Observable<import("graphql").GraphQLSchema>;
export declare const sendRequest: <T = {}>(request: SendRequestQueryType, url?: string) => PromiseLike<import("../../plugin-init").Response<T>>;
