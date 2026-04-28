import { Module } from '@rxdi/core';
import { GraphQLNatsPubSubService } from './graphql-nats-pubsub.service';

@Module()
export class GraphQLNatsModule {
  static forRoot() {
    return {
      module: GraphQLNatsModule,
      providers: [GraphQLNatsPubSubService],
    };
  }
}

export * from './nats-pubsub.class';
export * from './graphql-nats-pubsub.service';