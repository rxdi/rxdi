import { PubSub } from "graphql-subscriptions";
import { AmqpPubSub } from "@rxdi/graphql-rabbitmq-subscriptions";
import { Service, Inject } from "@rxdi/core";
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG,
} from "../config.tokens";
import { PubSubLogger } from "./logger.service";
export let pubsub: PubSub | AmqpPubSub;

@Service()
export class PubSubService {
  sub: AmqpPubSub | PubSub;
  constructor(
    @Inject(GRAPHQL_PUB_SUB_CONFIG) private config: GRAPHQL_PUB_SUB_DI_CONFIG,
    private logger: PubSubLogger
  ) {
    if (this.config.pubsub) {
      this.sub = this.config.pubsub;
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

  /* Old version before 3.0.0 of async iterator inside graphql-subscriptions */
  asyncIterator<T>(event, options?): AsyncIterator<T> {
    return this.sub.asyncIterableIterator<T>(event, options);
  }

  /* New version of graphql-subscriptions async iterator */
  asyncIterableIterator<T>(event, options?): AsyncIterator<T> {
    return this.sub.asyncIterableIterator<T>(event, options);
  }

  publish(signal: string, data: any): Promise<void> {
    return this.sub.publish(signal, data);
  }
}
