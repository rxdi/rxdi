import { DocumentNode, PossibleTypesMap, TypedDocumentNode } from '@apollo/client/core';
import { Container } from '@rxdi/core';
import { GraphqlDocuments } from './graphql.injection';

export function importQuery<T extends string>(search: T): DocumentNode | TypedDocumentNode {
  const DOCUMENTS = Container.get(GraphqlDocuments);
  if (!DOCUMENTS[search]) {
    throw new Error(`Missing query: ${search}`)
  }
  return DOCUMENTS[search];
}

export interface IntrospectionQuery {
  __schema: { types: { name: string; possibleTypes: { name: string }[] }[] };
}

export const convertToPossibleTypes = (introspectionQuery: IntrospectionQuery) =>
  introspectionQuery.__schema.types.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.name]: curr.possibleTypes.map((type) => type.name),
    }),
    {} as PossibleTypesMap,
  );

/* Utility function helping us to get a new object using the apollo-store */
export const deepCopy = <T>(state: T): T => JSON.parse(JSON.stringify(state));
