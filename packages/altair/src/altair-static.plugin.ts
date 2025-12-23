import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { Inject, Plugin, PluginInterface } from '@rxdi/core';

@Plugin()
export class AltairStaticsPlugin implements PluginInterface {
  constructor(@Inject(HAPI_SERVER) private server: Server) {}

  async register() {
    this.server.route({
      method: 'GET',
      path: '/altair/{param*}',
      handler: {
        directory: {
          path: './node_modules/altair-static/build/dist',
        },
      },
    });
  }
}
