import { PluginInterface } from "@rxdi/core";
import { ServerService } from "../services/server/server.service";
export declare class HapiPlugin implements PluginInterface {
    private server;
    constructor(server: ServerService);
    register(): Promise<void>;
}
