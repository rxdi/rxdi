import { DocumentNode, PossibleTypesMap, TypedDocumentNode } from '@apollo/client/core';
import { Container } from '@rxdi/core';
import { parse } from 'graphql';
import { GraphqlDocuments } from './graphql.injection';

/**
 * A document by file name. Documents may be registered as parsed
 * DocumentNodes OR as their text (`gapi schema collect --documents-as-text`):
 * a text document is parsed the first time it is asked for (without source
 * locations) and the parsed node replaces it, so every later call returns
 * the SAME object - Apollo keys its caches by document identity. Shipping
 * text instead of pre-parsed trees cut a real app's first bundle by 1.7 MB.
 */
export function importQuery<T extends string>(search: T): DocumentNode | TypedDocumentNode {
  const DOCUMENTS = Container.get(GraphqlDocuments);
  const document = DOCUMENTS[search];
  if (!document) {
    throw new Error(`Missing query: ${search}`)
  }
  if (typeof document === 'string') {
    const parsed = parse(document, { noLocation: true });
    DOCUMENTS[search] = parsed;
    return parsed;
  }
  return document;
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
