"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
exports.ApolloClient = new core_1.InjectionToken('apollo-link');
exports.GraphqlDocuments = 'graphql-documents';
exports.noopHeaders = () => new Headers();
exports.noop = () => null;
