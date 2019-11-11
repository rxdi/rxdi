import { Inject, Plugin } from "@rxdi/core";
import { HAPI_SERVER, HAPI_CONFIG, HapiConfigModel } from "../../hapi.module.config";
import { Server } from "hapi";
import inert = require('inert');

@Plugin()
export class InertPlugin {

    constructor(
        @Inject(HAPI_SERVER) private server: Server,
        @Inject(HAPI_CONFIG) private config: HapiConfigModel
    ) {}

    OnInit() {
        this.register();
    }

    async register() {
        await this.registerInertPlugin();
        if (this.config.staticConfig) {
            this.server.route(this.config.staticConfig);
        }
    }

    async registerInertPlugin() {
        await this.server.register(inert);

    }

}