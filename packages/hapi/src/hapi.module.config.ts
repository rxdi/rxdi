import { Container, InjectionToken } from "@rxdi/core";
import { PluginNameVersion, PluginBase, PluginPackage, ServerOptions, ServerRoute, Server, RouteDefMethods } from '@hapi/hapi';

export class HapiConfigModel {
  randomPort?: boolean;
  staticConfig?: ServerRoute | ServerRoute[] = {
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: 'public',
        index: ['index.html', 'default.html']
      }
    }
  };
  hapi?: ServerOptions;
  plugins?: Array<PluginBase<any, any> & (PluginNameVersion | PluginPackage)>;

}

export const HAPI_CONFIG = new InjectionToken<HapiConfigModel>('hapi-config-injection-token');
export const HAPI_SERVER = new InjectionToken<any>('hapi-server-injection-token');
export const HAPI_PLUGINS = new InjectionToken<Array<PluginBase<any, any> & (PluginNameVersion | PluginPackage)>>('hapi-plugins-injection-token');

export const Route = ({ method, path }: { path: string; method: RouteDefMethods }) => (
  target: unknown,
  key: string,
  descriptor: PropertyDescriptor,
) => {
  const handler = descriptor.value.bind(target);
  descriptor.value = function (...args) {
    return handler(...args);
  };
  (Container.get(HAPI_SERVER) as Server).route({
    method,
    path,
    handler: (r, h) => descriptor.value(r, h),
  });
};
