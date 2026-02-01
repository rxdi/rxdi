import { Channel, Message, Options } from "amqplib";
import { IRabbitMqConnectionFactory } from "./connectionFactory";
import { IQueueNameConfig, asQueueNameConfig } from "./common";
import { createChildLogger, Logger } from "./childLogger";

export interface IRabbitMqConsumerDisposer {
  (): Promise<unknown>;
}

export class RabbitMqConsumer {
  constructor(
    private logger: Logger,
    private connectionFactory: IRabbitMqConnectionFactory
  ) {
    this.logger = createChildLogger(logger, "RabbitMqConsumer");
  }

  async subscribe<T>(
    queue: string | IQueueNameConfig,
    action: (message: T) => Promise<any> | void
  ): Promise<IRabbitMqConsumerDisposer> {
    const queueConfig = asQueueNameConfig(queue);
    const connection = await this.connectionFactory.create();
    const channel = await connection.createChannel();

    this.logger.trace("got channel for queue '%s'", queueConfig.name);
    await this.setupChannel<T>(channel, queueConfig);
    return this.subscribeToChannel<T>(channel, queueConfig, action);
  }

  private setupChannel<T>(
    channel: Channel,
    queueConfig: IQueueNameConfig
  ) {
    this.logger.trace("setup '%j'", queueConfig);
    return Promise.all(this.getChannelSetup(channel, queueConfig));
  }

  private async subscribeToChannel<T>(
    channel: Channel,
    queueConfig: IQueueNameConfig,
    action: (message: T) => Promise<any> | void
  ) {
    this.logger.trace("subscribing to queue '%s'", queueConfig.name);
    const opts = await channel.consume(queueConfig.name, async (message) => {
      let msg: T = this.getMessageObject<T>(message);
      this.logger.trace(
        "message arrived from queue '%s' (%j)",
        queueConfig.name,
        msg
      );
      try {
        await action(msg);
      } catch (err) {
        this.logger.error(
          err,
          "message processing failed from queue '%j' (%j)",
          queueConfig,
          msg
        );
        channel.nack(message, false, false);
        return;
      }
      this.logger.trace(
        "message processed from queue '%s' (%j)",
        queueConfig.name,
        msg
      );
      channel.ack(message);
    });
    this.logger.trace(
      "subscribed to queue '%s' (%s)",
      queueConfig.name,
      opts.consumerTag
    );
    return (async () => {
      this.logger.trace(
        "disposing subscriber to queue '%s' (%s)",
        queueConfig.name,
        opts.consumerTag
      );
      await channel.cancel(opts.consumerTag);
      await channel.close();
      return Promise.resolve();
    }) as IRabbitMqConsumerDisposer;
  }

  protected getMessageObject<T>(message: Message) {
    return JSON.parse(message.content.toString("utf8")) as T;
  }

  protected getChannelSetup(
    channel: Channel,
    queueConfig: IQueueNameConfig
  ) {
    return [
      channel.assertQueue(
        queueConfig.name,
        this.getQueueSettings(queueConfig.exchange)
      ),
      channel.assertQueue(queueConfig.dlq, this.getDLSettings()),
      channel.assertExchange(queueConfig.exchange, "fanout", this.getDLSettings()),
      channel.bindQueue(queueConfig.dlq, queueConfig.exchange, "*"),
    ];
  }

  protected getQueueSettings(
    deadletterExchangeName: string
  ): Options.AssertQueue {
    var settings = this.getDLSettings();
    settings.arguments = {
      "x-dead-letter-exchange": deadletterExchangeName,
    };
    return settings;
  }

  protected getDLSettings(): Options.AssertQueue {
    return {
      durable: true,
      autoDelete: true,
    };
  }
}
