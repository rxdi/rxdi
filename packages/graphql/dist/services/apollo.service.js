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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const Boom = require("boom");
const hapi_1 = require("hapi");
const apollo_server_core_1 = require("apollo-server-core");
const hapi_2 = require("@rxdi/hapi");
const config_tokens_1 = require("../config.tokens");
const bootstrap_service_1 = require("../services/bootstrap.service");
const hooks_service_1 = require("./hooks.service");
let ApolloService = class ApolloService {
    constructor(server, config, bootstrapService, hookService) {
        this.server = server;
        this.config = config;
        this.bootstrapService = bootstrapService;
        this.hookService = hookService;
        this.defaultOrNew = (request, response, error) => __awaiter(this, void 0, void 0, function* () {
            let onRequest;
            try {
                onRequest = core_1.Container.get(config_tokens_1.ON_REQUEST_HANDLER);
            }
            catch (e) { }
            if (onRequest) {
                return yield onRequest(context => this.makeGQLRequest(request, response, error, context), request, response, error);
            }
            this.config.graphqlOptions.context =
                this.config.graphqlOptions.context || {};
            if (request.headers.authorization &&
                request.headers.authorization !== 'undefined' &&
                this.config.authentication) {
                try {
                    const serviceUtilsService = core_1.Container.get((this.config.authentication));
                    this.config.graphqlOptions.context.user = yield serviceUtilsService.validateToken(request.headers.authorization);
                }
                catch (e) {
                    return Boom.unauthorized();
                }
            }
            else {
                this.config.graphqlOptions.context.user = null;
            }
            return this.makeGQLRequest(request, response, error, this.config.graphqlOptions.context);
        });
        this.handler = (request, h, err) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.defaultOrNew(request, h, err);
            }
            catch (error) {
                if (this.isInitQuery) {
                    throw new Error(error);
                }
                if (error) {
                    console.error(error);
                }
                if ('HttpQueryError' !== error.name) {
                    throw Boom.boomify(error);
                }
                if (error &&
                    error.message.constructor === String &&
                    error.message.includes('must be Output Type but got')) {
                    console.log('Maybe you are trying to cross reference Schema Type? Instead of fields: {test: {type: GraphQLString }} try lazy evaluated fields: () => ({test: {type: GraphQLString }})');
                    console.error(error);
                }
                if (true === error.isGraphQLError) {
                    const response = h.response(error.message);
                    response.code(error.statusCode);
                    response.type('application/json');
                    return response;
                }
                const err = new Boom(error.message, { statusCode: error.statusCode });
                if (error.headers) {
                    Object.keys(error.headers).forEach(header => (err.output.headers[header] = error.headers[header]));
                }
                // Boom hides the error when status code is 500
                err.output.payload.message = error.message;
                throw err;
            }
        });
    }
    OnInit() {
        this.init();
        this.register();
    }
    init() {
        let schemaOverride;
        try {
            schemaOverride = core_1.Container.get(config_tokens_1.SCHEMA_OVERRIDE);
        }
        catch (e) { }
        if (schemaOverride) {
            this.config.graphqlOptions.schema = schemaOverride(this.bootstrapService.generateSchema(true));
        }
        else {
            let customSchemaDefinition;
            try {
                customSchemaDefinition = core_1.Container.get(config_tokens_1.CUSTOM_SCHEMA_DEFINITION);
            }
            catch (e) { }
            this.config.graphqlOptions.schema =
                customSchemaDefinition ||
                    this.config.graphqlOptions.schema ||
                    this.bootstrapService.generateSchema();
        }
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config || !this.config.graphqlOptions) {
                throw new Error('Apollo Server requires options.');
            }
            this.config.graphqlOptions.schema = yield this.config.graphqlOptions.schema;
            this.hookService.AttachHooks([
                this.config.graphqlOptions.schema.getQueryType(),
                this.config.graphqlOptions.schema.getMutationType(),
                this.config.graphqlOptions.schema.getSubscriptionType()
            ]);
            this.server.route({
                method: ['GET', 'POST'],
                path: this.config.path || '/graphql',
                vhost: this.config.vhost,
                config: this.config.route || {},
                handler: this.handler
            });
        });
    }
    makeGQLRequest(request, h, err, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.payload && request.payload.toString().includes('initQuery')) {
                this.isInitQuery = true;
            }
            else {
                this.isInitQuery = false;
            }
            this.config.graphqlOptions.context = Object.assign(Object.assign({}, this.config.graphqlOptions.context), context);
            const { graphqlResponse, responseInit } = yield apollo_server_core_1.runHttpQuery([request, h], {
                method: request.method.toUpperCase(),
                options: this.config.graphqlOptions,
                query: request.method === 'post'
                    ? // TODO type payload as string or Record
                        request.payload
                    : request.query,
                request: apollo_server_core_1.convertNodeHttpToRequest(request.raw.req)
            });
            const response = h.response(graphqlResponse);
            response.type('application/json');
            return response;
        });
    }
};
ApolloService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(hapi_2.HAPI_SERVER)),
    __param(1, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [hapi_1.Server, Object, bootstrap_service_1.BootstrapService,
        hooks_service_1.HookService])
], ApolloService);
exports.ApolloService = ApolloService;
