import { from, Observable, switchMap } from "rxjs";
import { retry, share } from "rxjs/operators";
import { createChildLogger, Logger } from "./childLogger";
import { asPubSubQueueNameConfig, IQueueNameConfig } from "./common";
import { RxJsRabbitMqConnectionFactory } from "./connectionFactory";
import { Channel } from "amqplib";

/**
 * RxJS-based Subscriber with automatic reconnection
 */
export class RxJsRabbitMqSubscriber {
  private logger: Logger;

  constructor(
    logger: Logger,
    private connectionFactory: RxJsRabbitMqConnectionFactory,
  ) {
    this.logger = createChildLogger(logger, 'RxJsRabbitMqSubscriber');
  }

  /**
   * Subscribe to a queue and return an Observable stream
   */
  public subscribe$<T>(
    queue: string | IQueueNameConfig,
    options?: Partial<IQueueNameConfig>,
  ): Observable<T> {
    const queueConfig = asPubSubQueueNameConfig(queue);

    return this.connectionFactory.getConnection$().pipe(
      switchMap((connection) => from(connection.createChannel())),
      switchMap(async (channel) => {
        if (options?.prefetch) {
          await channel.prefetch(options.prefetch, options.globalPrefetch);
        }
        this.logger.trace("got channel for queue '%s'", queueConfig.name);
        
        const queueName = await this.setupChannel(channel, {
          ...queueConfig,
          ...options,
        });

        this.logger.debug(
          "queue name generated for subscription queue '(%s)' is '(%s)'",
          queueConfig.name,
          queueName,
        );

        return { channel, queueName };
      }),
      switchMap(({ channel, queueName }) =>
        this.createMessageStream<T>(channel, queueName, queueConfig.name),
      ),
      share(), // Multicast to multiple subscribers
    );
  }

  /**
   * Create an observable stream from channel messages
   */
  private createMessageStream<T>(
    channel: Channel,
    queueName: string,
    originalQueueName: string,
  ): Observable<T> {
    return new Observable<T>((subscriber) => {
      let consumerTag: string;

      channel
        .consume(queueName, async (message) => {
          if (!message) return;

          try {
            const msg = JSON.parse(message.content.toString('utf8')) as T;
            
            this.logger.trace(
              "message arrived from queue '%s' (%j)",
              originalQueueName,
              msg,
            );

            subscriber.next(msg);
            channel.ack(message);

            this.logger.trace(
              "message processed from queue '%s' (%j)",
              originalQueueName,
              msg,
            );
          } catch (err) {
            this.logger.error(
              err,
              "message processing failed from queue '%s'",
              originalQueueName,
            );
            channel.nack(message, false, false);
            subscriber.error(err);
          }
        })
        .then((opts) => {
          consumerTag = opts.consumerTag;
          this.logger.trace(
            "subscribed to queue '%s' (%s)",
            originalQueueName,
            consumerTag,
          );
        })
        .catch((err) => {
          this.logger.error(err, "failed to subscribe to queue '%s'", originalQueueName);
          subscriber.error(err);
        });

      // Cleanup function
      return () => {
        this.logger.trace(
          "disposing subscriber to queue '%s' (%s)",
          originalQueueName,
          consumerTag,
        );

        if (consumerTag) {
          channel
            .cancel(consumerTag)
            .then(() => channel.close())
            .catch((err) => {
              this.logger.error(err, 'failed to cancel consumer');
            });
        }
      };
    }).pipe(
      retry({
        count: 3,
        delay: 1000,
      }),
    );
  }

  private async setupChannel(
    channel: Channel,
    queueConfig: IQueueNameConfig,
  ): Promise<string> {
    await channel.assertExchange(queueConfig.dlx, 'fanout', {
      durable: true,
      autoDelete: true,
    });

    const result = await channel.assertQueue(
      queueConfig.strictName ? queueConfig.name : queueConfig.dlq,
      {
        exclusive: false,
        autoDelete: true,
      },
    );

    await channel.bindQueue(result.queue, queueConfig.dlx, '');
    return result.queue;
  }
}

/**
 * Usage examples:
 * 
 * // Publisher
 * const publisher = new RxJsRabbitMqPublisher(logger, factory);
 * 
 * publisher.publish('my-queue', { data: 'test' }).subscribe({
 *   next: () => console.log('Published'),
 *   error: (err) => console.error(err)
 * });
 * 
 * // High-throughput publishing with backpressure
 * for (let i = 0; i < 1000; i++) {
 *   publisher.queuePublish('my-queue', { id: i });
 * }
 * 
 * // Subscriber
 * const subscriber = new RxJsRabbitMqSubscriber(logger, factory);
 * 
 * subscriber.subscribe$<MyMessage>('my-queue').pipe(
 *   tap(msg => console.log('Received:', msg)),
 *   filter(msg => msg.type === 'important'),
 *   // Auto-reconnects on error
 * ).subscribe();
 */