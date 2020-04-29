import { GRAPHQL_PUB_SUB_DI_CONFIG } from '../config.tokens';
export declare class PubSubLogger {
    private config;
    child: () => PubSubLogger;
    constructor(config: GRAPHQL_PUB_SUB_DI_CONFIG);
    private logger;
    trace(log: string, channel: string, data: any): void;
    debug(log: string, channel: string, data: any): void;
    error(log: string, channel: string, data: any): void;
}
