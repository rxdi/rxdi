import { Injectable, Injector } from '@rxdi/core';
import { from, Observable } from 'rxjs';
import { GraphqClientConfig, Options } from './http.tokens';

@Injectable()
export class HttpClient {
  @Injector(GraphqClientConfig)
  private graphqlConfig: GraphqClientConfig;

  query<T, K>(query: string, variables?: K, options?: Options) {
    return this.getInternalJson<T>(
      this.graphqlConfig.url,
      JSON.stringify({ query, variables }),
      {
        ...options,
        method: 'POST',
      }
    );
  }

  mutation<T, K>(mutation: string, variables?: K, options?: Options) {
    return this.getInternalJson<T>(
      this.graphqlConfig.url,
      JSON.stringify({ mutation, variables }),
      {
        ...options,
        method: 'POST',
      }
    );
  }

  private getInternalJson<T = any>(
    url: string,
    body?: BodyInit,
    options: Options = { method: 'GET' }
  ): Observable<T> {
    const params = this.encodeQueryData(options.params);
    const defaultHeaders = Object.assign(
      { 'Content-Type': 'application/json' },
      options.headers
    );
    return from(
      fetch(url + params, {
        method: options.method,
        headers: this.appendHeaders(defaultHeaders),
        body,
      }).then(res => res.json())
    );
  }

  appendHeaders(h: Headers) {
    const headers = new Headers(h);
    Object.entries(h).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  }

  get<T>(url: string, body?: BodyInit, options: Options = { method: 'GET' }) {
    return this.getInternalJson<T>(url, body, options);
  }

  post<T>(url: string, body?: BodyInit, options: Options = { method: 'POST' }) {
    return this.getInternalJson<T>(url, body, options);
  }

  update<T>(
    url: string,
    body?: BodyInit,
    options: Options = { method: 'UPDATE' }
  ) {
    return this.getInternalJson<T>(url, body, options);
  }
  delete<T>(
    url: string,
    body?: BodyInit,
    options: Options = { method: 'DELETE' }
  ) {
    return this.getInternalJson<T>(url, body, options);
  }
  encodeQueryData<T>(data: Partial<T> = {}) {
    return Object.entries(data)
      .map(pair => pair.map(encodeURIComponent).join('='))
      .join('&');
  }
}
