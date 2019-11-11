"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_link_1 = require("apollo-link");
const apollo_link_ws_1 = require("apollo-link-ws");
const core_1 = require("@rxdi/core");
const hapi_1 = require("@rxdi/hapi");
const rxjs_1 = require("rxjs");
const ws = require('ws');
exports.createWebsocketLink = (options = { uri: 'ws://localhost:9000/subscriptions' }) => {
    let server;
    try {
        server = core_1.Container.get(options.server || hapi_1.HAPI_SERVER);
    }
    catch (e) { }
    if (server) {
        options.uri = `ws://localhost:${server.info.port ||
            server.port}/subscriptions`;
    }
    if (!core_1.Container.has(apollo_link_ws_1.WebSocketLink)) {
        core_1.Container.set(apollo_link_ws_1.WebSocketLink, new apollo_link_ws_1.WebSocketLink({
            uri: options.uri,
            options: options || {
                reconnect: true
            },
            webSocketImpl: ws
        }));
    }
    return core_1.Container.get(apollo_link_ws_1.WebSocketLink);
};
exports.subscribeToTopic = (query, variables, link) => {
    return new rxjs_1.Observable(o => {
        const cmd = apollo_link_1.execute(link || exports.createWebsocketLink(), {
            query,
            variables
        }).subscribe({
            next: o.next.bind(o),
            error: o.error.bind(o),
            complete: o.complete.bind(o)
        });
        return () => cmd.unsubscribe();
    });
};
var apollo_link_ws_2 = require("apollo-link-ws");
exports.WebSocketLink = apollo_link_ws_2.WebSocketLink;
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
