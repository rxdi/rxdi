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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const graphql_1 = require("graphql");
const neo4jgql = require("neo4j-graphql-js");
const injection_tokens_1 = require("../injection.tokens");
const type_service_1 = require("./type.service");
const graphql_2 = require("@rxdi/graphql");
const core_2 = require("@gapi/core");
const neo4j_driver_1 = require("neo4j-driver");
let UtilService = class UtilService {
    constructor(config, gqlConfig, typeService) {
        this.config = config;
        this.gqlConfig = gqlConfig;
        this.typeService = typeService;
    }
    extendSchemaDirectives(augmentedSchema, schema) {
        augmentedSchema['_directives'] = schema['_directives'];
        return augmentedSchema;
    }
    validateSchema(schema) {
        const schemaErrors = graphql_1.validateSchema(schema);
        if (schemaErrors.length) {
            throw new Error(JSON.stringify(schemaErrors));
        }
    }
    augmentSchema(schema) {
        this.validateSchema(schema);
        return this.extendSchemaDirectives(neo4jgql.makeAugmentedSchema({
            typeDefs: graphql_1.printSchema(schema),
            config: this.config.excludedTypes
        }), schema);
    }
    mergeSchemas(...schemas) {
        return this.extendSchemaDirectives(core_2.mergeSchemas({
            schemas: schemas.filter(s => !!s)
        }), schemas.filter(s => !!s)[0]);
    }
    createRootSchema() {
        return new graphql_1.GraphQLSchema({
            query: new graphql_1.GraphQLObjectType({
                name: 'RootQuery',
                fields: {}
            }),
            directives: this.gqlConfig.directives || [],
            types: this.typeService.types || []
        });
    }
    assignDriverToContext() {
        const driver = neo4j_driver_1.v1.driver(this.config.address || 'bolt://localhost:7687', neo4j_driver_1.v1.auth.basic(this.config.username, this.config.password));
        Object.assign(this.gqlConfig.graphqlOptions, {
            context: Object.assign({ driver }, Object.assign({}, this.config.context))
        });
        return driver;
    }
};
UtilService = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(injection_tokens_1.NEO4J_MODULE_CONFIG)),
    __param(1, core_1.Inject(graphql_2.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [Object, Object, type_service_1.TypeService])
], UtilService);
exports.UtilService = UtilService;
