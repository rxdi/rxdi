# @rxdi Altair Playground

##### More information about Altair can be found here [Altair](https://altairgraphql.dev/docs)

##### This module is intended to be used with [rxdi](https://github.com/rxdi/core)

## Installation and basic examples:

##### To install this Gapi module, run:

```bash
$ npm install @rxdi/altair
```

## Consuming @rxdi/graphql

##### Import inside AppModule or CoreModule

```typescript
import { Module } from '@rxdi/core';
import { HapiModule } from '@rxdi/hapi';
import { GraphQLModule } from '@rxdi/graphql';

@Module({
 imports: [
  HapiModule.forRoot(),
  GraphQLModule.forRoot(),
  AltairModule.forRoot({
   baseURL: 'http://localhost:9000/altair/',
   endpointURL: 'http://localhost:9000/graphql',
   subscriptionsEndpoint: 'http://localhost:9000/subscriptions',
   initialQuery: `{ status { status } }`,
  }),
 ],
})
export class AppModule {}
```


Now open http://localhost:9000/altair and Njoy! :) 