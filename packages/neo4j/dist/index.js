"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var Neo4JModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const type_service_1 = require("./services/type.service");
const injection_tokens_1 = require("./injection.tokens");
const graphql_1 = require("@rxdi/graphql");
const util_service_1 = require("./services/util.service");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let Neo4JModule = Neo4JModule_1 = class Neo4JModule {
    static forRoot(config = {}) {
        return {
            module: Neo4JModule_1,
            providers: [
                {
                    provide: injection_tokens_1.NEO4J_MODULE_CONFIG,
                    useValue: config
                },
                {
                    provide: injection_tokens_1.NEO4J_MODULE_CONFIG,
                    deps: [injection_tokens_1.NEO4J_MODULE_CONFIG, type_service_1.TypeService],
                    lazy: true,
                    useFactory: (config, typeService) => rxjs_1.of(config).pipe(operators_1.map(c => typeService.extendExcludedTypes(c)))
                },
                {
                    provide: injection_tokens_1.Neo4JTypes,
                    deps: [type_service_1.TypeService, injection_tokens_1.NEO4J_MODULE_CONFIG],
                    useFactory: (typeService, config) => typeService.addTypes(config.types)
                },
                ...(config.onRequest
                    ? [
                        {
                            provide: graphql_1.ON_REQUEST_HANDLER,
                            deps: [injection_tokens_1.NEO4J_MODULE_CONFIG],
                            useFactory: (config) => config.onRequest
                        }
                    ]
                    : [
                        {
                            provide: injection_tokens_1.NEO4J_DRIVER,
                            deps: [util_service_1.UtilService],
                            useFactory: (util) => util.assignDriverToContext()
                        }
                    ]),
                ...(config.schemaOverride
                    ? [
                        {
                            provide: graphql_1.SCHEMA_OVERRIDE,
                            useFactory: () => (schema) => config.schemaOverride(schema)
                        }
                    ]
                    : [
                        {
                            provide: graphql_1.SCHEMA_OVERRIDE,
                            deps: [util_service_1.UtilService],
                            useFactory: (util) => (schema) => util.augmentSchema(util.mergeSchemas(schema, util.createRootSchema()))
                        }
                    ])
            ]
        };
    }
    static forChild(types) { }
};
Neo4JModule = Neo4JModule_1 = __decorate([
    core_1.Module({
        providers: [type_service_1.TypeService]
    })
], Neo4JModule);
exports.Neo4JModule = Neo4JModule;
__export(require("./injection.tokens"));
__export(require("./services/index"));
