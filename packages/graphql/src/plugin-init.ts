import {
  Plugin,
  PluginInterface,
  Inject,
  AfterStarterService
} from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { take, switchMap, tap } from 'rxjs/operators';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';
import { GraphQLHttpClient, GraphQLResponse } from './services'

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

@Plugin()
export class PluginInit implements PluginInterface {

  defaultQuery = `query { status { status } } `;

  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
    private afterStarter: AfterStarterService
  ) { }

  async register() {
    if (!this.config.initQuery) {
      return;
    }

    this.afterStarter.appStarted
      .pipe(
        take(1),
        switchMap(
          async () =>
            await this.sendRequest<{ status: { status: string } }>({
              query: this.defaultQuery
            })
        ),
        tap(res => this.checkStatus(res.data.status.status))
      )
      .subscribe();
  }

  sendRequest = <T>(
    request: SendRequestQueryType,
    url: string = `http://localhost:${this.server.info.port}/graphql`
  ): Promise<GraphQLResponse<T>> => {
    const client = new GraphQLHttpClient(url);

    return client.request(request);
  };

  async checkStatus(status: string) {
    if (status !== '200') {
      await this.server.stop();
      console.error(status);
      process.exit(1);
    }
  }
}
