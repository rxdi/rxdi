import { InjectionToken } from '@rxdi/core';
import * as GraphiQL from 'apollo-server-module-graphiql';
import { GraphQLOptions, PlaygroundConfig } from 'apollo-server-core';
import { GraphQLSchema, GraphQLField, GraphQLDirective } from 'graphql';
import { Server, ResponseToolkit } from 'hapi';
import { RenderPageOptions } from 'graphql-playground-html';

export interface HapiOptionsFunction {
  (req?: Request): GraphQLOptions | Promise<GraphQLOptions>;
}

export interface HapiGraphiQLOptionsFunction {
  (req?: Request): GraphiQL.GraphiQLData | Promise<GraphiQL.GraphiQLData>;
}

export interface HapiGraphiQLPluginOptions {
  path: string;
  route?: any;
  graphiqlOptions: GraphiQL.GraphiQLData | HapiGraphiQLOptionsFunction;
}

export interface GRAPHQL_PLUGIN_CONFIG {
  path?: string;
  initQuery?: boolean;
  disableGlobalGuards?: boolean;
  directives?: GraphQLDirective[] | any[];
  buildAstDefinitions?: boolean;
  graphiQlPlayground?: boolean;
  graphiql?: boolean;
  graphiQlPath?: string;
  writeEffects?: boolean;
  openBrowser?: boolean;
  watcherPort?: string | number;
  authentication?: Function | InjectionToken<any>;
  vhost?: string;
  route?: {
    cors?: boolean;
  };
  graphqlOptions?: GraphQLOptions;
  graphiqlOptions?: GraphiQL.GraphiQLData;
  graphiqlPlaygroundConfig?: RenderPageOptions;
}
export interface GRAPHQL_AUTHENTICATION_FAKE {
  validateToken(authorization: string): any;
  onSubConnection(connectionParams): any;
  onSubOperation(connectionParams, params, webSocket): any;
}

export const GRAPHQL_PLUGIN_CONFIG = new InjectionToken<GRAPHQL_PLUGIN_CONFIG>(
  'graphql-configuration-injection-token'
);
export const CUSTOM_SCHEMA_DEFINITION = 'gapi-custom-schema-definition';
export const SCHEMA_OVERRIDE = new InjectionToken<
  (schema: GraphQLSchema) => GraphQLSchema
>('gapi-custom-schema-override');
export const ON_REQUEST_HANDLER = new InjectionToken<
  (
    next: any,
    context?: any,
    request?: Request,
    h?: ResponseToolkit,
    err?: Error
  ) => any
>('gapi-on-request-handler');

export interface IRegister {
  (server: Server, options: any): void;
}

export interface IPlugin {
  name: string;
  version?: string;
  register: IRegister;
}

export const RESOLVER_HOOK = new InjectionToken<
  (resolver: GraphQLField<any, any>) => void
>('graphql-resolver-hook');
