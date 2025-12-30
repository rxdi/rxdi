import { PubSubAsyncIterator } from './pubsub-async-iterator';
import {
  RabbitMqSingletonConnectionFactory,
  RabbitMqPublisher,
  RabbitMqSubscriber,
  IRabbitMqConnectionConfig,
  IRabbitMqConsumerDisposer,
  IRabbitMqSubscriberDisposer,
  IQueueNameConfig,
} from '@rxdi/rabbitmq-pubsub';
import { createChildLogger, Logger } from './child-logger';

export interface PubSubRabbitMQBusOptions {
  config?: IRabbitMqConnectionConfig;
  connectionListener?: (err: Error) => void;
  triggerTransform?: TriggerTransform;
  logger?: Logger;
}

export class AmqpPubSub {
  private consumer: RabbitMqSubscriber;
  private producer: RabbitMqPublisher;

  private subscriptionMap = new Map<
    number,
    [string, (m: unknown) => Promise<void>]
  >();

  private subsRefsMap = new Map<string, number[]>();

  private currentSubscriptionId = 0;

  private triggerTransform: TriggerTransform;

  private unsubscribeChannelMap = new Map<
    string,
    IRabbitMqConsumerDisposer
  >();

  // Track in-progress subscriptions to prevent race conditions
  private pendingSubscriptions = new Map<
    string,
    Promise<IRabbitMqConsumerDisposer>
  >();

  private logger: Logger;

  constructor(options: PubSubRabbitMQBusOptions = {}) {
    this.triggerTransform = options.triggerTransform || ((trigger) => trigger as string);
    const config = options.config || { host: '127.0.0.1', port: 5672 };

    this.logger = createChildLogger(options.logger, 'AmqpPubSub');

    const factory = new RabbitMqSingletonConnectionFactory(options.logger, config);

    this.consumer = new RabbitMqSubscriber(options.logger, factory);
    this.producer = new RabbitMqPublisher(options.logger, factory);
  }

  public async publish(
    trigger: string,
    payload: any,
    config?: IQueueNameConfig,
  ): Promise<void> {
    this.logger.trace("publishing for queue '%s' (%j)", trigger, payload);
    this.producer.publish(trigger, payload, config);
  }

  public async subscribe<T>(
    trigger: string,
    onMessage: (m: T) => Promise<void>,
    options?: Partial<IQueueNameConfig>,
  ): Promise<number> {
    const triggerName = this.triggerTransform(trigger, options);
    const id = this.currentSubscriptionId++;

    this.subscriptionMap.set(id, [triggerName, onMessage]);

    const refs = this.subsRefsMap.get(triggerName);

    if (refs?.length) {
      this.subsRefsMap.set(triggerName, [...refs, id]);
      this.logger.trace(
        "subscriber exists, adding triggerName '%s' to saved list.",
        triggerName,
      );
      return id;
    }

    // Subscription already in progress
    const pending = this.pendingSubscriptions.get(triggerName);
    if (pending) {
      this.logger.trace(
        "subscription in progress for '%s', waiting for it to complete",
        triggerName,
      );

      try {
        const disposer = await pending;
        const nextRefs = [...(this.subsRefsMap.get(triggerName) || []), id];
        this.subsRefsMap.set(triggerName, nextRefs);
        this.unsubscribeChannelMap.set(triggerName, disposer);
        return id;
      } catch (err) {
        this.logger.error(err, "failed to receive message from queue '%s'", triggerName);
        return id;
      }
    }

    this.logger.trace("trying to subscribe to queue '%s'", triggerName);

    const subscriptionPromise = this.consumer.subscribe<string>(
      triggerName,
      (msg) => this.onMessage(triggerName, msg),
      options,
    );

    this.pendingSubscriptions.set(triggerName, subscriptionPromise);

    try {
      const disposer = await subscriptionPromise;
      this.subsRefsMap.set(triggerName, [...(this.subsRefsMap.get(triggerName) || []), id]);
      this.unsubscribeChannelMap.set(triggerName, disposer);
      this.pendingSubscriptions.delete(triggerName);

      return id;
    } catch (err) {
      this.logger.error(err, "failed to receive message from queue '%s'", triggerName);
      this.pendingSubscriptions.delete(triggerName);
      return id;
    }
  }

  public unsubscribe(subId: number) {
    const entry = this.subscriptionMap.get(subId);
    const triggerName = entry?.[0];

    if (!triggerName) {
      this.logger.error("There is no subscription of id '%s'", subId);
      throw new Error(`There is no subscription of id "${subId}"`);
    }

    const refs = this.subsRefsMap.get(triggerName);
    if (!refs) return;

    if (refs.length === 1) {
      const disposer = this.unsubscribeChannelMap.get(triggerName);
      if (typeof disposer === 'function') {
        disposer()
          .then(() => {
            this.logger.trace(
              "cancelled channel from subscribing to queue '%s'",
              triggerName,
            );
          })
          .catch((err) => {
            this.logger.error(
              err,
              "channel cancellation failed from queue '%s'",
              triggerName,
            );
          })
          .finally(() => {
            this.unsubscribeChannelMap.delete(triggerName);
          });
      }

      this.subsRefsMap.delete(triggerName);
    } else {
      this.subsRefsMap.set(
        triggerName,
        refs.filter((id) => id !== subId),
      );
      this.logger.trace(
        "removing triggerName from listening '%s'",
        triggerName,
      );
    }

    this.subscriptionMap.delete(subId);
    this.logger.trace(
      "list of subscriptions still available '(%j)'",
      Array.from(this.subscriptionMap.entries()),
    );
  }

  /* Old version before 3.0.0 of async iterator inside graphql-subscriptions */
  public asyncIterator<T>(
    triggers: string | string[],
    options?: IQueueNameConfig,
  ): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers, options);
  }

  /* New version of graphql-subscriptions async iterator */
  public asyncIterableIterator<T>(
    triggers: string | string[],
    options?: IQueueNameConfig,
  ): AsyncIterator<T> {
    return new PubSubAsyncIterator<T>(this, triggers, options);
  }

  private async onMessage(
    channel: string,
    message: string,
  ): Promise<IRabbitMqSubscriberDisposer> {
    const subscribers = this.subsRefsMap.get(channel);

    if (!subscribers?.length) return;

    this.logger.trace(
      "sending message to subscriber callback function '(%j)'",
      message,
    );

    for (const subId of subscribers) {
      const entry = this.subscriptionMap.get(subId);
      if (!entry) continue;

      const [, listener] = entry;
      await listener(message);
    }
  }
}

export type Path = Array<string | number>;
export type Trigger = string | Path;
export type TriggerTransform = (
  trigger: Trigger,
  channelOptions?: Partial<IQueueNameConfig>,
) => string;
