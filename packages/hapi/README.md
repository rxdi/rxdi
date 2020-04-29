# @rxdi Hapi Module

##### More information about Hapi server can be found here [Hapi](https://hapijs.com/)
##### For questions/issues you can write ticket [here](http://gitlab.youvolio.com/rxdi/hapi/issues)
##### This module is intended to be used with [rxdi](https://github.com/rxdi/core)

## Installation and basic examples:
##### To install this Gapi module, run:

```bash
$ npm install @rxdi/hapi --save
```

## Consuming @rxdi/hapi

##### Import inside AppModule or CoreModule
```typescript
import { Module } from "@rxdi/core";
import { HapiModule } from "@rxdi/hapi";

@Module({
    imports: [
        HapiModule.forRoot({
            hapi: {
                port: 9000
            }
        })
    ]
})
export class CoreModule {}
```

Create Hapi plugin
Note: To use it plugin needs to be imported inside `plugins` otherwise can be @Service read down

```typescript


import { PluginInterface, Inject, Module, Plugin } from '@rxdi/core';
import { UserService } from './services';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from 'hapi';

@Plugin()
export class TestHapiService implements PluginInterface {

    constructor(
        @Inject(HAPI_SERVER) private server: Server
    ) {}

    async register() {
        this.server.route({
            method: 'GET',
            path: '/test',
            handler: this.handler.bind(this)
        });
    }

    async handler(request, h) {
        return 'dadda2';
    }

}

@Module({
    plugins: [TestHapiService],
})
export class UserModule { }
```

If you don't want to import it like a plugin you can set it as a @Service and import it inside `services` 
One downside is that you need to trigger `register()` method on constructor initialization like so because you will not get your route added to hapi.

```typescript
import { PluginInterface, Inject, Service, Module } from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from 'hapi';

@Service()
export class TestHapiService implements PluginInterface {

    constructor(
        @Inject(HAPI_SERVER) private server: Server
    ) {
        this.register();
    }

    async register() {
        this.server.route({
            method: 'GET',
            path: '/test',
            handler: this.handler.bind(this)
        });
    }

    async handler(request, h) {
        return 'dada1';
    }

}

@Module({
    services: [TestHapiService]
})
export class UserModule { }
```


TODO: Better documentation...

Enjoy ! :)
