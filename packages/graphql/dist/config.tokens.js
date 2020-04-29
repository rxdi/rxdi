"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
exports.GRAPHQL_PLUGIN_CONFIG = new core_1.InjectionToken('graphql-configuration-injection-token');
exports.CUSTOM_SCHEMA_DEFINITION = 'gapi-custom-schema-definition';
exports.SCHEMA_OVERRIDE = new core_1.InjectionToken('gapi-custom-schema-override');
exports.ON_REQUEST_HANDLER = new core_1.InjectionToken('gapi-on-request-handler');
exports.RESOLVER_HOOK = new core_1.InjectionToken('graphql-resolver-hook');
