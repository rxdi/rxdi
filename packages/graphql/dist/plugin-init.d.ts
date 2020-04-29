import { PluginInterface, AfterStarterService } from '@rxdi/core';
import { Server } from 'hapi';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
export interface Response<T> {
    raw: string;
    data: T;
    errors: Array<{
        message: string;
        name: string;
        time_thrown: string;
        data: {};
    }>;
    headers: {};
    status: number;
    success: boolean;
}
export interface SIGNITURE {
    token: string;
}
export interface SendRequestQueryType {
    query: string;
    variables?: any;
    signiture?: SIGNITURE;
}
export declare class PluginInit implements PluginInterface {
    private server;
    private config;
    private afterStarter;
    defaultQuery: string;
    constructor(server: Server, config: GRAPHQL_PLUGIN_CONFIG, afterStarter: AfterStarterService);
    private tester;
    register(): Promise<void>;
    sendRequest: <T>(request: SendRequestQueryType, url?: string) => PromiseLike<Response<T>>;
    checkStatus<T = {}>(request: Response<T>): Promise<void>;
}
