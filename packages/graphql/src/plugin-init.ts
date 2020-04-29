import {
  Plugin,
  PluginInterface,
  Inject,
  AfterStarterService
} from '@rxdi/core';
import { tester } from 'graphql-tester';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from 'hapi';
import { take, switchMap, tap } from 'rxjs/operators';
import { GRAPHQL_PLUGIN_CONFIG } from './config.tokens';

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
  ) {}

  private tester;

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
        tap(res => this.checkStatus(res))
      )
      .subscribe();
  }

  sendRequest = <T>(
    request: SendRequestQueryType,
    url: string = `http://localhost:${this.server.info.port}/graphql`
  ): PromiseLike<Response<T>> => {
    this.tester = tester({
      url,
      contentType: 'application/json'
    });
    return this.tester(JSON.stringify(request));
  };

  async checkStatus<T = {}>(request: Response<T>) {
    if (request.status !== 200) {
      await this.server.stop();
      console.error(request);
      process.exit(1);
    }
  }
}
