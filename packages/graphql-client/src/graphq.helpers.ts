import { PossibleTypesMap } from '@apollo/client/core';
import { Container } from '@rxdi/core';

export function importQuery<T>(search: T) {
 let result: any;
 const DOCUMENTS = Container.get('graphql-documents');
 Object.keys(DOCUMENTS).filter((doc) => {
  if (doc.indexOf(<any>search) !== -1) {
   result = DOCUMENTS[doc];
  }
 });
 if (!result) {
  console.error(`Missing query: ${search}`);
  return search;
 }
 return result;
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
