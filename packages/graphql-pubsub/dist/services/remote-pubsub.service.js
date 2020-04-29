"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const graphql_subscriptions_1 = require("graphql-subscriptions");
class RemotePubsub extends graphql_subscriptions_1.PubSub {
    constructor(config) {
        super();
        this.defaultQuery = `{
    mutation publishSignal($signal: String!, $payload: JSON) {
      publishSignal(signal: $signal, payload: $payload) {
        status
      }
    }
  }`;
        this.config = config;
        this.client = new graphql_request_1.GraphQLClient(`${this.config.host}:${this.config.port}`, {
            headers: {
                Authorization: ''
            }
        });
    }
    notifier(signal = '', payload = {}) {
        return this.client.request(this.config.query || this.defaultQuery, {
            signal,
            payload
        });
    }
    publish(signal, data) {
        return this.notifier(signal, data);
    }
}
exports.RemotePubsub = RemotePubsub;
