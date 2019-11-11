import { Injectable, Inject } from '@angular/core';

@Injectable()
export class ServerService {
    address: string;
    port: number;
    constructor(
        @Inject('ServerConfig') private config: {config: {hapi: {port: number; address: string}}}
    ) {
        if (config.config && config.config.hapi) {
            this.address = config.config.hapi.address;
            this.port = config.config.hapi.port;
        }
    }
}
