import { InjectionToken } from "@rxdi/core";
import { PluginNameVersion, PluginBase, PluginPackage, ServerOptions, ServerRoute } from 'hapi';
export declare class HapiConfigModel {
    randomPort?: boolean;
    staticConfig?: ServerRoute | ServerRoute[];
    hapi?: ServerOptions;
    plugins?: Array<PluginBase<any> & (PluginNameVersion | PluginPackage)>;
}
export declare const HAPI_CONFIG: InjectionToken<HapiConfigModel>;
export declare const HAPI_SERVER: InjectionToken<any>;
export declare const HAPI_PLUGINS: InjectionToken<((PluginBase<any> & PluginNameVersion) | (PluginBase<any> & PluginPackage))[]>;
