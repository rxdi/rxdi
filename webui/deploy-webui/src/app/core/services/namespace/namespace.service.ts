import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { importQuery } from '../../api-introspection/graphql.helpers';
import { map } from 'rxjs/operators';
import { IQuery } from '../../api-introspection';
export const LIST_NAMESPACES_QUERY = importQuery('list-namespace.query.graphql');
export const GET_NAMESPACE_BY_ID = importQuery('get-namespace-by-id.query.graphql');

@Injectable()
export class NamespaceService {
    constructor(
        private apollo: Apollo
    ) { }

    listNamespace(limit: number = 20, skip: number = 0) {
        return this.apollo.query<IQuery>({
            query: LIST_NAMESPACES_QUERY,
            variables: {
                limit,
                skip
            }
        }).pipe(
            map((res) => res.data.listNamespaces)
        );
    }

    getNamespaceById(id: string) {
        return this.apollo.query<IQuery>({
            query: GET_NAMESPACE_BY_ID,
            variables: {
                id
            }
        }).pipe(
            map((res) => res.data.getNamespace)
        );
    }
}
