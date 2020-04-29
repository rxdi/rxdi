import { GraphQLClient } from 'graphql-request';
import { GRAPHQL_PUB_SUB_DI_CONFIG } from '../config.tokens';

import { PubSub } from 'graphql-subscriptions';

export class RemotePubsub extends PubSub {
  config: GRAPHQL_PUB_SUB_DI_CONFIG;
  client: GraphQLClient;
  defaultQuery = `{
    mutation publishSignal($signal: String!, $payload: JSON) {
      publishSignal(signal: $signal, payload: $payload) {
        status
      }
    }
  }`;
  constructor(config: GRAPHQL_PUB_SUB_DI_CONFIG) {
    super();
    this.config = config;
    this.client = new GraphQLClient(`${this.config.host}:${this.config.port}`, {
      headers: {
        Authorization: ''
      }
    });
  }
  notifier(signal: string = '', payload: Object = {}) {
    return this.client.request(this.config.query || this.defaultQuery, {
      signal,
      payload
    });
  }

  publish(signal: string, data: any): Promise<void> {
    return this.notifier(signal, data);
  }
}
