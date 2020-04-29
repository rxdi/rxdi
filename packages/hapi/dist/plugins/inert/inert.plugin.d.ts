import { HapiConfigModel } from "../../hapi.module.config";
import { Server } from "hapi";
export declare class InertPlugin {
    private server;
    private config;
    constructor(server: Server, config: HapiConfigModel);
    OnInit(): void;
    register(): Promise<void>;
    registerInertPlugin(): Promise<void>;
}
