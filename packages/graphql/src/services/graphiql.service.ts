import { PluginInterface, Inject, Service } from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { Server, ResponseToolkit } from 'hapi';
import * as GraphiQL from 'apollo-server-module-graphiql';

@Service()
export class GraphiQLService implements PluginInterface {
  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG
  ) {}

  OnInit() {
    if (!this.config || !this.config.graphiqlOptions) {
      throw new Error('Apollo Server GraphiQL requires options.');
    }
    this.register();
  }

  async register() {
    if (this.config.graphiql) {
      this.server.route({
        method: 'GET',
        path: this.config.graphiQlPath || '/graphiql',
        options: this.config.route,
        handler: this.handler
      });
    }
  }

  handler = async (request: Request, h: ResponseToolkit, err?: Error) => {
    const graphiqlString = await GraphiQL.resolveGraphiQLString(
      request['query'],
      this.config.graphiqlOptions,
      request
    );
    const response = h.response(graphiqlString);
    response.type('text/html');
    return response;
  };
}
