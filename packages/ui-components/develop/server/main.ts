import { BootstrapFramework } from '@rxdi/core';
import { GraphQLModule } from '@rxdi/graphql';
import { HapiModule } from '@rxdi/hapi';
import { GraphQLPubSubModule } from '@rxdi/graphql-pubsub';
import { AppModule } from './app.module';

BootstrapFramework(AppModule, [
  HapiModule.forRoot({
    hapi: {
      port: process.env.API_PORT || process.env.PORT || 9000,
      routes: {
        cors: {
          origin: ['*'],
          additionalHeaders: [
            'Host',
            'User-Agent',
            'Accept',
            'Accept-Language',
            'Accept-Encoding',
            'Access-Control-Request-Method',
            'Access-Control-Allow-Origin',
            'Access-Control-Request-Headers',
            'Origin',
            'Connection',
            'Pragma',
            'Cache-Control'
          ]
        }
      }
    }
  }),
  GraphQLModule.forRoot({
    path: '/graphql',
    initQuery: true,
    openBrowser: true,
    writeEffects: true,
    graphiql: false,
    graphiQlPlayground: true,
    graphiQlPath: '/',
    graphiqlOptions: {
      endpointURL: '/graphql',
      subscriptionsEndpoint: `${
        process.env.GRAPHIQL_WS_SSH ? 'wss' : 'ws'
      }://${process.env.GRAPHIQL_WS_PATH || 'localhost'}${
        process.env.DEPLOY_PLATFORM === 'heroku'
          ? ''
          : `:${process.env.API_PORT || process.env.PORT || 9000}`
      }/subscriptions`,
      websocketConnectionParams: {
        token: process.env.GRAPHIQL_TOKEN
      }
    },
    graphqlOptions: {
      schema: null
    }
  }),
  GraphQLPubSubModule.forRoot()
]).subscribe(() => console.log('Server started'));
