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
const hapi_1 = require("@rxdi/hapi");
const hapi_2 = require("hapi");
const config_tokens_1 = require("../config.tokens");
let StartService = class StartService {
    constructor(server, config, logger, openService) {
        this.server = server;
        this.config = config;
        this.logger = logger;
        this.openService = openService;
    }
    startBrowser() {
        this.openService.openPage(`http://${this.server.info.address}:${this.server.info.port}/devtools`);
        // this.openService.openPage(`http://${this.server.info.address}:${this.server.info.port}/graphiql`);
        // this.openService.openPage('http://localhost:4200');
        // this.openService.openGraphQLPage();
        this.logger.log('Browser started!');
    }
};
StartService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(hapi_1.HAPI_SERVER)),
    __param(1, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [hapi_2.Server, Object, core_1.BootstrapLogger,
        hapi_1.OpenService])
], StartService);
exports.StartService = StartService;
