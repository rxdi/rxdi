/// <reference types="node" />
import { PluginInterface, ExitHandlerService, AfterStarterService } from '@rxdi/core';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Server as HapiServer } from 'hapi';
import { Subject, Observable } from 'rxjs';
import { StartService } from './start.service';
export declare class ServerPushPlugin implements PluginInterface {
    private config;
    private server;
    private exitHandler;
    private afterStarterService;
    private startService;
    serverWatcher: Server;
    connected: boolean;
    sendToClient: Subject<any>;
    sendTime: Subject<boolean>;
    clientConnected: Subject<boolean>;
    constructor(config: GRAPHQL_PLUGIN_CONFIG, server: HapiServer, exitHandler: ExitHandlerService, afterStarterService: AfterStarterService, startService: StartService);
    waitXSeconds(sec: any): Observable<any>;
    register(): Promise<void>;
    stopServerWatcher(): Promise<unknown>;
    createServerWatcher(): void;
    OnRequest(req: IncomingMessage, res: ServerResponse): void;
}
