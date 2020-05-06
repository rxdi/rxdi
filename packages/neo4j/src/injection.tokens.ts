import { InjectionToken } from '@rxdi/core';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { ResponseToolkit } from 'hapi';
import { neo4jgraphql } from 'neo4j-graphql-js';

export const Neo4JTypes = new InjectionToken<GraphQLObjectType[]>(
  'GAPI_NEO4J_TYPES'
);

interface Neo4JTypesPrivate extends GraphQLObjectType {}

export type Neo4JTypes = Neo4JTypesPrivate[];

export const NEO4J_MODULE_CONFIG = new InjectionToken<NEO4J_MODULE_CONFIG>(
  'GAPI_NEO4J_MODULE_CONFIG'
);

export type IExcludeType = string | Function | GraphQLObjectType;

export interface ExcludedTypes {
  mutation?: {
    exclude: IExcludeType[];
  };
  query?: {
    exclude: IExcludeType[];
  };
}

export interface RelationshipType {
  searchIndex: string;
  replaceWith: string;
}
export interface Relationship {
  direction: 'IN' | 'OUT';
  name: string;
  cyper: string;
}
export interface RelationshipMap {
  [key: string]: RelationshipType;
}

export interface NEO4J_MODULE_CONFIG {
  types?: GraphQLObjectType[];
  username?: string;
  password?: string;
  address?: string | 'bolt://localhost:7687';
  excludedTypes?: ExcludedTypes;
  debug?: boolean;
  auth?: boolean;
  context?: any;
  onRequest?(
    next,
    request: Request,
    h: ResponseToolkit,
    err: Error
  ): Promise<any>;
  schemaOverride?(schema: GraphQLSchema): GraphQLSchema;
}

export const NEO4J_DRIVER = new InjectionToken('GAPI_NEO4J_MODULE_CONFIG');

const graphRequest: <T>(root, params, ctx, resolveInfo) => Promise<T> = (
  root,
  params,
  ctx,
  resolveInfo
) => neo4jgraphql(root, params, ctx, resolveInfo);

export { graphRequest };

export { Driver } from 'neo4j-driver/types/v1';
