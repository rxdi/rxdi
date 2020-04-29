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
const graphql_subscriptions_1 = require("graphql-subscriptions");
const graphql_rabbitmq_subscriptions_1 = require("@rxdi/graphql-rabbitmq-subscriptions");
const core_1 = require("@rxdi/core");
const config_tokens_1 = require("../config.tokens");
const logger_service_1 = require("./logger.service");
const remote_pubsub_service_1 = require("./remote-pubsub.service");
let PubSubService = class PubSubService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        if (this.config.pubsub) {
            this.sub = this.config.pubsub;
        }
        else if (this.config.remotePubsub) {
            this.sub = new remote_pubsub_service_1.RemotePubsub({
                host: this.config.host,
                port: this.config.host
            });
        }
        else if (this.config.activateRabbitMQ) {
            this.sub = new graphql_rabbitmq_subscriptions_1.AmqpPubSub({
                config: {
                    host: this.config.host || process.env.AMQP_HOST,
                    port: this.config.port || process.env.AMQP_PORT
                },
                logger: this.config.logger || this.logger
            });
        }
        else {
            this.sub = new graphql_subscriptions_1.PubSub();
        }
    }
    asyncIterator(event) {
        return this.sub.asyncIterator(event);
    }
    publish(signal, data) {
        return this.sub.publish(signal, data);
    }
};
PubSubService = __decorate([
    core_1.Service(),
    __param(0, core_1.Inject(config_tokens_1.GRAPHQL_PUB_SUB_CONFIG)),
    __metadata("design:paramtypes", [config_tokens_1.GRAPHQL_PUB_SUB_DI_CONFIG,
        logger_service_1.PubSubLogger])
], PubSubService);
exports.PubSubService = PubSubService;
