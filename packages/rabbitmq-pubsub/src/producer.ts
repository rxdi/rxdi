import * as amqp from "amqplib";
import { IRabbitMqConnectionFactory } from "./connectionFactory";
import { IQueueNameConfig, asQueueNameConfig } from "./common";
import { createChildLogger, Logger } from "./childLogger";

export class RabbitMqProducer {
  constructor(
    private logger: Logger,
    private connectionFactory: IRabbitMqConnectionFactory
  ) {
    this.logger = createChildLogger(logger, "RabbitMqProducer");
  }

  async publish<T>(
    queue: string | IQueueNameConfig,
    message: T,
    options?: IQueueNameConfig
  ): Promise<void> {
    const queueConfig = asQueueNameConfig(queue);
    const settings = this.getQueueSettings(queueConfig.dlx);
    const connection = await this.connectionFactory.create();
    const channel = await connection.createChannel();
    if (options.prefetch) {
      await channel.prefetch(options.prefetch, options.globalPrefetch);
    }
    await channel.assertQueue(queueConfig.name, settings);
    if (
      !channel.sendToQueue(queueConfig.name, this.getMessageBuffer(message), {
        persistent: true,
      })
    ) {
      this.logger.error(
        "unable to send message to queue '%j' {%j}",
        queueConfig,
        message
      );
      throw new Error("Unable to send message");
    }

    this.logger.trace(
      "message sent to queue '%s' (%j)",
      queueConfig.name,
      message
    );
    return channel.close();
  }

  protected getMessageBuffer<T>(message: T) {
    return Buffer.from(JSON.stringify(message), "utf8");
  }

  protected getQueueSettings(
    deadletterExchangeName: string
  ): amqp.Options.AssertQueue {
    return {
      durable: true,
      autoDelete: true,
      arguments: {
        "x-dead-letter-exchange": deadletterExchangeName,
      },
    };
  }
}
