import { Channel, Message, Options } from "amqplib";
import { IRabbitMqConnectionFactory } from "./connectionFactory";
import { IDeadLetterMessage, IQueueNameConfig, asPubSubQueueNameConfig } from "./common";
import { createChildLogger, Logger } from "./childLogger";

/** Wait before subscribing again after a lost connection / channel / consumer. */
export const RESUBSCRIBE_DELAY_MS = 5_000;

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

  /**
   * Subscribes to a queue and KEEPS the subscription: when the connection,
   * the channel or the consumer is lost (the broker restarted, the queue was
   * deleted, the first connect failed because the broker was not up yet) it
   * subscribes again after RESUBSCRIBE_DELAY_MS, until disposed.
   *
   * Before, a subscription was made once. A service that survived a broker
   * restart stayed up and deaf - no ticks, no jobs - until someone restarted
   * it; one that started while the broker was down never listened at all
   * (2026-11-17, a RabbitMQ pod evicted twice).
   */
  async subscribe<T>(
    queue: string | IQueueNameConfig,
    action: (message: T) => Promise<IRabbitMqSubscriberDisposer>,
    options?: Partial<IQueueNameConfig>
  ): Promise<IRabbitMqSubscriberDisposer> {
    const queueConfig = asPubSubQueueNameConfig(queue);
    let disposed = false;
    let dispose: IRabbitMqSubscriberDisposer | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const again = (why: string) => {
      if (disposed || pending) {
        return;
      }
      this.logger.error(
        "subscription to queue '%s' lost (%s) - subscribing again in %d ms",
        queueConfig.name,
        why,
        RESUBSCRIBE_DELAY_MS
      );
      dispose = undefined;
      pending = setTimeout(() => {
        pending = undefined;
        void attempt();
      }, RESUBSCRIBE_DELAY_MS);
    };

    const attempt = async () => {
      if (disposed) {
        return;
      }
      try {
        const connection = await this.connectionFactory.create();
        const channel = await connection.createChannel();
        // an 'error' nobody listens to would crash the process; a channel
        // also closes when its connection does
        channel.on("error", (err) =>
          this.logger.error(
            err,
            "channel error on queue '%s'",
            queueConfig.name
          )
        );
        channel.on("close", () => again("channel closed"));
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
        const queConfig = { ...queueConfig, ...options, dlq: queueName };
        dispose = await this.subscribeToChannel<T>(channel, queConfig, action);
      } catch (err) {
        this.logger.error(
          err,
          "failed to subscribe to queue '%s'",
          queueConfig.name
        );
        again("subscribe failed");
      }
    };

    await attempt();

    return (async () => {
      disposed = true;
      if (pending) {
        clearTimeout(pending);
        pending = undefined;
      }
      const current = dispose;
      dispose = undefined;
      if (current) {
        await current();
      }
    }) as IRabbitMqSubscriberDisposer;
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
      if (message === null) {
        // the broker cancelled the consumer (its queue was deleted): closing
        // the channel makes `subscribe` set everything up again
        this.logger.error(
          "consumer of queue '%s' was cancelled by the broker",
          queueConfig.name
        );
        await channel.close().catch(() => undefined);
        return;
      }
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
        const exchange = queueConfig?.arguments?.['x-dead-letter-exchange'];
        if (!exchange) {
          return channel.nack(message, false, false);
        }
        channel.publish(
          exchange || queueConfig.exchange,
          queueConfig.arguments?.['x-dead-letter-routing-key'] || '',
          Buffer.from(
            JSON.stringify({
              data: msg,
              error: {
                message: err.message,
              },
            } as IDeadLetterMessage<T>)
          )
        );
        channel.ack(message);
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
      queueConfig.exchange,
      "fanout",
      this.getDLSettings()
    );
    let result = await channel.assertQueue(
      queueConfig.strictName ? queueConfig.name : queueConfig.dlq,
      this.getQueueSettings(queueConfig.arguments)
    );
    await channel.bindQueue(result.queue, queueConfig.exchange, "");
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
