import { Container } from '@rxdi/core';
import { parse } from 'graphql';

import { importQuery } from './graphq.helpers';
import { GraphqlDocuments } from './graphql.injection';

/**
 * Documents can be registered as text (`gapi schema collect
 * --documents-as-text`) instead of pre-parsed trees: importQuery parses a
 * text document on first use, without source locations, and returns the
 * same object every time after (Apollo keys its caches by identity).
 */
describe('importQuery', () => {
  const text = `query getProject($id: String!) {
  getProject(id: $id) {
    id
    name
  }
}`;

  beforeEach(() => {
    Container.set(GraphqlDocuments, {
      'get-project.graphql': text,
      'list.graphql': parse('query list { list }'),
    });
  });

  it('parses a text document on first use, without locations', () => {
    const doc = importQuery('get-project.graphql');
    expect(doc.kind).toBe('Document');
    expect(doc.loc).toBeUndefined();
    const op = doc.definitions[0] as { name: { value: string } };
    expect(op.name.value).toBe('getProject');
  });

  it('returns the same parsed object on every later call', () => {
    const first = importQuery('get-project.graphql');
    expect(importQuery('get-project.graphql')).toBe(first);
    // the registry now holds the parsed node, not the text
    expect(typeof Container.get(GraphqlDocuments)['get-project.graphql']).toBe(
      'object',
    );
  });

  it('returns a pre-parsed document as it is', () => {
    const doc = importQuery('list.graphql');
    expect(doc).toBe(Container.get(GraphqlDocuments)['list.graphql']);
  });

  it('throws for a document that is not registered', () => {
    expect(() => importQuery('missing.graphql')).toThrow(
      'Missing query: missing.graphql',
    );
  });
});
