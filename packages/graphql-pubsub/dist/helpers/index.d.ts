import { DocumentNode } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { ClientOptions } from 'subscriptions-transport-ws';
import { Server } from 'hapi';
import { Observable } from 'rxjs';
export interface WSLinkOptions extends ClientOptions {
    server?: any;
    uri: string;
}
export interface ExtendedServer extends Server {
    port: number | string;
}
export declare const createWebsocketLink: (options?: WSLinkOptions) => WebSocketLink;
export declare const subscribeToTopic: <T, V = any>(query: DocumentNode, variables?: V, link?: WebSocketLink) => Observable<T>;
export { WebSocketLink } from 'apollo-link-ws';
