# @rxdi Neo4J Module

[![Build Status](https://travis-ci.org/rxdi/neo4j.svg?branch=master)](https://travis-ci.org/rxdi/neo4j)

##### For questions/issues you can write ticket [here](http://gitlab.youvolio.com/rxdi/neo4j/issues)
##### This module is intended to be used with [rxdi](https://github.com/rxdi/core)

> With this module by just defining your types and adding them inside `types` property you will have `CRUD` operations generated automatically

> This module with the help of `neo4j-graphql` converts `GraphqlSchema` queries to `Cypher Neo4J` queries

> Why is this so cool ? :)) Because while you are writing your schema you can have also `queries` and `mutations` prepared for you to execute inside `Neo4J Graph`

## Installation and basic examples:
##### To install this module, run:

```bash
$ npm install @rxdi/neo4j --save
```

## Consuming @rxdi/neo4j

##### Simple approach
```typescript
import { Module, CoreModule } from '@gapi/core';
import { Neo4JModule } from '@rxdi/neo4j';
import { UserType } from './user.type';

@Module({
  imports: [
    CoreModule.forRoot(),
    Neo4JModule.forRoot({
      types: [UserType],
      password: '12345678',
      username: 'neo4j',
      address: 'bolt://localhost:7687',
      excludedTypes: {
        mutation: {
          exclude: [UserType]
        }
      }
    })
  ]
})
export class AppModule {}
```

#####  Simple GraphqlObject `UserType`
```typescript
import { GraphQLObjectType, GraphQLString } from 'graphql';

export const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    userName: {
      type: GraphQLString
    },
  })
});

```


##### More complex Approach

```typescript
import { Module, CoreModule } from '@gapi/core';
import { Neo4JModule } from '@rxdi/neo4j';
import { UserType } from './user.type';
import { GraphQLSchema } from 'graphql';

@Module({
  imports: [
    Neo4JModule.forRoot({
      types: [
        UserType
      ],
      schemaOverride(schema: GraphQLSchema) {
        return neo4jgql.makeAugmentedSchema({
          typeDefs: printSchema(schema),
          config: {
            mutation: {
                exclude: [UserType.name]
            }
          }
        });
      },
      async onRequest(graphqlRequest, request, h, err) {
        const context = {
          driver: neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', '12345678')
          )
        }
        return graphqlRequest(context);
      }
    }),
  ]
})
export class AppModule {}
```

##### Import inside AppModule or CoreModule
```typescript
import { Module, CoreModule } from '@gapi/core';
import { VoyagerModule } from '@gapi/voyager';
import { Neo4JModule } from '@rxdi/neo4j';
import { UserContext } from './types/user/user-context.type';
import { User } from './types/user/user.type';
import { Message } from './types/message/message.type';
import { Channel } from './types/channel/channel.type';
import { AttachmentType } from './types/attachment/attachment.type';
import { ToUpperCaseDirective } from './core/directives/toUppercase.directive';

// import { AppQueriesController } from './app.controller';
// Uncomment to override some methods which are provided from neo4js

@Module({
  // controllers: [AppQueriesController],
  imports: [
    CoreModule.forRoot({
      graphql: { directives: [ToUpperCaseDirective] }
    }),
    Neo4JModule.forRoot({
      types: [UserContext, User, Message, Channel, AttachmentType],
      username: 'neo4j',
      password: '12345678',
      address: 'bolt://localhost:7687',
      context: {},
      excludedTypes: {
        mutation: {
          exclude: [UserContext]
        }
      }
    }),
    // Optional voyager but you will not regret to have mind mapping for all your graph api :) npm i @gapi/voyager
    VoyagerModule.forRoot({
      endpointUrl: '/graphql',
      path: '/voyager'
    })
  ]
})
export class AppModule {}
```


##### Graphql Directive

```typescript
import { GraphQLCustomDirective } from '@gapi/core';
import { DirectiveLocation } from 'graphql';

export const ToUpperCaseDirective = new GraphQLCustomDirective<string>({
  name: 'toUpperCase',
  description: 'change the case of a string to uppercase',
  locations: [DirectiveLocation.FIELD],
  resolve: async resolve => (await resolve()).toUpperCase()
});
```


##### Interceptor
```typescript
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Service } from '@rxdi/core';
import { InterceptResolver, GenericGapiResolversType } from '@gapi/core';
import { GraphQLContext } from '../../app.context';

@Service()
export class LoggerInterceptor implements InterceptResolver {
  intercept(
    chainable$: Observable<any>,
    context: GraphQLContext,
    payload,
    descriptor: GenericGapiResolversType
  ) {
    console.log('Before...');
    const now = Date.now();
    return chainable$.pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`))
    );
  }
}
```


##### Guard
```typescript
import { Service } from '@rxdi/core';
import { CanActivateResolver, GenericGapiResolversType } from '@gapi/core';
import { GraphQLContext } from '../../app.context';

@Service()
export class AdminOnly implements CanActivateResolver {
  canActivate(
    context: GraphQLContext,
    payload,
    descriptor: GenericGapiResolversType
  ) {
    return false;
  }
}
```


##### Controller
> The name of our class methods is important since we want to override default `neo4j-graphql` autogenerated types
```typescript

import { Controller, Type, Mutation, GraphQLString, Query, Interceptor, Guard } from '@gapi/core';
import { Message } from './types/message/message.type';
import { GraphQLContext } from './app.context';
import { GraphQLList } from 'graphql';
import { graphRequest } from '@rxdi/neo4j';
import { IMessage } from './core/api-introspection';
import { LoggerInterceptor } from './core/interceptors/logger.interceptor';
import { AdminOnly } from './core/guards/admin-only.guard';

@Controller()
export class AppQueriesController {

  @Interceptor(LoggerInterceptor)
  @Type(Message)
  @Guard(AdminOnly)
  @Mutation({
    messageId: {
      type: GraphQLString
    },
    channelId: {
      type: GraphQLString
    }
  })
  CreateMessage(root, params, ctx: GraphQLContext, resolveInfo): Promise<IMessage> {
    return graphRequest<IMessage>(root, params, ctx, resolveInfo);
  }

  @Type(new GraphQLList(Message))
  @Query({
    messageId: {
      type: GraphQLString
    },
    channelId: {
      type: GraphQLString
    }
  })
  Messages(root, params, ctx: GraphQLContext, resolveInfo): Promise<IMessage[]> {
    return graphRequest<IMessage[]>(root, params, ctx, resolveInfo);
  }

  @Type(Message)
  @Query({
    messageId: {
      type: GraphQLString
    },
    channelId: {
      type: GraphQLString
    }
  })
  Message(root, params, ctx: GraphQLContext, resolveInfo): Promise<IMessage> {
    return graphRequest<IMessage>(root, params, ctx, resolveInfo);
  }
}

```

##### Context interface

```typescript
import { Driver } from '@rxdi/neo4j';

export interface GraphQLContext {
  driver: Driver;
}
```

##### Example query
> Note: `offset`, `first`, `orderBy` are autogenerated for convenience

```graphql
query {
  User(userName: "your-name", first: 10, offset: 10, orderBy: userName_asc) {
    userName
  }
}
```


TODO: Better documentation...

Enjoy ! :)
