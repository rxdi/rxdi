import { execute, DocumentNode } from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
// import { gql } from 'apollo-server-core';
import { ClientOptions } from 'subscriptions-transport-ws';
import { Server } from 'hapi';
import { Container } from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Observable } from 'rxjs';
const ws = require('ws');

export interface WSLinkOptions extends ClientOptions {
    server?: any;
    uri: string;
}

export interface ExtendedServer extends Server {
    port: number | string;
}

export const createWebsocketLink = (
    options: WSLinkOptions = { uri: 'ws://localhost:9000/subscriptions' },
) => {
    let server: ExtendedServer;
    try {
        server = Container.get<ExtendedServer>(options.server || HAPI_SERVER);
    } catch (e) { }
    if (server) {
        options.uri = `ws://localhost:${server.info.port || server.port}/subscriptions`;
    }
    if (!Container.has(WebSocketLink)) {
        Container.set(
            WebSocketLink,
            new WebSocketLink({
                uri: options.uri,
                options: options || {
                    reconnect: true,
                },
                webSocketImpl: ws,
            }),
        );
    }
    return Container.get(WebSocketLink);
};

export const subscribeToTopic = <T, V = any>(
    query: DocumentNode,
    variables?: V,
    link?: WebSocketLink,
): Observable<T> => {
    return new Observable<T>((o) => {
        const cmd = execute(link || createWebsocketLink(), {
            query,
            variables,
        }).subscribe({
            next: o.next.bind(o),
            error: o.error.bind(o),
            complete: o.complete.bind(o),
        });
        return () => cmd.unsubscribe();
    });
};

export { WebSocketLink } from '@apollo/client/link/ws';

// const subscription = subscribeToTopic<{data: {statusSubscription: { status: string }}}>(gql`
//   subscription {
//     statusSubscription {
//       status
//     }
//   }
// `).subscribe(stream => {
//   console.log(stream.data.statusSubscription.status);
// });
// setTimeout(() => {
//   subscription.unsubscribe();
// }, 5000);
