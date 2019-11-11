import { Injectable } from '@angular/core';
import { importQuery } from '../../api-introspection/graphql.helpers';
import { IMutation, IBuildType, IQuery } from '../../api-introspection';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';

export const BUILD_MUTATION = importQuery('build.mutation.graphql');
export const GET_BUILD_HISTORY_QUERY = importQuery('build-list.query.graphql');

@Injectable()
export class BuilderService {

    constructor(
        private apollo: Apollo
    ) {

    }

    build(folder: string, file: string, message: string, namespace: string, buildFolder: string) {
        return this.apollo.mutate<IMutation>({
            mutation: BUILD_MUTATION,
            variables: {
                folder, file, message, namespace, buildFolder
            }
        });
    }

    getBuildHistory(skip?: number, limit?: number, where?) {
        return this.apollo.query<IQuery>({
            query: GET_BUILD_HISTORY_QUERY,
            variables: { skip, limit, where }
        }).pipe(
            map(res => res.data.getBuildHistory)
        );
    }

}
