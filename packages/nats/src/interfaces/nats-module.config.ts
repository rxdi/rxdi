import { InjectionToken } from '@rxdi/core';
import { NatsConnection } from 'nats';
import { NatsLogger } from './nats-logger';

export interface NatsModuleConfiguration {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  servers?: string[];
  name?: string;
  pedantic?: boolean;
  maxReconnectAttempts?: number;
  reconnectTimeWait?: number;
  connectionTimeout?: number;
  timeout?: number;
  tls?: any;
  maxPayload?: number;
  logging?: boolean;
  logger?: NatsLogger;
  serviceName?: string;
}

export interface ServiceDiscoveryOptions {
  enabled?: boolean;
  monitorInterval?: number;
}

export interface NatsPubSubOptions {
  triggerTransform?: (trigger: string) => string;
  logger?: NatsLogger;
}

export const NATS_MODULE_CONFIG = new InjectionToken<NatsModuleConfiguration>('nats-module-config-injection-token');
export const NATS_CLIENT_SERVICE = new InjectionToken<NatsClientInterface>('nats-client-service-injection-token');
export const NATS_PUBSUB_SERVICE = new InjectionToken<NatsPubSubInterface>('nats-pubsub-service-injection-token');
export const GRAPHQL_NATS_PUBSUB = new InjectionToken<boolean>('graphql-nats-pubsub-injection-token');
export const NATS_LOGGER = new InjectionToken<NatsLogger>('nats-logger-injection-token');

export interface NatsClientInterface {
  connect(): Promise<void>;
  publish(channel: string, data: any): Promise<void>;
  subscribe(channel: string, callback: (msg: any) => void): Promise<number>;
  unsubscribe(subId: number): void;
  request(channel: string, data: any, timeout?: number): Promise<any>;
  close(): void;
  isReady(): boolean;
  getClient(): NatsConnection | null;
}

export interface NatsPubSubInterface {
  publish(trigger: string, payload: any): Promise<void>;
  subscribe<T>(trigger: string, onMessage: (m: T) => Promise<void>): Promise<number>;
  unsubscribe(subId: number): void;
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterator<T>;
}

export type Path = Array<string | number>;
export type Trigger = string | Path;
export type TriggerTransform = (trigger: Trigger) => string;