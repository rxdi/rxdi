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
   password: '12345678',
   username: 'neo4j',
   address: 'bolt://localhost:7687',
  }),
 ],
})
export class AppModule {}
```

##### More complex Approach

```typescript
import { Module, CoreModule } from '@gapi/core';
import { Neo4JModule, UtilService } from '@rxdi/neo4j';
import { GraphQLSchema } from 'graphql';

@Module({
 imports: [
  Neo4JModule.forRoot({
   schemaOverride(schema: GraphQLSchema) {
    const neo4JUtils = Container.get(UtilService);
    neo4JUtils.validateSchema(schema);

    const typeDefs = neo4JUtils.generateTypeDefs(schema);

    const neoSchema = new Neo4jGraphQL({
     typeDefs,
     driver,
     assumeValidSDL: true,
    });
    return neoSchema;
   },
  }),
 ],
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

@Module({
 imports: [
  CoreModule.forRoot({
   graphql: { directives: [ToUpperCaseDirective] },
  }),
  Neo4JModule.forRoot({
   username: 'neo4j',
   password: '12345678',
   address: 'bolt://localhost:7687',
  }),
  // Optional voyager but you will not regret to have mind mapping for all your graph api :) npm i @gapi/voyager
  VoyagerModule.forRoot({
   endpointUrl: '/graphql',
   path: '/voyager',
  }),
 ],
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
 resolve: async (resolve) => (await resolve()).toUpperCase(),
});
```

TODO: Better documentation...

Enjoy ! :)
