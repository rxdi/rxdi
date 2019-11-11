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
const config_tokens_1 = require("../config.tokens");
const custom_directive_1 = require("../helpers/directives/custom-directive");
// import { makeExecutableSchema, addMockFunctionsToSchema, mergeSchemas, } from 'graphql-tools';
class FieldsModule {
}
exports.FieldsModule = FieldsModule;
class MetaDescriptor {
}
exports.MetaDescriptor = MetaDescriptor;
let BootstrapService = class BootstrapService {
    constructor(moduleService, config) {
        this.moduleService = moduleService;
        this.config = config;
        this.Fields = { query: {}, mutation: {}, subscription: {} };
    }
    getResolverByName(resolverName) {
        return (this.Fields.query[resolverName] ||
            this.Fields.mutation[resolverName] ||
            this.Fields.subscription[resolverName]);
    }
    validateResolver(desc, self) {
        if (!desc.type) {
            throw new Error(`Missing type for resolver ${desc.method_name} inside @Controller ${self.constructor['originalName']}`);
        }
    }
    applyInitStatus() {
        return {
            type: new graphql_1.GraphQLObjectType({
                name: 'StatusQueryType',
                fields: () => ({ status: { type: graphql_1.GraphQLString } })
            }),
            method_name: 'status',
            public: true,
            method_type: 'query',
            target: () => { },
            resolve: function initQuery() {
                return { status: 200 };
            }
        };
    }
    collectAppSchema() {
        const Fields = this.Fields;
        if (this.config.initQuery) {
            Fields.query.status = this.applyInitStatus();
        }
        this.applyGlobalControllerOptions();
        this.getMetaDescriptors().forEach(({ descriptor, self }) => {
            const desc = descriptor();
            desc.target = self;
            this.validateResolver(desc, self);
            Fields[desc.method_type][desc.method_name] = desc;
        });
        this.Fields = Fields;
        return this.Fields;
    }
    getFieldsFromType(schema) {
        return schema
            .getQueryType()
            .getFields()
            .findUser.type['getFields']();
    }
    isEmptySchemaFields(Fields) {
        return !Object.keys(Fields)
            .map(f => Fields[f])
            .filter(f => !!Object.keys(f).length).length;
    }
    generateSchema(schemaOverride) {
        const Fields = this.collectAppSchema();
        if (this.isEmptySchemaFields(Fields) && schemaOverride) {
            return null;
        }
        let schema = new graphql_1.GraphQLSchema({
            directives: this.getDirectives(),
            query: this.generateType(Fields.query, 'Query', 'Query type for all get requests which will not change persistent data'),
            mutation: this.generateType(Fields.mutation, 'Mutation', 'Mutation type for all requests which will change persistent data'),
            subscription: this.generateType(Fields.subscription, 'Subscription', 'Subscription type for all subscriptions via pub sub')
        });
        const schemaErrors = graphql_1.validateSchema(schema);
        if (schemaErrors.length) {
            throw new Error(JSON.stringify(schemaErrors));
        }
        // Build astNode https://github.com/graphql/graphql-js/issues/1575
        if (this.config.buildAstDefinitions) {
            schema = graphql_1.buildSchema(graphql_1.printSchema(schema));
        }
        if (this.config.directives && this.config.directives.length) {
            schema = custom_directive_1.applySchemaCustomDirectives(schema);
        }
        this.schema = schema;
        return schema;
    }
    getDirectives() {
        return [...(this.config.directives || [])].map(d => d.metadata ? new custom_directive_1.GraphQLCustomDirective(core_1.Container.get(d)) : d);
    }
    generateType(fields, name, description) {
        if (!Object.keys(fields).length) {
            return;
        }
        return new graphql_1.GraphQLObjectType({ name, description, fields });
    }
    applyGlobalControllerOptions() {
        Array.from(this.moduleService.watcherService._constructors.keys())
            .filter(key => this.moduleService.watcherService.getConstructor(key)['type']['metadata']['type'] === 'controller')
            .map(key => {
            const currentConstructor = this.moduleService.watcherService.getConstructor(key);
            const options = currentConstructor.type['metadata'].options;
            currentConstructor.type._descriptors =
                currentConstructor.type._descriptors || [];
            Array.from(currentConstructor.type._descriptors.keys()).map(k => {
                if (!options) {
                    return;
                }
                const orig = currentConstructor.type._descriptors.get(k);
                const descriptor = orig.value();
                if (options.scope) {
                    descriptor.scope = descriptor.scope || options.scope;
                }
                if (options.guards && options.guards.length && !descriptor.public) {
                    descriptor.guards = descriptor.guards || options.guards;
                }
                if (options.type) {
                    descriptor.type = descriptor.type || options.type;
                }
                if (options.interceptor && !descriptor.interceptor) {
                    descriptor.interceptor = options.interceptor;
                }
                orig.value = () => descriptor;
                currentConstructor.type._descriptors.set(k, orig);
            });
            return key;
        });
    }
    getMetaDescriptors() {
        const descriptors = [];
        Array.from(this.moduleService.watcherService._constructors.keys())
            .filter(key => this.moduleService.watcherService.getConstructor(key)['type']['metadata']['type'] === 'controller')
            .map(key => this.moduleService.watcherService.getConstructor(key))
            .forEach((map) => Array.from(map.type._descriptors.keys())
            .map(k => map.type._descriptors.get(k))
            .map(d => d.value)
            .forEach(v => descriptors.push({ descriptor: v, self: map.value })));
        return descriptors;
    }
};
BootstrapService = __decorate([
    core_1.Service(),
    __param(1, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [core_1.ModuleService, Object])
], BootstrapService);
exports.BootstrapService = BootstrapService;
