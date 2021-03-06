import { Container } from '@rxdi/core';

export function importQuery<T>(search: T) {
    let result: any;
    const DOCUMENTS = Container.get('graphql-documents');
    Object.keys(DOCUMENTS)
    .filter(doc => {
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

export async function importQueryAsync<T>(search: T) {
  let result: any;
  const DOCUMENTS = await Container.get('graphql-documents');
  Object.keys(DOCUMENTS)
  .filter(doc => {
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