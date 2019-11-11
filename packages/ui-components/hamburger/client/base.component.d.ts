import { GraphqlClient } from '@rxdi/graphql-client';
import { QueryOptions, MutationOptions, SubscriptionOptions } from 'apollo-boost';
import { Observable } from 'rxjs';
import { LitElement } from '@rxdi/lit-html';
import { IQuery, ISubscription, IMutation } from '../../introspection';
export declare class BaseComponent extends LitElement {
    graphql: GraphqlClient;
    query<T = IQuery>(options: QueryOptions): Observable<{
        data: T;
    }>;
    mutate<T = IMutation>(options: MutationOptions): Observable<{
        data: T;
    }>;
    subscribe<T = ISubscription>(options: SubscriptionOptions): Observable<{
        data: T;
    }>;
}
