import { Channel, Message, Options } from 'amqplib';
import {
  Observable,
  defer,
  from,
  Subject,
  merge,
  EMPTY,
  throwError,
} from 'rxjs';
import {
  switchMap,
  tap,
  catchError,
  finalize,
  share,
  retry,
  mergeMap,
} from 'rxjs/operators';
import { RxJsRabbitMqConnectionFactory } from './connectionFactory';
import { IQueueNameConfig, asPubSubQueueNameConfig } from './common';
import { createChildLogger, Logger } from './childLogger';

/**
 * RxJS-based Publisher with backpressure support
 */
export class RxJsRabbitMqPublisher {
  private logger: Logger;
  private publishQueue$ = new Subject<{
    queue: string | IQueueNameConfig;
    message: any;
    options?: IQueueNameConfig;
  }>();

  constructor(
    logger: Logger,
    private connectionFactory: RxJsRabbitMqConnectionFactory,
    private concurrency: number = 10,
  ) {
    this.logger = createChildLogger(logger, 'RxJsRabbitMqPublisher');
    this.startPublishWorker();
  }

  /**
   * Publish a message - returns Observable for reactive error handling
   */
  public publish<T>(
    queue: string | IQueueNameConfig,
    message: T,
    options?: IQueueNameConfig,
  ): Observable<void> {
    const queueConfig = asPubSubQueueNameConfig(queue);

    return defer(() =>
      this.connectionFactory.getConnection$().pipe(
        switchMap((connection) => from(connection.createChannel())),
        switchMap(async (channel) => {
          if (options?.prefetch) {
            await channel.prefetch(options.prefetch, options.globalPrefetch);
          }
          await this.setupChannel(channel, queueConfig);
          return channel;
        }),
        switchMap((channel) =>
          this.publishToChannel(channel, queueConfig, message),
        ),
        tap(() => {
          this.logger.trace(
            "message sent to exchange '%s' (%j)",
            queueConfig.dlx,
            message,
          );
        }),
        catchError((err) => {
          this.logger.error(
            err,
            "unable to send message to exchange '%j'",
            queueConfig.dlx,
          );
          return throwError(() => new Error('Unable to send message'));
        }),
      ),
    );
  }

  /**
   * Start background worker to process publish queue with concurrency control
   */
  private startPublishWorker(): void {
    this.publishQueue$
      .pipe(
        mergeMap(
          ({ queue, message, options }) =>
            this.publish(queue, message, options).pipe(
              catchError((err) => {
                this.logger.error(err, 'failed to publish message');
                return EMPTY;
              }),
            ),
          this.concurrency, // Process up to N messages concurrently
        ),
      )
      .subscribe();
  }

  /**
   * Queue a message for publishing (useful for high-throughput scenarios)
   */
  public queuePublish<T>(
    queue: string | IQueueNameConfig,
    message: T,
    options?: IQueueNameConfig,
  ): void {
    this.publishQueue$.next({ queue, message, options });
  }

  private async setupChannel(
    channel: Channel,
    queueConfig: IQueueNameConfig,
  ): Promise<void> {
    await channel.assertExchange(queueConfig.dlx, 'fanout', {
      durable: true,
      autoDelete: true,
    });
  }

  private publishToChannel<T>(
    channel: Channel,
    queueConfig: IQueueNameConfig,
    message: T,
  ): Observable<void> {
    return defer(async () => {
      const buffer = Buffer.from(JSON.stringify(message), 'utf8');
      channel.publish(queueConfig.dlx, '', buffer);
      await channel.close();
    });
  }
}
