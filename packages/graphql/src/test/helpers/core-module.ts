import { GRAPHQL_PLUGIN_CONFIG } from '../../config.tokens';
import { HapiConfigModel, HapiModule, HAPI_SERVER } from '@rxdi/hapi';
import { GraphQLModule } from '../..';
import {
  Module,
  BootstrapFramework,
  ModuleArguments,
  ConfigModel,
  Container,
  createTestBed
} from '@rxdi/core';
import { PluginInit, SendRequestQueryType } from '../../plugin-init';
import { Server } from 'hapi';
import { of } from 'rxjs';

export interface CoreModuleConfig {
  server?: HapiConfigModel;
  graphql?: GRAPHQL_PLUGIN_CONFIG;
}

export const DEFAULT_CONFIG = {
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
      subscriptionsEndpoint: `${
        process.env.GRAPHIQL_WS_SSH ? 'wss' : 'ws'
      }://${process.env.GRAPHIQL_WS_PATH || 'localhost'}${
        process.env.DEPLOY_PLATFORM === 'heroku'
          ? ''
          : `:${process.env.API_PORT || process.env.PORT || 9000}`
      }/subscriptions`,
      websocketConnectionParams: {
        token: process.env.GRAPHIQL_TOKEN
      }
    },
    graphqlOptions: {
      schema: null
    }
  }
};

export const setConfigServer = (config: HapiConfigModel = {}) => {
  return { ...DEFAULT_CONFIG.server, ...config };
};

export const setConfigGraphql = (config: GRAPHQL_PLUGIN_CONFIG = {}) => {
  return { ...DEFAULT_CONFIG.graphql, ...config };
};

export const startServer = (
  config: CoreModuleConfig = {},
  bootstrapOptions?: ConfigModel
) => {
  return createTestBed(
    {
      imports: [
        HapiModule.forRoot(setConfigServer(config.server)),
        GraphQLModule.forRoot(setConfigGraphql(config.graphql))
      ]
    },
    [],
    bootstrapOptions
  );
};

export const stopServer = () => {
  process.exit();
  Container.get<Server>(HAPI_SERVER).stop();
};
export const getServer = () => of(Container.get<Server>(HAPI_SERVER));

export const getGraphqlSchema = () =>
  of(Container.get(GRAPHQL_PLUGIN_CONFIG).graphqlOptions.schema);

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

export const sendRequest = <T = {}>(
  request: SendRequestQueryType,
  url?: string
) => Container.get(PluginInit).sendRequest<T>(request, url);
