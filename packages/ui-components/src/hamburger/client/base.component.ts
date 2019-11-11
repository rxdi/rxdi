import { Container } from '@rxdi/core';
import { ApolloClient, QueryOptions, MutationOptions, SubscriptionOptions } from '@rxdi/graphql-client';

// import { importQuery } from '@rxdi/graphql-client';
import { from, Observable } from 'rxjs';
import { LitElement } from '@rxdi/lit-html';
import { IQuery, ISubscription, IMutation } from '../../introspection';
// import { DocumentTypes } from '../../../../api-introspection/documentTypes';

export class BaseComponent extends LitElement {

  query<T = IQuery>(options: QueryOptions) {
    // options.query = importQuery(options.query);
    return from(Container.get(ApolloClient).query.bind(Container.get(ApolloClient))(
      options
    ) as any) as Observable<{ data: T }>;
  }

  mutate<T = IMutation>(options: MutationOptions) {
    // options.mutation = importQuery(options.mutation);
    return from(Container.get(ApolloClient).mutate.bind(Container.get(ApolloClient))(
      options
    ) as any) as Observable<{ data: T }>;
  }

  subscribe<T = ISubscription>(options: SubscriptionOptions) {
    // options.query = importQuery(options.query);
    return from(Container.get(ApolloClient).subscribe.bind(Container.get(ApolloClient))(
      options
    ) as any) as Observable<{ data: T }>;
  }
}

// interface ImportQueryMixin extends QueryOptions {
//   query: DocumentTypes;
// }

// interface ImportSubscriptionMixin extends SubscriptionOptions {
//   query: DocumentTypes;
// }

// interface ImportMutationMixin extends MutationOptions {
//   mutation: DocumentTypes;
// }
