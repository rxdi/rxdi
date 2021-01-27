import { PubSub } from "graphql-subscriptions";
import { AmqpPubSub } from "@rxdi/graphql-rabbitmq-subscriptions";
import { Service, Inject } from "@rxdi/core";
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG,
} from "../config.tokens";
import { PubSubLogger } from "./logger.service";
export let pubsub: PubSub | AmqpPubSub;
import { RemotePubsub } from "./remote-pubsub.service";

@Service()
export class PubSubService {
  sub: AmqpPubSub | PubSub | RemotePubsub;
  constructor(
    @Inject(GRAPHQL_PUB_SUB_CONFIG) private config: GRAPHQL_PUB_SUB_DI_CONFIG,
    private logger: PubSubLogger
  ) {
    if (this.config.pubsub) {
      this.sub = this.config.pubsub;
    } else if (this.config.remotePubsub) {
      this.sub = new RemotePubsub({
        host: this.config.host,
        port: this.config.host,
      });
    } else if (this.config.activateRabbitMQ) {
      this.sub = new AmqpPubSub({
        config: `amqp://${
          this.config.user || process.env.AMQP_USER || "guest"
        }:${this.config.pass || "guest"}@${
          this.config.host || process.env.AMQP_HOST || "localhost"
        }:${this.config.port || process.env.AMQP_PORT || "5672"}` as never,
        logger: this.config.logger || this.logger,
      });
    } else {
      this.sub = new PubSub();
    }
  }

  asyncIterator<T>(event): AsyncIterator<T> {
    return this.sub.asyncIterator<T>(event);
  }

  publish(signal: string, data: any): Promise<void> {
    return this.sub.publish(signal, data);
  }
}
