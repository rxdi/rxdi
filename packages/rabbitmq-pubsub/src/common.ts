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
  dlx: string;
}

export class DefaultQueueNameConfig implements IQueueNameConfig {
  dlq: string;
  dlx: string;
  constructor(public name: string) {
    this.dlq = `${name}.DLQ`;
    this.dlx = `${this.dlq}.Exchange`;
  }
}

export class DefaultPubSubQueueConfig implements IQueueNameConfig {
  dlq: string;
  dlx: string;
  constructor(public name: string) {
    this.dlq = "";
    this.dlx = `${name}.DLQ.Exchange`;
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
    (config as IQueueNameConfig).dlx
  ) {
    return true;
  }
}
