# Graphql module for client side rxdi application build with Apollo-graphql

#### Install

```bash
npm i @rxdi/graphql-client
```

#### Define routes with forRoot these will be evaluated lazy

```typescript
import { Module } from '@rxdi/core';
import { AppComponent } from './app.component';
import { GraphqlModule } from '@rxdi/graphql-client';
import { DOCUMENTS } from './@introspection/documents';

@Module({
  imports: [
    GraphqlModule.forRoot({
      async onRequest(this: GraphQLRequest) {
        const headers = new Headers();
        headers.append('authorization', '');
        return headers;
      },
      uri: 'http://localhost:9000/graphql',
      pubsub: 'ws://localhost:9000/subscriptions',
      apolloClientOptions: {
        /* ApolloClientOptions defined above */
      },
      apolloRequestHandler: (operation, forward) => forward(operation)
      /*
      * Will cancel all request from the same type
      * in order to make only 1 request for specific update or query
      * `false` by default
      */
      cancelPendingRequests: true,
    }, DOCUMENTS),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

In order to collect `DOCUMENTS` from `.graphql` files we need `@gapi/cli` 

```bash
npm i -g @gapi/cli
```

Collect queries/mutations/subscriptions/fragments

```bash
gapi schema introspect --collect-documents --collect-types
```

More information can be found [HERE](https://github.com/Stradivario/gapi-cli/wiki/schema)

# ApolloClientOptions interface

```ts
interface ApolloClientOptions {
  link?: ApolloLink;
  cache: ApolloCache;
  ssrForceFetchDelay?: number;
  ssrMode?: boolean;
  connectToDevTools?: boolean;
  queryDeduplication?: boolean;
  defaultOptions?: DefaultOptions;
  assumeImmutableResults?: boolean;
  resolvers?: Resolvers | Resolvers[];
  typeDefs?: string | string[] | DocumentNode | DocumentNode[];
  fragmentMatcher?: FragmentMatcher;
  name?: string;
  version?: string;
}
```

#### Base component

```typescript
import { Injector } from "@rxdi/core";
import { DocumentTypes } from "../@introspection/documentTypes";
import { of, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { IQuery, IMutation, ISubscription } from "../@introspection";
import { LitElement } from "@rxdi/lit-html";
import {
  importQuery,
  ApolloClient,
  QueryOptions,
  SubscriptionOptions,
  MutationOptions,
  DataProxy,
} from "@rxdi/graphql-client";

export class BaseComponent extends LitElement {
  @Injector(ApolloClient)
  public graphql: ApolloClient;

  query<T = IQuery>(options: ImportQueryMixin) {
    return of(importQuery(options.query)).pipe(
      switchMap((query) => this.graphql.query({ ...options, query }) as any)
    ) as Observable<{ data: T }>;
  }

  mutate<T = IMutation>(options: ImportMutationMixin) {
    return of(importQuery(options.mutation)).pipe(
      switchMap((mutation) => this.graphql.mutate({ ...options, mutation }) as any)
    ) as Observable<{ data: T }>;
  }

  subscribe<T = ISubscription>(options: ImportSubscriptionMixin) {
    return of(importQuery(options.query)).pipe(
      switchMap((query) => this.graphql.subscribe({ ...options, query }) as any)
    ) as Observable<{ data: T }>;
  }
}

interface ImportQueryMixin extends QueryOptions {
  query: DocumentTypes;
}

interface ImportSubscriptionMixin extends SubscriptionOptions {
  query: DocumentTypes;
}

interface ImportMutationMixin extends MutationOptions {
  mutation: DocumentTypes;
  update?(proxy: DataProxy, res: { data: IMutation }): void;
}
```

#### Usage

```typescript
import { Component, html, css, async } from "@rxdi/lit-html";
import { BaseComponent } from "../../shared/base.component";
import { RouteParams } from "@rxdi/router";
import { map } from "rxjs/operators";

@Component({
  selector: "project-details-component",
  style: css`
    .container {
      width: 1000px;
    }
  `,
  template(this: DetailsComponent) {
    return html`
      <div class="container">
        ${async(this.project)}
      </div>
    `;
  },
})
export class DetailsComponent extends BaseComponent {
  @RouteParams()
  private params: { projectName: string };

  private project: Observable<IProjectType>;

  OnUpdateFirst() {
    this.project = this.getProject();
  }
  getProject() {
    return this.query({
      query: "get-project.query.graphql",
      variables: {
        name: this.params.projectName,
      },
    }).pipe(
      map(({ data }) => data.getProject),
      map(
        (project) => html`
          <p>${project.createdAt}</p>
          <p>${project.id}</p>
          <p>${project.name}</p>
          <p>${project.ownedBy}</p>
        `
      )
    );
  }
}
```


# Advanced features


Compression of Documents can be done like so

```


```