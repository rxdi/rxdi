import { ModuleWithServices } from '@rxdi/core';
import { HapiConfigModel } from './hapi.module.config';
export declare class HapiModule {
    static forRoot(config?: HapiConfigModel): ModuleWithServices;
}
export * from './hapi.module.config';
export * from './plugins/index';
export * from './services/index';
