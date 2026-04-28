import { Injectable, Inject, OnInit } from '@rxdi/core';
import { connect, NatsConnection, ConnectionOptions } from 'nats';
import { NatsModuleConfiguration, NATS_MODULE_CONFIG } from '../interfaces';

@Injectable()
export class NatsClientService implements OnInit {
  private client: NatsConnection | null = null;
  private subscriptions: Map<number, { sub: any; callback: (msg: any) => void }> = new Map();
  private subscriptionId = 0;
  private isConnected = false;

  constructor(
    @Inject(NATS_MODULE_CONFIG) private config: NatsModuleConfiguration
  ) {}

  OnInit(): void {
    this.connect().catch((error: unknown) => {
      const err = error as Error;
      console.log('[NatsClientService] Initial connection failed:', err.message);
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const options: ConnectionOptions = {
        name: this.config?.name || 'rxdi-nats-client',
        maxReconnectAttempts: this.config?.maxReconnectAttempts ?? -1,
        reconnect: true,
      };

      if (this.config?.user && this.config?.pass) {
        options.user = this.config.user;
        options.pass = this.config.pass;
      }

      let servers = this.config?.servers;
      if (!servers || servers.length === 0) {
        servers = [`nats://${this.config?.host || 'localhost'}:${this.config?.port || 4222}`];
      }

      options.servers = servers;
      this.client = await connect(options);
      this.isConnected = true;
      console.log('[NatsClientService] Connected to NATS!');
    } catch (error: unknown) {
      const err = error as Error;
      console.log('[NatsClientService] Connection failed:', err.message);
    }
  }

  async publish(channel: string, data: any): Promise<void> {
    if (!this.client) {
      console.warn('[NatsClientService] Client not connected');
      return;
    }
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (msg: any) => void): Promise<number> {
    if (!this.client) {
      console.warn('[NatsClientService] Client not connected');
      return -1;
    }
    const sub = this.client.subscribe(channel);
    const id = ++this.subscriptionId;
    this.subscriptions.set(id, { sub, callback });

    (async () => {
      try {
        for await (const msg of sub) {
          try {
            const data = msg.data ? JSON.parse(msg.data.toString()) : null;
            callback(data);
          } catch {
            callback(msg.data.toString());
          }
        }
      } catch {
        // Subscription closed
      }
    })();

    return id;
  }

  unsubscribe(subId: number): void {
    const entry = this.subscriptions.get(subId);
    if (entry) {
      entry.sub.unsubscribe();
      this.subscriptions.delete(subId);
    }
  }

  async request(channel: string, data: any, timeout = 30000): Promise<any> {
    if (!this.client) {
      throw new Error('NATS client is not connected');
    }
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const response = await this.client.request(channel, message, { timeout });
    if (response.data) {
      try {
        return JSON.parse(response.data.toString());
      } catch {
        return response.data.toString();
      }
    }
    return null;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
    }
  }

  isReady(): boolean {
    return this.isConnected && !!this.client;
  }

  getClient(): NatsConnection | null {
    return this.client;
  }
}