"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const neo4j_graphql_js_1 = require("neo4j-graphql-js");
exports.Neo4JTypes = new core_1.InjectionToken('GAPI_NEO4J_TYPES');
exports.NEO4J_MODULE_CONFIG = new core_1.InjectionToken('GAPI_NEO4J_MODULE_CONFIG');
exports.NEO4J_DRIVER = new core_1.InjectionToken('GAPI_NEO4J_MODULE_CONFIG');
const graphRequest = (root, params, ctx, resolveInfo) => neo4j_graphql_js_1.neo4jgraphql(root, params, ctx, resolveInfo);
exports.graphRequest = graphRequest;
