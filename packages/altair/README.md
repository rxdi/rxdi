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

@Module({
 imports: [
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

<img width="1920" height="860" alt="Screenshot from 2025-12-24 01-38-03" src="https://github.com/user-attachments/assets/30fb08d7-5c47-43e2-93f6-fec8e73219f6" />


Now open http://localhost:9000/altair and Njoy! :) 
