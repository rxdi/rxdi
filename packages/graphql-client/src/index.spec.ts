/**
 * Pins the WebSocket-link contract against a REAL subscriptions-transport-ws
 * server: what happens to pending subscriptions when the handshake is
 * rejected, that the library itself never stops the reconnect loop (the
 * consumer must, via GraphqlSubscriptionClient), and that a force-closed
 * client reconnects lazily on the next subscribe. Nothing pinned this for
 * years, which is how a backend changing its rejection wording from
 * 'Unauthorized' to 'You are not authorized' silently turned a dead session
 * into an infinite reconnect loop (2026-07).
 */
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import {
  execute,
  subscribe,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { gql } from '@apollo/client/core';
import { Container } from '@rxdi/core';

// Jest's node environment does not expose the runtime's global WebSocket,
// and SubscriptionClient picks `global.WebSocket` up at construction time.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = require('ws');
}

import { GraphqlModule } from './index';
import {
  ApolloClient,
  GraphqlModuleConfig,
  GraphqlSubscriptionClient,
  isAuthorizationConnectionError,
} from './graphql.injection';
import { ManagedSubscriptionClient } from './subscription-client';

const REJECTION = 'You are not authorized';
/**
 * The literal the pre-0.8 connectionCallback matched. Servers saying exactly
 * this used to have their subscriptions silently re-queued forever (the
 * client closed the socket before the operation errors arrived); they now
 * error like every other wording — the one visible behaviour change.
 */
const LEGACY_REJECTION = 'Unauthorized';
const TICK = gql`
  subscription {
    tick
  }
`;
const FOREVER = gql`
  subscription {
    forever
  }
`;
/** Released in afterAll: `forever` subscriptions stay pending until then. */
let releaseForever: () => void = () => undefined;
const foreverGate = new Promise<void>((resolve) => (releaseForever = resolve));

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: { ping: { type: GraphQLString, resolve: () => 'pong' } },
  }),
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: {
      tick: {
        type: GraphQLInt,
        subscribe: async function* () {
          yield { tick: 1 };
          yield { tick: 2 };
        },
        resolve: (root: { tick: number }) => root.tick,
      },
      forever: {
        type: GraphQLInt,
        subscribe: async function* () {
          await foreverGate;
        },
        resolve: () => 0,
      },
    },
  }),
});

describe('GraphqlModule WebSocket link', () => {
  let http: Server;
  let server: SubscriptionServer;
  let pubsub: string;
  /** Every connection_init the server saw, in order (its payload). */
  let handshakes: Array<Record<string, unknown>>;
  /** The token the server currently accepts; anything else is rejected. */
  let acceptedToken: string;
  /** What the server's onConnect throws for a rejected token. */
  let rejectionMessage: string;
  /** The token the client currently sends (read per (re)connect). */
  let clientToken: string;
  const opened: { client: ManagedSubscriptionClient; apollo: ApolloClient }[] = [];

  beforeAll(async () => {
    http = createServer();
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    pubsub = `ws://127.0.0.1:${(http.address() as AddressInfo).port}/graphql`;
    server = SubscriptionServer.create(
      {
        schema,
        // subscriptions-transport-ws calls these positionally; graphql@16
        // only accepts the args object.
        execute: (schema, document, rootValue, contextValue, variableValues, operationName) =>
          execute({ schema, document, rootValue, contextValue, variableValues, operationName }),
        subscribe: (schema, document, rootValue, contextValue, variableValues, operationName) =>
          subscribe({ schema, document, rootValue, contextValue, variableValues, operationName }),
        onConnect: (params: Record<string, unknown>) => {
          handshakes.push(params);
          // `token` is what the specs' explicit connectionParams send;
          // `authorization` is what the module's DEFAULT connectionParams
          // forward (the header captured from onRequest).
          if (params?.token !== acceptedToken && params?.authorization !== acceptedToken) {
            throw new Error(rejectionMessage);
          }
          return { token: params.token };
        },
      },
      { server: http, path: '/graphql' },
    );
  });

  afterAll(async () => {
    releaseForever();
    server.close();
    await new Promise<void>((resolve) => http.close(() => resolve()));
  });

  beforeEach(() => {
    handshakes = [];
    acceptedToken = 'good';
    clientToken = 'bad';
    rejectionMessage = REJECTION;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    for (const { client, apollo } of opened.splice(0)) {
      client.terminate();
      apollo.stop();
    }
    jest.restoreAllMocks();
  });

  /**
   * forRoot() wired exactly as a consumer gets it: the @Module decorator
   * registers the providers in the DI container synchronously, so both
   * tokens resolve right after the call — the same way an @Inject would.
   */
  function boot(config: Partial<GraphqlModuleConfig> = {}) {
    // Container.set() keeps the first registration of a token; a second
    // forRoot() in the same process would otherwise be ignored.
    Container.remove(GraphqlSubscriptionClient, ApolloClient);
    GraphqlModule.forRoot({
      uri: 'http://127.0.0.1:1/graphql', // never hit: only subscriptions run
      pubsub,
      pubsubOptions: { connectionParams: () => ({ token: clientToken }) },
      ...config,
    } as GraphqlModuleConfig);
    const client = Container.get(GraphqlSubscriptionClient) as ManagedSubscriptionClient;
    const apollo = Container.get(ApolloClient) as ApolloClient;
    opened.push({ client, apollo });
    return { client, apollo };
  }

  /** Runs one subscription to the end: the values it delivered, or its error. */
  function run(apollo: ApolloClient, query = TICK): Promise<{ values: number[]; error?: unknown }> {
    return new Promise((resolve) => {
      const values: number[] = [];
      apollo.subscribe({ query }).subscribe({
        next: (result) => values.push((result.data as { tick: number }).tick),
        error: (error) => resolve({ values, error }),
        complete: () => resolve({ values }),
      });
    });
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Apollo may hand the link error over as-is or wrapped as networkError. */
  function isRejection(error: unknown): boolean {
    return (
      isAuthorizationConnectionError(error) ||
      isAuthorizationConnectionError((error as { networkError?: unknown })?.networkError)
    );
  }

  it.each([REJECTION, LEGACY_REJECTION])(
    'errors EVERY pending subscription when the handshake is rejected with %p, and reports it once through the hook',
    async (message) => {
    rejectionMessage = message;
    const onSubscriptionConnectionError = jest.fn();
    const { client, apollo } = boot({ onSubscriptionConnectionError });

    const [first, second] = await Promise.all([run(apollo), run(apollo)]);

    expect(isRejection(first.error)).toBe(true);
    expect(isRejection(second.error)).toBe(true);
    expect(first.values).toEqual([]);
    expect(onSubscriptionConnectionError).toHaveBeenCalledTimes(1);
    const [error, reported] = onSubscriptionConnectionError.mock.calls[0];
    expect(error).toMatchObject({ message });
    // The client handed to the hook IS the injectable one — what a consumer
    // terminates is what the link uses.
    expect(reported).toBe(client);
    expect(client).toBeInstanceOf(ManagedSubscriptionClient);
    },
  );

  it('does NOT stop reconnecting on its own — a rejected session keeps re-handshaking with backoff', async () => {
    boot();

    await run(apollo());
    const afterFirst = handshakes.length;
    await sleep(1000); // backoff starts at ~100 ms: several retries fit here

    expect(afterFirst).toBe(1);
    expect(handshakes.length).toBeGreaterThanOrEqual(3);
    // Every retry re-sent the same dead credentials.
    expect(new Set(handshakes.map((h) => h.token))).toEqual(new Set(['bad']));

    function apollo() {
      return opened[opened.length - 1].apollo;
    }
  });

  it('a consumer terminating the client from the operation error stops the loop', async () => {
    const { client, apollo } = boot();

    const { error } = await run(apollo);
    expect(isRejection(error)).toBe(true);
    // What a consumer does on a dead session: stop re-sending it.
    client.terminate();
    await sleep(600);

    expect(handshakes).toHaveLength(1);
  });

  it('terminate() also stops the loop BETWEEN reconnect attempts, where close(true, true) is a no-op', async () => {
    const { client, apollo } = boot();
    const internals = client as unknown as { client: unknown; tryReconnectTimeoutId: unknown };

    await run(apollo);
    // Wait until the client sits in a backoff pause: no socket object, a
    // reconnect timer armed.
    for (let i = 0; i < 200 && !(internals.client === null && internals.tryReconnectTimeoutId); i++) {
      await sleep(5);
    }
    expect(internals.client).toBeNull();
    expect(internals.tryReconnectTimeoutId).toBeTruthy();

    // The stock API in this state: returns early, timer still armed. This
    // is the trap terminate() exists for.
    client.close(true, true);
    expect(internals.tryReconnectTimeoutId).toBeTruthy();

    client.terminate();
    expect(internals.tryReconnectTimeoutId).toBeNull();
    const seen = handshakes.length;
    await sleep(600);
    expect(handshakes).toHaveLength(seen);
  });

  it('terminate(reason) errors the operations still pending; terminate() completes them', async () => {
    clientToken = 'good';
    const first = boot();
    const pendingWithReason = run(first.apollo, FOREVER);
    await sleep(200); // let the operation reach the server
    first.client.terminate(new Error('session expired'));
    await expect(pendingWithReason).resolves.toMatchObject({
      values: [],
      error: expect.objectContaining({ message: 'session expired' }),
    });

    const second = boot();
    const pendingSilently = run(second.apollo, FOREVER);
    await sleep(200);
    second.client.terminate();
    await expect(pendingSilently).resolves.toEqual({ values: [] });
  });

  it('after a force-close the lazy link reconnects on the next subscribe, with fresh connectionParams', async () => {
    const onSubscriptionConnectionError = jest.fn();
    const { client, apollo } = boot({ onSubscriptionConnectionError });

    await run(apollo);
    client.terminate();
    expect(onSubscriptionConnectionError).toHaveBeenCalledTimes(1);

    // The host renewed the credentials (a new session id, say).
    clientToken = 'good';
    const recovered = await run(apollo);

    expect(recovered.error).toBeUndefined();
    expect(recovered.values).toEqual([1, 2]);
    expect(handshakes.map((h) => h.token)).toEqual(['bad', 'good']);
    // A successful ack never reaches the hook.
    expect(onSubscriptionConnectionError).toHaveBeenCalledTimes(1);
  });

  it('refreshOnUnauthenticated reloads on the literal "Unauthorized" only (legacy behaviour, byte-for-byte) and skips the hook', async () => {
    const reload = jest.fn();
    (globalThis as { location?: unknown }).location = { reload };
    try {
      rejectionMessage = LEGACY_REJECTION;
      const onSubscriptionConnectionError = jest.fn();
      const { client, apollo } = boot({
        refreshOnUnauthenticated: true,
        onSubscriptionConnectionError,
      });

      await run(apollo);
      client.terminate();

      expect(reload).toHaveBeenCalledTimes(1);
      expect(onSubscriptionConnectionError).not.toHaveBeenCalled();
    } finally {
      delete (globalThis as { location?: unknown }).location;
    }
  });

  it('refreshOnUnauthenticated does NOT reload on other authorization wordings — those reach the hook (no new reload loops for existing consumers)', async () => {
    const reload = jest.fn();
    (globalThis as { location?: unknown }).location = { reload };
    try {
      const onSubscriptionConnectionError = jest.fn();
      const { client, apollo } = boot({
        refreshOnUnauthenticated: true,
        onSubscriptionConnectionError,
      });

      await run(apollo); // rejected with 'You are not authorized'
      client.terminate();

      expect(reload).not.toHaveBeenCalled();
      expect(onSubscriptionConnectionError).toHaveBeenCalledTimes(1);
    } finally {
      delete (globalThis as { location?: unknown }).location;
    }
  });

  // The default connectionParams — what a consumer that sets NO pubsubOptions
  // relies on (gql-fission, qrify, meteo.rocks, ...): the `authorization`
  // header captured from onRequest on the last HTTP operation is forwarded
  // on the WebSocket handshake, read lazily at (re)connect time.
  it('default connectionParams forward the authorization header captured by onRequest', async () => {
    acceptedToken = 'id-token-1';
    let idToken = '';
    const { client, apollo } = boot({
      // No pubsubOptions: the module's own connectionParams apply.
      pubsubOptions: undefined,
      onRequest: async () => {
        const headers = new Headers();
        if (idToken) headers.append('authorization', idToken);
        return headers;
      },
    });
    const server = handshakes; // alias for readability
    const onConnectToken = () => server.map((h) => h.authorization ?? null);

    // Before any HTTP operation nothing was captured: the handshake carries
    // no authorization and is rejected. Stop the client as a consumer would:
    // left alone, its background reconnect timer races the subscribe below
    // for the socket (the transport's double-connect quirk) and can swallow
    // the operation — seen as a CI-only failure of this very test.
    await run(apollo);
    expect(onConnectToken()).toEqual([null]);
    client.terminate();

    // An HTTP operation runs onRequest (setContext) — the fetch itself fails
    // against the dead uri, which is irrelevant here — and the next
    // handshake forwards what it captured.
    idToken = 'id-token-1';
    await apollo.query({ query: gql`{ ping }`, fetchPolicy: 'network-only' }).catch(() => undefined);
    const recovered = await run(apollo);
    expect(recovered.values).toEqual([1, 2]);
    expect(onConnectToken()).toEqual([null, 'id-token-1']);
  });

  it('pubsubOptions still override the module defaults (reconnect off = one handshake, no loop)', async () => {
    const { apollo } = boot({
      pubsubOptions: {
        connectionParams: () => ({ token: clientToken }),
        reconnect: false,
      },
    });

    await run(apollo);
    await sleep(600);

    expect(handshakes).toHaveLength(1);
  });
});

describe('isAuthorizationConnectionError', () => {
  it.each([
    ['Unauthorized', true],
    ['unauthorized', true],
    ['You are not authorized', true],
    [{ message: 'You are not authorized' }, true],
    [{ message: 'Unauthorized' }, true],
    [new Error('Not Authorized'), true],
    ['Prohibited connection!', false],
    [{ message: 'Invalid message type!' }, false],
    [{}, false],
    [null, false],
    [undefined, false],
  ])('%p → %s', (error, expected) => {
    expect(isAuthorizationConnectionError(error)).toBe(expected);
  });
});
