"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var GraphqlModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const apollo_cache_inmemory_1 = require("apollo-cache-inmemory");
const apollo_link_http_1 = require("apollo-link-http");
const graphql_injection_1 = require("./graphql.injection");
const apollo_client_1 = require("apollo-client");
const apollo_link_1 = require("apollo-link");
const apollo_link_ws_1 = require("apollo-link-ws");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const apollo_utilities_1 = require("apollo-utilities");
const apollo_link_context_1 = require("apollo-link-context");
let GraphqlModule = GraphqlModule_1 = class GraphqlModule {
    static forRoot({ uri, pubsub, onRequest } = {}, documents = {}) {
        const headers = {};
        return {
            module: GraphqlModule_1,
            providers: [
                {
                    provide: graphql_injection_1.GraphqlDocuments,
                    useValue: documents
                },
                {
                    provide: graphql_injection_1.ApolloClient,
                    useFactory: () => new apollo_client_1.ApolloClient({
                        link: apollo_link_1.concat(apollo_link_1.from([
                            apollo_link_context_1.setContext((operation) => __awaiter(this, void 0, void 0, function* () {
                                const method = onRequest || graphql_injection_1.noopHeaders;
                                let headersMap = (yield method.call(operation)) || {};
                                headersMap.forEach((v, k) => {
                                    headers[k] = v;
                                });
                                return {
                                    headers
                                };
                            })),
                            new apollo_link_1.ApolloLink((operation, forward) => forward(operation))
                        ]), apollo_link_1.split(({ query }) => {
                            const { kind, operation } = apollo_utilities_1.getMainDefinition(query);
                            return (kind === 'OperationDefinition' &&
                                operation === 'subscription');
                        }, new apollo_link_ws_1.WebSocketLink(new subscriptions_transport_ws_1.SubscriptionClient(pubsub, {
                            lazy: true,
                            connectionParams: headers,
                            reconnect: true
                        })), apollo_link_http_1.createHttpLink({ uri }))),
                        cache: new apollo_cache_inmemory_1.InMemoryCache()
                    })
                }
            ]
        };
    }
};
GraphqlModule = GraphqlModule_1 = __decorate([
    core_1.Module({})
], GraphqlModule);
exports.GraphqlModule = GraphqlModule;
__export(require("./graphql.injection"));
__export(require("./graphq.helpers"));
