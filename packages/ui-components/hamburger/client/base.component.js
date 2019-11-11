"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const graphql_client_1 = require("@rxdi/graphql-client");
// import { importQuery } from '@rxdi/graphql-client';
const rxjs_1 = require("rxjs");
const lit_html_1 = require("@rxdi/lit-html");
// import { DocumentTypes } from '../../../../api-introspection/documentTypes';
class BaseComponent extends lit_html_1.LitElement {
    query(options) {
        // options.query = importQuery(options.query);
        return rxjs_1.from(this.graphql.query.bind(this.graphql)(options));
    }
    mutate(options) {
        // options.mutation = importQuery(options.mutation);
        return rxjs_1.from(this.graphql.mutate.bind(this.graphql)(options));
    }
    subscribe(options) {
        // options.query = importQuery(options.query);
        return rxjs_1.from(this.graphql.subscribe.bind(this.graphql)(options));
    }
}
__decorate([
    core_1.Injector(graphql_client_1.GraphqlClient),
    __metadata("design:type", Object)
], BaseComponent.prototype, "graphql", void 0);
exports.BaseComponent = BaseComponent;
// interface ImportQueryMixin extends QueryOptions {
//   query: DocumentTypes;
// }
// interface ImportSubscriptionMixin extends SubscriptionOptions {
//   query: DocumentTypes;
// }
// interface ImportMutationMixin extends MutationOptions {
//   mutation: DocumentTypes;
// }
//# sourceMappingURL=base.component.js.map