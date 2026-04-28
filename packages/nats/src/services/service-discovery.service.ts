import { Injectable, Inject, OnInit } from '@rxdi/core';
import { NatsModuleConfiguration, NATS_MODULE_CONFIG } from '../interfaces';

@Injectable()
export class ServiceDiscoveryService implements OnInit {
  private discoveredServers: string[] = [];
  private monitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(
    @Inject(NATS_MODULE_CONFIG) private config: NatsModuleConfiguration
  ) {}

  OnInit(): void {}

  async discoverServers(getClient: () => any): Promise<string[]> {
    const client = getClient();
    if (!client) {
      return this.config.servers || [];
    }

    try {
      const serverInfo: any = client.info();
      if (serverInfo && serverInfo.connect_urls) {
        this.discoveredServers = serverInfo.connect_urls.map((url: string) => `nats://${url}`);
      }
    } catch (e) {
      console.warn('Service discovery: Could not fetch server info', e);
    }

    return this.discoveredServers;
  }

  async startMonitoring(getClientFn: () => any, intervalMs = 30000): Promise<void> {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.monitorInterval = setInterval(async () => {
      const client = getClientFn();
      if (client) {
        await this.discoverServers(() => client);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.isMonitoring = false;
    }
  }

  getDiscoveredServers(): string[] {
    return [...this.discoveredServers];
  }
}