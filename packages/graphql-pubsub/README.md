# @rxdi Graphql-Pub-Sub Module

##### More information about Hapi server can be found here [Hapi](https://hapijs.com/)

##### For questions/issues you can write ticket [here](http://gitlab.youvolio.com/rxdi/graphql/issues)

##### This module is intended to be used with [rxdi](https://github.com/rxdi/core)

## Installation and basic examples:

##### To install this Gapi module, run:

```bash
$ npm install @rxdi/graphql-pubsub --save
```

## Consuming @rxdi/graphql-pubsub

##### Import inside AppModule or CoreModule

```typescript
import { Module } from "@rxdi/core";
import { HapiModule } from "@rxdi/hapi";
import { GraphQLPubSubModule } from "@rxdi/graphql-pubsub";

@Module({
  imports: [GraphQLPubSubModule.forRoot()],
})
export class CoreModule {}
```

Correct usage with `@rxdi/graphql`

```typescript
import { Module } from "@rxdi/core";
import { HapiModule } from "@rxdi/hapi";
import { GraphQLModule } from "@rxdi/graphql";
import { GraphQLPubSubModule } from "@rxdi/graphql-pubsub";

@Module({
  imports: [
    HapiModule.forRoot({
      hapi: {
        port: 9000,
      },
    }),
    GraphQLModule.forRoot({
      path: "/graphql",
      writeEffects: false,
      graphqlOptions: {
        schema: null,
      },
    }),
    GraphQLPubSubModule.forRoot(),
  ],
})
export class CoreModule {}
```

Options for pubsub server can be defined like so

```ts
GraphQLPubSubModule.forRoot({
  remotePubsub: false,
  activateRabbitMQ: false,
  host: "182.10.0.5",
  port: 5672,
  // authentication: AuthService as never,
  subscriptionServerOptions: {
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024, // Size (in bytes) below which messages
      // should not be compressed.
    },
  },
});
```

TODO: Better documentation...

Enjoy ! :)
