import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { AfterStarterService, Inject, Plugin, PluginInterface } from '@rxdi/core';
import { renderAltair } from 'altair-static';
import { take } from 'rxjs';

import { AltairConfig } from './altair.tokens';

@Plugin()
export class AltairPlugin implements PluginInterface {
 constructor(
  @Inject(HAPI_SERVER) private server: Server,
  @Inject(AltairConfig) private config: AltairConfig,
  private afterStarterService: AfterStarterService,
 ) {}

 async register() {
  this.server.route({
   method: 'GET',
   path: '/altair',
   handler: (request, h) => h.response(renderAltair(this.config)).type('text/html'),
  });
  this.afterStarterService.appStarted.pipe(take(1)).subscribe(() => {
   console.log(
    `Altair playground started at http://localhost:${this.server.info.port}/altair`,
   );
  });
 }
}
