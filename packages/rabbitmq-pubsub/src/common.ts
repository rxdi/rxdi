export interface IQueueNameConfig {
  /**
   *  Set the prefetch count for this channel.
   *  The count given is the maximum number of messages
   *  sent over the channel that can be awaiting acknowledgement
   *  once there are count messages outstanding,
   *  the server will not send more messages on this channel
   *  until one or more have been acknowledged.
   *  A falsey value for count indicates no such limit.
   *  https://www.squaremobius.net/amqp.node/channel_api.html#channel_prefetch
   */
  prefetch?: number;

  /**
   *  If we set global to true we will apply prefetch count globally for the queue
   *  The count given is the maximum number of messages
   */
  globalPrefetch?: boolean;
  name: string;
  dlq: string;
  exchange: string;
  strictName?: boolean;
  arguments?: { [key: string]: any };
}

export class DefaultQueueNameConfig implements IQueueNameConfig {
  dlq: string;
  exchange: string;
  constructor(public name: string) {
    this.dlq = `${name}.DLQ`;
    this.exchange = `${this.dlq}.Exchange`;
  }
}

export class DefaultPubSubQueueConfig implements IQueueNameConfig {
  dlq: string;
  exchange: string;
  constructor(public name: string) {
    this.dlq = "";
    this.exchange = `${name}.Exchange`;
  }
}

export function asQueueNameConfig(
  config: IQueueNameConfig | string
): IQueueNameConfig {
  return isQueueNameConfig(config)
    ? config
    : new DefaultQueueNameConfig(config);
}

export function asPubSubQueueNameConfig(
  config: IQueueNameConfig | string
): IQueueNameConfig {
  return isQueueNameConfig(config)
    ? config
    : new DefaultPubSubQueueConfig(config);
}

function isQueueNameConfig(
  config: IQueueNameConfig | string
): config is IQueueNameConfig {
  if (
    (config as IQueueNameConfig).name &&
    (config as IQueueNameConfig).dlq &&
    (config as IQueueNameConfig).exchange
  ) {
    return true;
  }
}

export interface IDeadLetterMessage<T> {
  data: T;
  error: Error;
}

export const createQueueConfig = (
  name: string,
  options?: Partial<IQueueNameConfig>
): IQueueNameConfig => {
  const defaultConfig = {
    prefetch: 1,
    globalPrefetch: true,
    strictName: true,
  };
  const finalOptions = { ...defaultConfig, ...options };
  return {
    name,
    dlq: `${name}.DLQ`,
    exchange: `${name}.Exchange`,
    ...finalOptions,
    arguments: {
      'x-dead-letter-exchange': `${name}.DLQ`,
      'x-dead-letter-routing-key': `${name}.DLQ`,
      ...finalOptions.arguments,
    },
  };
};