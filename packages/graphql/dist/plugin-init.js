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
const graphql_tester_1 = require("graphql-tester");
const hapi_1 = require("@rxdi/hapi");
const hapi_2 = require("hapi");
const operators_1 = require("rxjs/operators");
const config_tokens_1 = require("./config.tokens");
let PluginInit = class PluginInit {
    constructor(server, config, afterStarter) {
        this.server = server;
        this.config = config;
        this.afterStarter = afterStarter;
        this.defaultQuery = `query { status { status } } `;
        this.sendRequest = (request, url = `http://localhost:${this.server.info.port}/graphql`) => {
            this.tester = graphql_tester_1.tester({
                url,
                contentType: 'application/json'
            });
            return this.tester(JSON.stringify(request));
        };
    }
    register() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config.initQuery) {
                return;
            }
            this.afterStarter.appStarted
                .pipe(operators_1.take(1), operators_1.switchMap(() => __awaiter(this, void 0, void 0, function* () {
                return yield this.sendRequest({
                    query: this.defaultQuery
                });
            })), operators_1.tap(res => this.checkStatus(res)))
                .subscribe();
        });
    }
    checkStatus(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.status !== 200) {
                yield this.server.stop();
                console.error(request);
                process.exit(1);
            }
        });
    }
};
PluginInit = __decorate([
    core_1.Plugin(),
    __param(0, core_1.Inject(hapi_1.HAPI_SERVER)),
    __param(1, core_1.Inject(config_tokens_1.GRAPHQL_PLUGIN_CONFIG)),
    __metadata("design:paramtypes", [hapi_2.Server, Object, core_1.AfterStarterService])
], PluginInit);
exports.PluginInit = PluginInit;
