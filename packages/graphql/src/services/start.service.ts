import { Service, BootstrapLogger, Inject } from '@rxdi/core';
import { HAPI_SERVER, OpenService } from '@rxdi/hapi';
import { Server } from 'hapi';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';

@Service()
export class StartService {
  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
    private logger: BootstrapLogger,
    private openService: OpenService
  ) {}

  startBrowser() {
    this.openService.openPage(
      `http://${this.server.info.address}:${this.server.info.port}/devtools`
    );
    // this.openService.openPage(`http://${this.server.info.address}:${this.server.info.port}/graphiql`);
    // this.openService.openPage('http://localhost:4200');
    // this.openService.openGraphQLPage();
    this.logger.log('Browser started!');
  }
}
