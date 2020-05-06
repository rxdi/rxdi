import { InjectionToken } from '@rxdi/core';

export interface GraphqClientConfig {
  url: string;
}
export const GraphqClientConfig = new InjectionToken<GraphqClientConfig>();

export interface HttpParameterCodec {
  encodeKey(key: string): string;
  encodeValue(value: string): string;

  decodeKey(key: string): string;
  decodeValue(value: string): string;
}
export interface HttpParamsOptions {
  /**
   * String representation of the HTTP parameters in URL-query-string format.
   * Mutually exclusive with `fromObject`.
   */
  fromString?: string;

  /** Object map of the HTTP parameters. Mutually exclusive with `fromString`. */
  fromObject?: { [param: string]: string | ReadonlyArray<string> };

  /** Encoding codec used to parse and serialize the parameters. */
  encoder?: HttpParameterCodec;
}

export declare class HttpParams {
  constructor(options?: HttpParamsOptions);
  append(param: string, value: string): HttpParams;
  delete(param: string, value?: string): HttpParams;
  get(param: string): string | null;
  getAll(param: string): string[] | null;
  has(param: string): boolean;
  keys(): string[];
  set(param: string, value: string): HttpParams;
  toString(): string;
}

export declare class HttpHeaders {
  constructor(
    headers?:
      | string
      | {
          [name: string]: string | string[];
        }
  );
  append(name: string, value: string | string[]): HttpHeaders;
  delete(name: string, value?: string | string[]): HttpHeaders;
  get(name: string): string | null;
  getAll(name: string): string[] | null;
  has(name: string): boolean;
  keys(): string[];
  set(name: string, value: string | string[]): HttpHeaders;
}

export interface Options {
  headers?: Headers;
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  method: 'POST' | 'GET' | 'DELETE' | 'UPDATE';
  responseType?: 'arraybuffer';
  withCredentials?: boolean;
}

export function gql(...args) {
  const literals = args[0];
  let result = typeof literals === 'string' ? literals : literals[0];

  for (let i = 1; i < args.length; i++) {
    if (args[i] && args[i].kind && args[i].kind === 'Document') {
      result += args[i].loc.source.body;
    } else {
      result += args[i];
    }

    result += literals[i];
  }

  return result;
}
