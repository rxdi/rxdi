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
const hapi_1 = require("@rxdi/hapi");
const config_tokens_1 = require("../config.tokens");
const hapi_2 = require("hapi");
const GraphiQL = require("apollo-server-module-graphiql");
let GraphiQLService = class GraphiQLService {
    constructor(server, config) {
        this.server = server;
        this.config = config;
        this.handler = (request, h, err) => __awaiter(this, void 0, void 0, function* () {
            const graphiqlString = yield GraphiQL.resolveGraphiQLString(request['query'], this.config.graphiqlOptions, request);
            const response = h.response(graphiqlString);
            response.type('text/html');
            return response;
        });
    }
    OnInit() {
        if (!this.config || !this.config.graphiqlOptions) {
            throw new Error('Apollo Server GraphiQL requires options.');
        }
        this.register();
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.graphiql) {
                this.server.route({
                    method: 'GET',
                    path: this.config.graphiQlPath || '/graphiql',
                    options: this.config.route,
                    handler: this.handler
                });
            }
        });
    }
};
GraphiQLService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(hapi_1.HAPI_SERVER)),
    __param(1, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [hapi_2.Server, Object])
], GraphiQLService);
exports.GraphiQLService = GraphiQLService;
