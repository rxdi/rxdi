import { ModuleWithServices } from '@rxdi/core';
import { NEO4J_MODULE_CONFIG } from './injection.tokens';
export declare class Neo4JModule {
    static forRoot(config?: NEO4J_MODULE_CONFIG): ModuleWithServices;
    static forChild(types: string[] | Function[]): void;
}
export * from './injection.tokens';
export * from './services/index';
