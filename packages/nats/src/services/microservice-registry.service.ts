import { Service } from '@rxdi/core';
import { Observable, Subject } from 'rxjs';
import { NatsClientService } from './nats-client.service';

export interface MicroserviceEndpoint {
  serviceName: string;
  channel: string;
  methods: string[];
}

@Service()
export class MicroserviceRegistry {
  private endpoints: Map<string, MicroserviceEndpoint> = new Map();
  private registryUpdate$ = new Subject<MicroserviceEndpoint[]>();

  constructor(private natsClient: NatsClientService) {}

  registerEndpoint(serviceName: string, channel: string, methods: string[]): void {
    const endpoint: MicroserviceEndpoint = { serviceName, channel, methods };
    this.endpoints.set(serviceName, endpoint);
    this.registryUpdate$.next(this.getAllEndpoints());
  }

  unregisterEndpoint(serviceName: string): void {
    this.endpoints.delete(serviceName);
    this.registryUpdate$.next(this.getAllEndpoints());
  }

  getEndpoint(serviceName: string): MicroserviceEndpoint | undefined {
    return this.endpoints.get(serviceName);
  }

  getAllEndpoints(): MicroserviceEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getRegistryUpdates(): Observable<MicroserviceEndpoint[]> {
    return this.registryUpdate$.asObservable();
  }

  async broadcastRegistration(serviceName: string, channel: string, methods: string[]): Promise<void> {
    await this.natsClient.publish('microservice.registry.register', {
      serviceName,
      channel,
      methods,
      timestamp: Date.now(),
    });
  }

  async broadcastUnregistration(serviceName: string): Promise<void> {
    await this.natsClient.publish('microservice.registry.unregister', {
      serviceName,
      timestamp: Date.now(),
    });
  }
}