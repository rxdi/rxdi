import { Channel, Message, Options } from "amqplib";
import { IRabbitMqConnectionFactory } from "./connectionFactory";
import { IQueueNameConfig, asPubSubQueueNameConfig } from "./common";
import { createChildLogger, Logger } from "./childLogger";

export interface IRabbitMqSubscriberDisposer {
  (): Promise<void>;
}

export class RabbitMqSubscriber {
  constructor(
    private logger: Logger,
    private connectionFactory: IRabbitMqConnectionFactory
  ) {
    this.logger = createChildLogger(logger, "RabbitMqConsumer");
  }

  async subscribe<T>(
    queue: string | IQueueNameConfig,
    action: (message: T) => Promise<IRabbitMqSubscriberDisposer>,
    options?: Partial<IQueueNameConfig>
  ): Promise<IRabbitMqSubscriberDisposer> {
    const queueConfig = asPubSubQueueNameConfig(queue);
    const connection = await this.connectionFactory.create();
    const channel = await connection.createChannel();
    if (options?.prefetch) {
      await channel.prefetch(options.prefetch, options.globalPrefetch);
    }
    this.logger.trace("got channel for queue '%s'", queueConfig.name);
    const queueName = await this.setupChannel<T>(channel, {
      ...queueConfig,
      ...options
    });

    this.logger.debug(
      "queue name generated for subscription queue '(%s)' is '(%s)'",
      queueConfig.name,
      queueName
    );
    const queConfig = { ...queueConfig, dlq: queueName };
    return this.subscribeToChannel<T>(channel, queConfig, action);
  }

  private setupChannel<T>(
    channel: Channel,
    queueConfig: IQueueNameConfig
  ) {
    this.logger.trace("setup '%j'", queueConfig);
    return this.getChannelSetup(channel, queueConfig);
  }

  private async subscribeToChannel<T>(
    channel: Channel,
    queueConfig: IQueueNameConfig,
    action: (message: T) => Promise<IRabbitMqSubscriberDisposer>
  ) {
    this.logger.trace("subscribing to queue '%s'", queueConfig.name);
    const opts = await channel.consume(queueConfig.dlq, async (message) => {
      let msg: T = this.getMessageObject<T>(message);
      this.logger.trace(
        "message arrived from queue '%s' (%j)",
        queueConfig.name,
        msg
      );
      try {
        const disposer = await action(msg);
        this.logger.trace(
          "message processed from queue '%s' (%j)",
          queueConfig.name,
          msg
        );
        channel.ack(message);
        return disposer;
      } catch (err) {
        this.logger.error(
          err,
          "message processing failed from queue '%j' (%j)",
          queueConfig,
          msg
        );
        channel.nack(message, false, false);
      }
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
      await channel.cancel(opts.consumerTag); // Cancel consumer first
      await channel.close();
    }) as IRabbitMqSubscriberDisposer;
  }

  protected getMessageObject<T>(message: Message) {
    return JSON.parse(message.content.toString("utf8")) as T;
  }

  protected async getChannelSetup(
    channel: Channel,
    queueConfig: IQueueNameConfig
  ) {
    await channel.assertExchange(
      queueConfig.dlx,
      "fanout",
      this.getDLSettings()
    );
    let result = await channel.assertQueue(
      queueConfig.strictName ? queueConfig.name : queueConfig.dlq,
      this.getQueueSettings(queueConfig.arguments)
    );
    await channel.bindQueue(result.queue, queueConfig.dlx, "");
    return result.queue;
  }

  protected getQueueSettings(args?: {
    [key: string]: any;
  }): Options.AssertQueue {
    return {
      exclusive: false,
      autoDelete: true,
      arguments: args,
    };
  }

  protected getDLSettings(): Options.AssertQueue {
    return {
      durable: true,
      autoDelete: true,
    };
  }
}
