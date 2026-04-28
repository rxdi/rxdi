# @rxdi/nats

NATS messaging module for @rxdi/core framework with decorators for service-to-service communication.

## Overview

This module provides NATS integration with three main decorators:

- **`@NatsCall`** - Request/reply handler (subscribes to channel, called when NATS request arrives)
- **`@NatsEmit`** - Fire-and-forget event publishing (wraps method + publishes result)
- **`@NatsListener`** - Event subscription handler (subscribes to channel, called when NATS event arrives)

## Installation

```bash
npm install @rxdi/nats
```

## Quick Start

```typescript
import { Module } from '@rxdi/core';
import { NatsModule } from '@rxdi/nats';

@Module({
  imports: [
    NatsModule.forRoot({
      servers: ['nats://localhost:4222'],
      name: 'my-service',
      logging: true, // Enable debug logging
    }),
  ],
})
export class AppModule {}
```

## Configuration

### NatsModuleConfiguration

```typescript
interface NatsModuleConfiguration {
  host?: string;           // NATS host (default: localhost)
  port?: number;           // NATS port (default: 4222)
  servers?: string[];       // Array of NATS server URLs
  name?: string;             // Service name for NATS connection
  user?: string;             // NATS username
  pass?: string;            // NATS password
  logging?: boolean;        // Enable/disable logging (default: false)
  logger?: NatsLogger;      // Custom logger implementation
  serviceName?: string;      // Service name for queue groups
  maxReconnectAttempts?: number;
  reconnectTimeWait?: number;
  timeout?: number;
}
```

### Example with full configuration:

```typescript
NatsModule.forRoot({
  servers: ['nats://nats-1:4222', 'nats://nats-2:4222'],
  name: 'crash-game-backend',
  logging: true,
  maxReconnectAttempts: -1, // Infinite reconnect
})
```

## Decorators

### @NatsCall

**Purpose:** Request/reply handler - the decorated method is called when a NATS request arrives on the channel. The return value is sent as the reply.

**Important:** `@NatsCall` does NOT send NATS requests when you call the method. It sets up a subscription to handle incoming requests.

```typescript
import { Service } from '@rxdi/core';
import { NatsCall } from '@rxdi/nats';

@Service()
export class WalletService {
  // This method is called when external NATS client sends request to 'wallet.balance.get'
  @NatsCall({ channel: 'wallet.balance.get', timeout: 5000 })
  async getBalance({ playerId }: { playerId: string }) {
    return {
      playerId,
      balance: 1000,
      currency: 'USD'
    };
  }
}
```

**Options:**
- `channel: string` - NATS subject to subscribe to
- `timeout?: number` - Request timeout in ms (default: 30000)
- `queueGroup?: string` - Queue group for scaling (default: undefined)

**How it works:**
1. Decorator subscribes to `wallet.balance.get` channel
2. When a NATS request arrives, the decorated method is called
3. The return value is automatically sent as the reply to the caller

### To send NATS requests from your code:

```typescript
import { NatsClientService } from '@rxdi/nats';

@Controller()
export class WalletController {
  constructor(private natsClient: NatsClientService) {}

  async getBalance(playerId: string) {
    // Use natsClient.request() to send requests
    const result = await this.natsClient.request('wallet.balance.get', { playerId });
    return result;
  }
}
```

### @NatsEmit

**Purpose:** Fire-and-forget event publishing - when you call the method, it executes and ALSO publishes the result to NATS.

```typescript
import { Service } from '@rxdi/core';
import { NatsEmit } from '@rxdi/nats';

@Service()
export class GameService {
  // When called, it executes the method AND publishes to 'game.crash'
  @NatsEmit({ channel: 'game.crash', fireAndForget: true })
  async publishCrashEvent({ crashPoint, timestamp }: { crashPoint: number; timestamp: number }) {
    console.log(`Publishing crash: ${crashPoint}`);
    return { crashPoint, timestamp }; // This becomes the NATS payload
  }
}

// Usage:
const result = await gameService.publishCrashEvent({ crashPoint: 2.5, timestamp: Date.now() });
// console output: "Publishing crash: 2.5"
// NATS publishes: { crashPoint: 2.5, timestamp: ... } to 'game.crash'
```

**Options:**
- `channel: string` - NATS subject to publish to
- `fireAndForget: boolean` - If true, returns method result; if false, returns `{ success: true, channel, data }`

**How it works:**
1. Call the decorated method
2. The method executes normally (you get the return value)
3. The return value (or args if no return) is published to the channel

### @NatsListener

**Purpose:** Event handler - subscribes to a channel. When a NATS message arrives, the decorated method is called. No reply is sent.

```typescript
import { Service } from '@rxdi/core';
import { NatsListener } from '@rxdi/nats';

@Service()
export class NotificationService {
  // This is called when NATS message arrives on 'player.joined'
  @NatsListener({ channel: 'player.joined', queueGroup: 'notifications' })
  async onPlayerJoined({ playerId, tableId }: { playerId: string; tableId: string }) {
    console.log(`Player ${playerId} joined table ${tableId}`);
  }
}
```

**Options:**
- `channel: string` - NATS subject to subscribe to
- `queueGroup?: string` - Queue group for scaling

**How it works:**
1. Decorator subscribes to `player.joined` channel
2. When a NATS message arrives, the decorated method is called with the payload
3. No reply is sent back to NATS

## Scaling with Queue Groups

When running multiple instances of your service, use queue groups to distribute messages:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Instance 1 │     │  Instance 2 │     │  Instance 3 │
│  @Listener  │     │  @Listener  │     │  @Listener  │
│ queue: "svc" │     │ queue: "svc" │     │ queue: "svc" │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                    ┌───────────────┐
                    │   NATS        │
                    │ Round Robin   │
                    └───────────────┘
```

**Without queue group:** All instances receive every message (fan-out)

**With queue group:** Messages are distributed round-robin (load balancing)

```typescript
// All instances use same queue group - only one instance receives each message
@NatsListener({ channel: 'game.crash', queueGroup: 'crash-handlers' })
async onGameCrash(data) { }
```

## Logging

Logging is disabled by default. Enable it in module config:

```typescript
NatsModule.forRoot({
  servers: ['nats://localhost:4222'],
  logging: true,
})
```

Log levels:
- `debug` - Subscription registration, message flow
- `info` - Connection status, handler setup
- `warn` - Connection issues, missing clients
- `error` - Handler errors, connection failures

### Custom Logger

```typescript
import { NatsLogger, NatsLogLevel } from '@rxdi/nats';

class CustomLogger implements NatsLogger {
  debug(message: string, ...args: any[]) {
    console.debug(`[CUSTOM] ${message}`, ...args);
  }
  info(message: string, ...args: any[]) {
    console.log(`[CUSTOM] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]) {
    console.warn(`[CUSTOM] ${message}`, ...args);
  }
  error(message: string, ...args: any[]) {
    console.error(`[CUSTOM] ${message}`, ...args);
  }
}

NatsModule.forRoot({
  servers: ['nats://localhost:4222'],
  logger: new CustomLogger(),
})
```

## Complete Example

### Service Definition

```typescript
// wallet.service.ts
import { Service } from '@rxdi/core';
import { NatsCall, NatsListener, NatsEmit } from '@rxdi/nats';

@Service()
export class WalletService {
  // Handler for incoming NATS requests - returns balance
  @NatsCall({ channel: 'wallet.balance.get', timeout: 5000, queueGroup: 'wallet-service' })
  async getBalance({ playerId }: { playerId: string }) {
    console.log(`Getting balance for player: ${playerId}`);
    return {
      playerId,
      balance: Math.random() * 10000,
      currency: 'USD'
    };
  }

  // Handler for incoming NATS events - logs transactions
  @NatsListener({ channel: 'wallet.transaction.created', queueGroup: 'wallet-service' })
  async onTransactionCreated({ transactionId, amount }: { transactionId: string; amount: number }) {
    console.log(`Transaction created: ${transactionId}`);
  }

  // Emits events when called - publishes balance changes
  @NatsEmit({ channel: 'wallet.balance.changed', fireAndForget: true })
  async notifyBalanceChange({ playerId, newBalance }: { playerId: string; newBalance: number }) {
    console.log(`Balance changed for ${playerId}: ${newBalance}`);
    return { playerId, newBalance, timestamp: Date.now() };
  }
}
```

### Controller with GraphQL Mutation

```typescript
// wallet.controller.ts
import { Controller, Query, Mutation, Type, GraphQLString, GraphQLFloat } from '@gapi/core';
import { WalletService } from './wallet.service';
import { NatsClientService } from '@rxdi/nats';

@Controller()
export class WalletController {
  constructor(
    private walletService: WalletService,
    private natsClient: NatsClientService
  ) {}

  // Send NATS request to get balance (external service handles it)
  @Type(GraphQLString)
  @Mutation()
  async getPlayerBalance({ playerId }: { playerId: string }): Promise<string> {
    const balance = await this.natsClient.request('wallet.balance.get', { playerId });
    return JSON.stringify(balance);
  }

  // Call notifyBalanceChange - it will execute and publish to NATS
  @Type(GraphQLString)
  @Mutation()
  async triggerBalanceNotification({ playerId, amount }: { playerId: string; amount: number }): Promise<string> {
    const result = await this.walletService.notifyBalanceChange({ playerId, newBalance: amount });
    return JSON.stringify(result);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NATS Server                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ External │  │ External │  │ External │  │ External │        │
│  │ Client   │  │ Client   │  │ Client   │  │ Client   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │              │
│       └─────────────┼─────────────┼─────────────┘              │
│                     ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Your Service                          │   │
│  │                                                          │   │
│  │  @NatsCall        @NatsEmit         @NatsListener       │   │
│  │  (handler)        (publisher)       (subscriber)       │   │
│  │                                                          │   │
│  │  NatsClientService ◄───────── listens to requests      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Token Exports

```typescript
import {
  NATS_MODULE_CONFIG,
  NATS_CLIENT_SERVICE,
  NATS_PUBSUB_SERVICE,
  NATS_LOGGER,
  NatsLogger,
  NatsModuleConfiguration,
} from '@rxdi/nats';
```

## Error Handling

```typescript
@NatsCall({ channel: 'wallet.create', timeout: 5000 })
async createWallet(params) {
  try {
    return await this.walletService.createWallet(params);
  } catch (error) {
    return { error: error.message }; // Errors are sent back as response
  }
}
```

## Best Practices

1. **Use queue groups** for scalable services to prevent duplicate message processing
2. **Set appropriate timeouts** for `@NatsCall` based on expected processing time
3. **Enable logging** during development, disable in production
4. **Handle errors** in decorated methods to return meaningful error responses
5. **Use descriptive channel names** following `service.resource.action` pattern

## Channel Naming Convention

Recommended pattern: `domain.resource.action`

```
wallet.balance.get        - Get balance (request/reply)
wallet.balance.updated    - Balance changed (event)
game.crash.event         - Game crashed (event)
player.joined             - Player joined (event)
```

## License

MIT