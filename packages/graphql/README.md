# @rxdi Graphql Module

[![Build Status](https://travis-ci.org/rxdi/graphql.svg?branch=master)](https://travis-ci.org/rxdi/graphql)

##### More information about Hapi server can be found here [Hapi](https://hapijs.com/)
##### For questions/issues you can write ticket [here](http://gitlab.youvolio.com/rxdi/graphql/issues)
##### This module is intended to be used with [rxdi](https://github.com/rxdi/core)

## Installation and basic examples:
##### To install this Gapi module, run:

```bash
$ npm install @rxdi/graphql --save
```

## Consuming @rxdi/graphql

##### Import inside AppModule or CoreModule
```typescript
import { Module } from "@rxdi/core";
import { HapiModule } from "@rxdi/hapi";
import { GraphQLModule } from "@rxdi/graphql";

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
    ]
})
export class CoreModule {}
```



##### Install NEO4J Driver
```bash
$ npm install neo4j-graphql-js neo4j-driver
```

##### Neo4J Driver load
```typescript
import { Module } from "@rxdi/core";
import { HapiModule } from "@rxdi/hapi";
import { GraphQLModule } from "@rxdi/graphql";
import { v1 as neo4j } from 'neo4j-driver';
import * as neo4jgql from 'neo4j-graphql-js';

@Module({
    providers: [{
        provide: 'neo4j-graphql-js',
        useValue: neo4jgql
    }],
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
                context: {
                    driver: (neo4j.driver(
                        'bolt://localhost:7687',
                        neo4j.auth.basic('neo4j', 'your-graph-password')
                    ))
                },
                schema: null
            }
        }),
    ]
})
export class CoreModule {}
```

#### Using ON_REQUEST and SCHEMA_OVERRIDE

```typescript
import { Module, ON_REQUEST_HANDLER, SCHEMA_OVERRIDE, Boom } from "@gapi/core";
import { AppQueriesController } from "./app.controller";
import { Request, ResponseToolkit } from 'hapi';

@Module({
    controllers: [AppQueriesController],
    providers: [
        {
            provide: SCHEMA_OVERRIDE,
            useFactory: () => (schema) => {
                // Do things with bootstrapped schema
                return schema;
            }
        },
        {
            provide: ON_REQUEST_HANDLER,
            useFactory: () => async (next, request: Request, h: ResponseToolkit, err: Error) => {
                // Authenticate user here if it is not authenticated return Boom.unauthorized()
                // if (request.headers.authorization) {
                //     const tokenData = ValidateToken(request.headers.authorization);
                //     const user = {};
                //     if (!user) {
                //         return Boom.unauthorized();
                //     } else {
                //         context.user = {id: 1, name: 'pesho'};
                //     }
                // }
                return next();
            }
        }
    ]
})
export class AppModule { }
```

#### Here we inject neo4j-graphql-js library to dependency injection so graphql server will handle it and work with the library

```typescript
    providers: [{
        provide: 'neo4j-graphql-js',
        useValue: neo4jgql
    }],
```

#### Here we attach neo4j driver to context of our resolvers

```typescript
    context: {
        driver: (neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'your-pass')
        ))
    },
```

You are ready to write queries :)




TODO: Better documentation...

Enjoy ! :)
