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
 private subscriptionMap: {
  [subId: number]: [string, (m: unknown) => Promise<void>];
 } = {};
 private subsRefsMap: { [trigger: string]: Array<number> } = {};
 private currentSubscriptionId: number = 0;
 private triggerTransform: TriggerTransform;
 private unsubscribeChannelMap: Record<string, IRabbitMqConsumerDisposer> = {};
 private logger: Logger;
 // Track in-progress subscriptions to prevent race conditions
 private pendingSubscriptions: Record<string, Promise<IRabbitMqConsumerDisposer>> = {};

 constructor(options: PubSubRabbitMQBusOptions = {}) {
  this.triggerTransform = options.triggerTransform || ((trigger) => trigger as string);
  const config = options.config || { host: '127.0.0.1', port: 5672 };
  const { logger } = options;

  this.logger = createChildLogger(logger, 'AmqpPubSub');

  const factory = new RabbitMqSingletonConnectionFactory(logger, config);

  this.consumer = new RabbitMqSubscriber(logger, factory);
  this.producer = new RabbitMqPublisher(logger, factory);
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
  const triggerName: string = this.triggerTransform(trigger, options);
  const id = this.currentSubscriptionId++;
  this.subscriptionMap[id] = [triggerName, onMessage];
  let refs = this.subsRefsMap[triggerName];

  if (refs && refs.length > 0) {
   const newRefs = [...refs, id];
   this.subsRefsMap[triggerName] = newRefs;
   this.logger.trace(
    "subscriber exist, adding triggerName '%s' to saved list.",
    triggerName,
   );
   return id;
  }

  // Check if there's already a pending subscription for this trigger
  if (this.pendingSubscriptions[triggerName]) {
   this.logger.trace(
    "subscription in progress for '%s', waiting for it to complete",
    triggerName,
   );

   try {
    const disposer = await this.pendingSubscriptions[triggerName];
    this.subsRefsMap[triggerName] = [...(this.subsRefsMap[triggerName] || []), id];
    this.unsubscribeChannelMap[triggerName] = disposer;
    return id;
   } catch (err) {
    this.logger.error(err, "failed to receive message from queue '%s'", triggerName);
    return id;
   }
  }

  this.logger.trace("trying to subscribe to queue '%s'", triggerName);
  // Create the subscription promise and store it immediately
  const subscriptionPromise = this.consumer.subscribe<string>(
   triggerName,
   (msg) => this.onMessage(triggerName, msg),
   options,
  );

  this.pendingSubscriptions[triggerName] = subscriptionPromise;

  try {
   const disposer = await subscriptionPromise;
   this.subsRefsMap[triggerName] = [...(this.subsRefsMap[triggerName] || []), id];
   this.unsubscribeChannelMap[triggerName] = disposer;

   // Clean up pending subscription
   delete this.pendingSubscriptions[triggerName];

   return id;
  } catch (err) {
   this.logger.error(err, "failed to receive message from queue '%s'", triggerName);
   return id;
  }
 }

 public unsubscribe(subId: number) {
  const [triggerName = null] = this.subscriptionMap[subId] || [];
  const refs = this.subsRefsMap[triggerName];

  if (!refs) {
   this.logger.error("There is no subscription of id '%s'", subId);
   throw new Error(`There is no subscription of id "${subId}"`);
  }

  let newRefs: number[];
  if (refs.length === 1) {
   newRefs = [];
   if (typeof this.unsubscribeChannelMap[triggerName] === 'function') {
    this.unsubscribeChannelMap[triggerName]()
     .then(() => {
      this.logger.trace("cancelled channel from subscribing to queue '%s'", triggerName);
      delete this.unsubscribeChannelMap[triggerName];
     })
     .catch((err) => {
      this.logger.error(err, "channel cancellation failed from queue '%j'", triggerName);
      delete this.unsubscribeChannelMap[triggerName];
     });
   }
  } else {
   const index = refs.indexOf(subId);
   if (index !== -1) {
    newRefs = [...refs.slice(0, index), ...refs.slice(index + 1)];
   } else {
    newRefs = refs;
   }
   this.logger.trace("removing triggerName from listening '%s' ", triggerName);
  }

  this.subsRefsMap[triggerName] = newRefs;
  delete this.subscriptionMap[subId];
  this.logger.trace("list of subscriptions still available '(%j)'", this.subscriptionMap);
 }

 public asyncIterator<T>(
  triggers: string | string[],
  options?: IQueueNameConfig,
 ): AsyncIterator<T> {
  return new PubSubAsyncIterator<T>(this, triggers, options);
 }

 private async onMessage(
  channel: string,
  message: string,
 ): Promise<IRabbitMqSubscriberDisposer> {
  const subscribers = this.subsRefsMap[channel];

  // Don't work for nothing..
  if (!subscribers || !subscribers.length) {
   return;
  }

  this.logger.trace("sending message to subscriber callback function '(%j)'", message);
  for (const subId of subscribers) {
   const [triggerName, listener] = this.subscriptionMap[subId];
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
