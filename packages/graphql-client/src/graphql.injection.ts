import { InjectionToken } from '@rxdi/core';
import {
  ApolloClient as AC,
  ApolloClientOptions,
  DocumentNode,
  HttpOptions,
  RequestHandler,
  TypedDocumentNode,
} from '@apollo/client/core';
import { NormalizedCacheObject, InMemoryCache } from '@apollo/client/cache';
import { ClientOptions, SubscriptionClient } from 'subscriptions-transport-ws';
import { ManagedSubscriptionClient } from './subscription-client';

export const ApolloClient = new InjectionToken<AC<NormalizedCacheObject>>('apollo-link');
export interface ApolloClient extends AC<NormalizedCacheObject> { }

/**
 * The subscriptions-transport-ws client behind the module's WebSocket link
 * (a ManagedSubscriptionClient — the stock client plus `terminate()`).
 *
 * Exposed so a consumer can act on the connection itself — the one thing the
 * library cannot decide correctly on its behalf. The typical use is a dead
 * session: the server rejects `connection_init`, every pending subscription
 * errors, and `reconnect: true` would otherwise re-send the same dead
 * credentials forever (backoff-capped at 10 s). The consumer, who SEES the
 * operation error, calls `terminate()` to stop that; the link is lazy, so
 * the next `subscribe()` opens a fresh connection with freshly evaluated
 * `connectionParams`.
 *
 * Use `terminate()`, not `close(true, true)`: the latter is a no-op between
 * two reconnect attempts (no socket object exists then) and leaves the
 * reconnect timer armed — see ManagedSubscriptionClient.
 *
 * Why the library does not stop it itself: the connection-level error
 * arrives BEFORE the per-operation errors, and a forced close there drops
 * the operations without erroring them, so the app never learns the
 * session died. A non-forced close reconnects. There is no right call to
 * make from `connectionCallback` — see `onSubscriptionConnectionError`.
 */
export const GraphqlSubscriptionClient = new InjectionToken<ManagedSubscriptionClient>('graphql-subscription-client');
export interface GraphqlSubscriptionClient extends ManagedSubscriptionClient { }

export const GraphqlDocuments = new InjectionToken<Record<string, DocumentNode | TypedDocumentNode>>('graphql-documents');

export interface GraphqlModuleConfig {
  uri: string;
  pubsub: string;
  onRequest?(): Promise<Headers>;
  cache?: InMemoryCache;
  apolloRequestHandler?: RequestHandler;
  cancelPendingRequests?: boolean;
  apolloClientOptions?: ApolloClientOptions<unknown>;
  /**
   * `location.reload()` when the WebSocket handshake is rejected with the
   * literal message `Unauthorized` — the exact legacy behaviour, kept
   * byte-for-byte so no existing consumer starts reloading on a wording it
   * never reloaded on (a reload only helps where reloading obtains new
   * credentials; with launch-bound credentials it loops). Wider matching is
   * available for your own logic through `isAuthorizationConnectionError`
   * in `onSubscriptionConnectionError`.
   */
  refreshOnUnauthenticated?: boolean;
  httpOptions?: HttpOptions;
  /**
   * Spread LAST over the module's own SubscriptionClient options, so anything
   * here (`connectionParams`, `reconnect`, `connectionCallback`, ...) wins.
   */
  pubsubOptions?: ClientOptions;
  /**
   * Called with the server's `connection_error` payload whenever the
   * WebSocket handshake is rejected (never on success), plus the client so
   * the consumer can act on it. Fires BEFORE the pending operations receive
   * their own errors, so do not `terminate()` from here — that settles them
   * before the real rejection reaches them (see `GraphqlSubscriptionClient`).
   * Log, flag state, or defer; stop reconnection from the operation error
   * handler instead.
   */
  onSubscriptionConnectionError?(error: unknown, client: ManagedSubscriptionClient): void;
}

/**
 * True when a WebSocket `connection_error` payload is an authorization
 * rejection. Servers phrase it differently — subscriptions-transport-ws
 * forwards whatever the `onConnect` hook threw: a bare 'Unauthorized', Boom's
 * 'You are not authorized', ... — and the library matched only the first
 * literal for years, which is how a backend switching to the second silently
 * turned a dead session into an infinite reconnect loop.
 */
export function isAuthorizationConnectionError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  const message = typeof error === 'string' ? error : String((error as { message?: unknown }).message ?? '');
  return /unauthorized|not authorized/i.test(message);
}
export const noopHeaders = () => new Headers();
export const noop = () => null;

export interface Definintion {
  kind: string;
  operation?: string;
}
