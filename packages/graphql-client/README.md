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


# Subscription connection errors and the subscription client

The WebSocket link is a lazy `subscriptions-transport-ws` `SubscriptionClient`
with `reconnect: true`. Two things follow from that, and both are the
consumer's to handle:

- **A rejected handshake errors every pending subscription.** The server's
  `onConnect` rejection reaches each operation's observable as a bare
  `{ message }` (no `graphQLErrors`). That is the deterministic signal that
  the connection is dead.
- **The library never stops the reconnect loop by itself.** After the server
  closes the socket the client re-handshakes with backoff (capped at 10 s)
  forever, re-sending the same `connectionParams`. For a dead session that
  is a request to your auth backend every few seconds per open tab.

So the module exposes the client and a hook:

```typescript
import {
  GraphqlModule,
  GraphqlSubscriptionClient,
  isAuthorizationConnectionError,
} from '@rxdi/graphql-client';

GraphqlModule.forRoot({
  uri, pubsub,
  pubsubOptions: { connectionParams: () => ({ 'x-session-id': session.id }) },
  // Handshake rejections only (never success). Fires BEFORE the operation
  // errors, so do not close the client from here — log or flag state.
  onSubscriptionConnectionError: (error) => console.warn('ws rejected', error),
});

// Where you handle the operation error (an effect, a service, ...):
@Injectable()
class SessionService {
  @Inject(GraphqlSubscriptionClient) private ws: GraphqlSubscriptionClient;

  onSubscriptionError(error: unknown) {
    if (isAuthorizationConnectionError(error)) {
      // Session is dead: stop re-sending it. Works in every client state
      // (a plain close(true, true) is a no-op between reconnect attempts)
      // and errors any other still-pending subscription with the reason.
      this.ws.terminate(error instanceof Error ? error : undefined);
      // ...show your "session expired" UI. Once credentials are renewed,
      // simply subscribe again: the lazy link reconnects and re-evaluates
      // connectionParams.
    }
  }
}
```

Why not terminate inside `onSubscriptionConnectionError`: the connection-level
error arrives before the per-operation errors. Stopping the client there
settles the operations before the real rejection reaches them, so the app
never learns the session died; a non-forced close (`close(false, false)`)
schedules a reconnect. The decision belongs where the operation error is
observed.

`GraphqlSubscriptionClient` resolves to a `ManagedSubscriptionClient`: the
stock client plus `terminate(reason?)`. Prefer it over `close(true, true)`,
which does nothing between two reconnect attempts (no socket object exists
then) and leaves the reconnect timer armed.

`refreshOnUnauthenticated: true` keeps its exact old meaning —
`location.reload()` when the rejection message is the literal `Unauthorized`,
and nothing else. It is deliberately NOT widened: a consumer whose server says
`You are not authorized` never reloaded before, and silently turning that into
a reload could loop a page whose credentials are launch-bound (an operator's
session id). Use `isAuthorizationConnectionError` in your own hook when you
want the wider match.

The contract above is pinned by `src/index.spec.ts` against a real
subscriptions-transport-ws server (`npm test`).

# Advanced features


Compression of Documents can be done like so

```


```