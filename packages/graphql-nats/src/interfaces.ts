export enum PubSubProtocol {
  DEFAULT = 'DEFAULT',
  NATS = 'NATS',
  RABBITMQ = 'RABBITMQ',
}

export interface NatsPubSubInterface {
  publish(trigger: string, payload: any): Promise<void>;
  subscribe<T>(trigger: string, onMessage: (m: T) => Promise<void>): Promise<number>;
  unsubscribe(subId: number): void;
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T>;
}