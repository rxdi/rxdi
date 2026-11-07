import {
  Plugin,
  PluginInterface,
  Inject,
  AfterStarterService
} from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { defer, EMPTY, from, Observable } from 'rxjs';
import { catchError, map, retry, switchMap, take, tap } from 'rxjs/operators';
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

  /**
   * Boot self-check: query `status` on THIS process once the app started and
   * exit if the schema does not answer 200.
   *
   * - Listening (`mode: 'server'`): an HTTP request to the port this server
   *   really bound.
   * - Not listening (`mode: 'lambda'`: routes are only initialized and
   *   requests arrive through `server.inject`): the same request in-process.
   *   Before, it was sent to `localhost:<configured port>` - i.e. to whatever
   *   other process owned that port - and crashed this one when nothing did.
   * - A check that cannot be delivered (network error, a reply that is not
   *   GraphQL) is retried, then logged - it never kills the process. A
   *   GraphQL answer from our own server without status 200 still exits:
   *   the schema is broken.
   */
  async register() {
    if (!this.config.initQuery) {
      return;
    }

    this.afterStarter.appStarted
      .pipe(
        take(1),
        switchMap(() =>
          defer(() => this.selfCheck()).pipe(
            map(res => {
              if (
                !res ||
                typeof res !== 'object' ||
                (!('data' in res) && !('errors' in res))
              ) {
                // Not a GraphQL answer (e.g. a 404 body): nothing to judge.
                throw new Error(`unexpected reply ${JSON.stringify(res)}`);
              }
              return res;
            }),
            retry({ count: 3, delay: 500 })
          )
        ),
        tap(res => this.checkStatus(res.data?.status?.status)),
        catchError(e => {
          console.error(
            '[@rxdi/graphql] init self-check could not run:',
            e?.message ?? e
          );
          return EMPTY;
        })
      )
      .subscribe();
  }

  /** `query { status { status } }` against this very server. */
  selfCheck(): Observable<GraphQLResponse<{ status: { status: string } }>> {
    const query = { query: this.defaultQuery };
    if (this.server.info.started) {
      return from(
        this.sendRequest<{ status: { status: string } }>(
          query,
          `http://localhost:${this.server.info.port}${this.path}`
        )
      );
    }
    return from(
      this.server.inject({
        method: 'POST',
        url: this.path,
        headers: { 'content-type': 'application/json' },
        payload: query
      })
    ).pipe(
      switchMap(async res => {
        const body =
          typeof res.result === 'object' && res.result !== null
            ? res.result
            : JSON.parse(res.payload);
        return body as GraphQLResponse<{ status: { status: string } }>;
      })
    );
  }

  private get path() {
    return this.config.path || '/graphql';
  }

  sendRequest = <T>(
    request: SendRequestQueryType,
    url: string = `http://localhost:${this.server.info.port}${this.path}`
  ): Promise<GraphQLResponse<T>> => {
    const client = new GraphQLHttpClient(url);

    return client.request(request);
  };

  async checkStatus(status: string | undefined) {
    if (String(status) !== '200') {
      await this.server.stop();
      console.error(status);
      process.exit(1);
    }
  }
}
