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
var PubSubLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const config_tokens_1 = require("../config.tokens");
let PubSubLogger = PubSubLogger_1 = class PubSubLogger {
    constructor(config) {
        this.config = config;
        this.child = () => new PubSubLogger_1(this.config);
    }
    logger(type, log, channel, data) {
        if (this.config.log) {
            console.log(`${type}: `, log, channel, data);
        }
    }
    trace(log, channel, data) {
        this.logger('Trace', log, channel, data);
    }
    debug(log, channel, data) {
        this.logger('Debug', log, channel, data);
    }
    error(log, channel, data) {
        this.logger('Error', log, channel, data);
    }
};
PubSubLogger = PubSubLogger_1 = __decorate([
    core_1.Injectable(),
    __param(0, core_1.Inject(config_tokens_1.GRAPHQL_PUB_SUB_CONFIG)),
    __metadata("design:paramtypes", [config_tokens_1.GRAPHQL_PUB_SUB_DI_CONFIG])
], PubSubLogger);
exports.PubSubLogger = PubSubLogger;
