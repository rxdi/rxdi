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
    imports: [
        GraphQLPubSubModule.forRoot(),
    ]
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
                port: 9000
            }
        }),
        GraphQLModule.forRoot({
            path: '/graphql',
            openBrowser: false,
            writeEffects: false,
            graphiQlPath: '/graphiql',
            graphiqlOptions: {
                endpointURL: '/graphql',
                subscriptionsEndpoint: `${
                    process.env.GRAPHIQL_WS_SSH ? 'wss' : 'ws'
                    }://${process.env.GRAPHIQL_WS_PATH || 'localhost'}${
                    process.env.DEPLOY_PLATFORM === 'heroku'
                        ? ''
                        : `:${process.env.API_PORT ||
                        process.env.PORT}`
                    }/subscriptions`,
                websocketConnectionParams: {
                    token: process.env.GRAPHIQL_TOKEN
                }
            },
            graphqlOptions: {
                schema: null
            }
        }),
        GraphQLPubSubModule.forRoot(),
    ]
})
export class CoreModule {}
```

TODO: Better documentation...

Enjoy ! :)
