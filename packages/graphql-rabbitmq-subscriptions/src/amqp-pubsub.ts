import { Observable, Subject, defer, from, merge, EMPTY, throwError, using } from 'rxjs';
import {
 share,
 mergeMap,
 tap,
 catchError,
 finalize,
 retry,
 takeUntil,
 filter,
 map,
} from 'rxjs/operators';
import {
 RxJsRabbitMqConnectionFactory,
 RabbitMqPublisher,
 RabbitMqSubscriber,
 IRabbitMqConnectionConfig,
 IQueueNameConfig,
 IRabbitMqSubscriberDisposer,
} from '@rxdi/rabbitmq-pubsub';
import { createChildLogger, Logger } from './child-logger';

export interface PubSubRabbitMQBusOptions {
 config?: IRabbitMqConnectionConfig;
 connectionListener?: (err: Error) => void;
 triggerTransform?: TriggerTransform;
 logger?: Logger;
 retryAttempts?: number;
}

interface ChannelSubscription<T> {
 trigger: string;
 observable: Observable<T>;
 refCount: number;
}

export class AmqpPubSub {
 private producer: RabbitMqPublisher;
 private consumer: RabbitMqSubscriber;
 private logger: Logger;
 private triggerTransform: TriggerTransform;
 private destroy$ = new Subject<void>();

 // RxJS-based subscription management
 private channelStreams = new Map<string, Observable<any>>();
 private retryAttempts: number;

 constructor(options: PubSubRabbitMQBusOptions = {}) {
  this.triggerTransform = options.triggerTransform || ((trigger) => trigger as string);
  this.retryAttempts = options.retryAttempts ?? 3;
  const config = options.config || { host: '127.0.0.1', port: 5672 };
  const { logger } = options;

  this.logger = createChildLogger(logger, 'AmqpPubSub');

  const factory = new RxJsRabbitMqConnectionFactory(logger, config);

  this.consumer = new RabbitMqSubscriber(logger, factory);
  this.producer = new RabbitMqPublisher(logger, factory);
 }

 /**
  * Publish a message - returns Observable for better error handling
  */
 public publish<T>(
  trigger: string,
  payload: T,
  config?: IQueueNameConfig,
 ): Observable<void> {
  return defer(() => {
   this.logger.trace("publishing for queue '%s' (%j)", trigger, payload);
   return from(this.producer.publish(trigger, payload, config));
  }).pipe(
   retry(this.retryAttempts),
   catchError((err) => {
    this.logger.error(err, "failed to publish to queue '%s'", trigger);
    return throwError(() => err);
   }),
   takeUntil(this.destroy$),
  );
 }

 /**
  * Subscribe to a channel - returns Observable that auto-manages lifecycle
  */
 public subscribe<T>(
  trigger: string,
  options?: Partial<IQueueNameConfig>,
 ): Observable<T> {
  const triggerName = this.triggerTransform(trigger, options);

  // Return cached stream if it exists (multicast behavior)
  if (this.channelStreams.has(triggerName)) {
   this.logger.trace("reusing existing stream for '%s'", triggerName);
   return this.channelStreams.get(triggerName)!;
  }

  this.logger.trace("creating new stream for queue '%s'", triggerName);

  // Create a hot observable using share() for multicast behavior
  const stream$ = this.createChannelStream<T>(triggerName, options).pipe(
   share({
    connector: () => new Subject<T>(),
    resetOnError: false,
    resetOnComplete: false,
    resetOnRefCountZero: true,
   }),
  );

  this.channelStreams.set(triggerName, stream$);

  return stream$;
 }

 /**
  * Creates an observable stream from a RabbitMQ channel
  */
 private createChannelStream<T>(
  triggerName: string,
  options?: Partial<IQueueNameConfig>,
 ): Observable<T> {
  return using(
   // Resource factory: subscribe to RabbitMQ
   () => this.createRabbitMqSubscription<T>(triggerName, options) as never,
   // Observable factory: create stream from messages
   ({ observable, disposer }: any) =>
    observable.pipe(
     tap((msg) => {
      this.logger.trace("message received from queue '%s' (%j)", triggerName, msg);
     }),
     catchError((err) => {
      this.logger.error(err, "error processing message from queue '%s'", triggerName);
      return EMPTY;
     }),
     finalize(() => {
      this.logger.trace("stream finalized for queue '%s'", triggerName);
      this.channelStreams.delete(triggerName);
      // Dispose RabbitMQ subscription
      disposer().catch((err) =>
       this.logger.error(err, "error disposing channel '%s'", triggerName),
      );
     }),
    ),
  ).pipe(takeUntil(this.destroy$)) as never;
 }

 /**
  * Create RabbitMQ subscription and wrap it in an Observable
  */
 private createRabbitMqSubscription<T>(
  triggerName: string,
  options?: Partial<IQueueNameConfig>,
 ): {
  observable: Observable<T>;
  disposer: IRabbitMqSubscriberDisposer;
 } {
  const subject = new Subject<T>();
  let disposer: (() => Promise<void>) | null = null;

  // Subscribe to RabbitMQ
  this.consumer
   .subscribe<T>(
    triggerName,
    async (message) => {
     subject.next(message);
     return async () => {
      subject.unsubscribe();
     };
    },
    options,
   )
   .then((dispose) => {
    disposer = dispose;
    this.logger.trace("subscribed to queue '%s'", triggerName);
   })
   .catch((err) => {
    this.logger.error(err, "failed to subscribe to queue '%s'", triggerName);
    subject.error(err);
   });

  return {
   observable: subject.asObservable(),
   disposer: () => {
    subject.complete();
    return disposer ? disposer() : Promise.resolve();
   },
  };
 }

 /**
  * Create async iterator for GraphQL subscriptions compatibility
  */
 public asyncIterator<T>(
  triggers: string | string[],
  options?: IQueueNameConfig,
 ): AsyncIterator<T> {
  const triggerArray = Array.isArray(triggers) ? triggers : [triggers];

  // Merge multiple trigger observables
  const merged$ = merge(
   ...triggerArray.map((trigger) => this.subscribe<T>(trigger, options)),
  );

  return this.observableToAsyncIterator(merged$);
 }

 /**
  * Convert Observable to AsyncIterator for GraphQL compatibility
  */
 private observableToAsyncIterator<T>(observable: Observable<T>): AsyncIterator<T> {
  const pullQueue: Array<(result: IteratorResult<T>) => void> = [];
  const pushQueue: T[] = [];
  let listening = true;
  let subscription: any = null;

  // Subscribe to observable
  subscription = observable.subscribe({
   next: (value) => {
    if (pullQueue.length) {
     pullQueue.shift()!({ value, done: false });
    } else {
     pushQueue.push(value);
    }
   },
   error: (err) => {
    if (pullQueue.length) {
     pullQueue.shift()!({ value: undefined as any, done: true });
    }
    listening = false;
   },
   complete: () => {
    if (pullQueue.length) {
     pullQueue.shift()!({ value: undefined as any, done: true });
    }
    listening = false;
   },
  });

  return {
   next(): Promise<IteratorResult<T>> {
    if (!listening) {
     return Promise.resolve({ value: undefined as any, done: true });
    }

    if (pushQueue.length) {
     return Promise.resolve({ value: pushQueue.shift()!, done: false });
    }

    return new Promise((resolve) => pullQueue.push(resolve));
   },
   return(): Promise<IteratorResult<T>> {
    listening = false;
    if (subscription) {
     subscription.unsubscribe();
    }
    pullQueue.length = 0;
    pushQueue.length = 0;
    return Promise.resolve({ value: undefined as any, done: true });
   },
   throw(error: any): Promise<IteratorResult<T>> {
    listening = false;
    if (subscription) {
     subscription.unsubscribe();
    }
    return Promise.reject(error);
   },
  };
 }

 /**
  * Graceful shutdown - completes all streams
  */
 public async shutdown(): Promise<void> {
  this.logger.trace('shutting down AmqpPubSub');
  this.destroy$.next();
  this.destroy$.complete();
  this.channelStreams.clear();
 }
}

export type Path = Array<string | number>;
export type Trigger = string | Path;
export type TriggerTransform = (
 trigger: Trigger,
 channelOptions?: Partial<IQueueNameConfig>,
) => string;

/**
 * RxJS Operators for common PubSub patterns
 */
export class PubSubOperators {
 /**
  * Operator to filter messages by type
  */
 static filterByType<T extends { type: string }>(type: string) {
  return filter<T>((msg) => msg.type === type);
 }

 /**
  * Operator to extract message payload
  */
 static extractPayload<T extends { message: any }>() {
  return map<T, T['message']>((msg) => msg.message);
 }

 /**
  * Operator to add metadata to messages
  */
 static withMetadata<T>(metadata: Record<string, any>) {
  return map<T, T & { metadata: Record<string, any> }>((msg) => ({
   ...msg,
   metadata: { ...metadata, receivedAt: new Date() },
  }));
 }

 /**
  * Operator to batch messages by time window
  */
 static batch<T>(windowTime: number) {
  return (source: Observable<T>) =>
   source.pipe(
    // Implementation would use bufferTime
    // This is a placeholder for the pattern
    tap((msg) => console.log('Batching:', msg)),
   );
 }
}

/**
 * Example usage patterns:
 *
 * // Simple subscription
 * const messages$ = pubsub.subscribe<MyMessage>('my-channel');
 * messages$.subscribe(msg => console.log(msg));
 *
 * // With operators
 * pubsub.subscribe<MyMessage>('my-channel').pipe(
 *   PubSubOperators.filterByType('updated'),
 *   PubSubOperators.extractPayload(),
 *   tap(payload => console.log(payload))
 * ).subscribe();
 *
 * // Publishing
 * pubsub.publish('my-channel', { data: 'test' }).subscribe({
 *   next: () => console.log('Published'),
 *   error: (err) => console.error('Failed', err)
 * });
 *
 * // Multiple channels
 * const multi$ = merge(
 *   pubsub.subscribe('channel1'),
 *   pubsub.subscribe('channel2')
 * );
 *
 * // Graceful shutdown
 * await pubsub.shutdown();
 */
