import { InjectionToken } from '@rxdi/core';
import { GraphQLSchema } from 'graphql';
import { Driver } from 'neo4j-driver';

export const NEO4J_MODULE_CONFIG = new InjectionToken<NEO4J_MODULE_CONFIG>(
  'GAPI_NEO4J_MODULE_CONFIG'
);

export interface NEO4J_MODULE_CONFIG {
  username?: string;
  password?: string;
  address?: string | 'bolt://localhost:7687';
  schemaOverride?(schema: GraphQLSchema): GraphQLSchema;
}

export interface RelationshipType {
  searchIndex?: string;
  replaceWith?: string;
  extends?: string;
}
export interface Relationship {
  direction: 'IN' | 'OUT';
  name: string;
  cyper: string;
}
export interface RelationshipMap {
  [key: string]: RelationshipType;
}


/**
 * Neo4j driver @rxdi injection token
 */
export const NEO4J_DRIVER = new InjectionToken('GAPI_NEO4J_MODULE_DRIVER');

export type NEO4J_DRIVER = Driver;

export { Driver } from 'neo4j-driver';

export function gql(...args) {
  const literals = args[0];
  let result = typeof literals === 'string' ? literals : literals[0];

  for (let i = 1; i < args.length; i++) {
    if (args[i] && args[i].kind && args[i].kind === 'Document') {
      result += args[i].loc.source.body;
    } else {
      result += args[i];
    }

    result += literals[i];
  }

  return result;
}
