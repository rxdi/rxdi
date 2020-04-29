"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pubsub_async_iterator_1 = require("./pubsub-async-iterator");
var rabbitmq_pub_sub_1 = require("rabbitmq-pub-sub");
var async_1 = require("async");
var child_logger_1 = require("./child-logger");
var AmqpPubSub = (function () {
    function AmqpPubSub(options) {
        if (options === void 0) { options = {}; }
        this.triggerTransform = options.triggerTransform || (function (trigger) { return trigger; });
        var config = options.config || { host: '127.0.0.1', port: 5672 };
        var logger = options.logger;
        this.logger = child_logger_1.createChildLogger(logger, 'AmqpPubSub');
        var factory = new rabbitmq_pub_sub_1.RabbitMqSingletonConnectionFactory(logger, config);
        this.consumer = new rabbitmq_pub_sub_1.RabbitMqSubscriber(logger, factory);
        this.producer = new rabbitmq_pub_sub_1.RabbitMqPublisher(logger, factory);
        this.subscriptionMap = {};
        this.subsRefsMap = {};
        this.currentSubscriptionId = 0;
    }
    AmqpPubSub.prototype.publish = function (trigger, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.trace("publishing for queue '%s' (%j)", trigger, payload);
                this.producer.publish(trigger, payload);
                return [2];
            });
        });
    };
    AmqpPubSub.prototype.subscribe = function (trigger, onMessage, options) {
        var _this = this;
        var triggerName = this.triggerTransform(trigger, options);
        var id = this.currentSubscriptionId++;
        this.subscriptionMap[id] = [triggerName, onMessage];
        var refs = this.subsRefsMap[triggerName];
        if (refs && refs.length > 0) {
            var newRefs = refs.concat([id]);
            this.subsRefsMap[triggerName] = newRefs;
            this.logger.trace("subscriber exist, adding triggerName '%s' to saved list.", triggerName);
            return Promise.resolve(id);
        }
        else {
            return new Promise(function (resolve, reject) {
                _this.logger.trace("trying to subscribe to queue '%s'", triggerName);
                _this.consumer.subscribe(triggerName, function (msg) { return _this.onMessage(triggerName, msg); })
                    .then(function (disposer) {
                    _this.subsRefsMap[triggerName] = (_this.subsRefsMap[triggerName] || []).concat([id]);
                    _this.unsubscribeChannel = disposer;
                    return resolve(id);
                }).catch(function (err) {
                    _this.logger.error(err, "failed to recieve message from queue '%s'", triggerName);
                    reject(id);
                });
            });
        }
    };
    AmqpPubSub.prototype.unsubscribe = function (subId) {
        var _this = this;
        var _a = (this.subscriptionMap[subId] || [])[0], triggerName = _a === void 0 ? null : _a;
        var refs = this.subsRefsMap[triggerName];
        if (!refs) {
            this.logger.error("There is no subscription of id '%s'", subId);
            throw new Error("There is no subscription of id \"{subId}\"");
        }
        var newRefs;
        if (refs.length === 1) {
            newRefs = [];
            this.unsubscribeChannel().then(function () {
                _this.logger.trace("cancelled channel from subscribing to queue '%s'", triggerName);
            }).catch(function (err) {
                _this.logger.error(err, "channel cancellation failed from queue '%j'", triggerName);
            });
        }
        else {
            var index = refs.indexOf(subId);
            if (index !== -1) {
                newRefs = refs.slice(0, index).concat(refs.slice(index + 1));
            }
            this.logger.trace("removing triggerName from listening '%s' ", triggerName);
        }
        this.subsRefsMap[triggerName] = newRefs;
        delete this.subscriptionMap[subId];
        this.logger.trace("list of subscriptions still available '(%j)'", this.subscriptionMap);
    };
    AmqpPubSub.prototype.asyncIterator = function (triggers) {
        return new pubsub_async_iterator_1.PubSubAsyncIterator(this, triggers);
    };
    AmqpPubSub.prototype.onMessage = function (channel, message) {
        var _this = this;
        var subscribers = this.subsRefsMap[channel];
        if (!subscribers || !subscribers.length) {
            return;
        }
        this.logger.trace("sending message to subscriber callback function '(%j)'", message);
        async_1.each(subscribers, function (subId, cb) {
            var _a = _this.subscriptionMap[subId], triggerName = _a[0], listener = _a[1];
            listener(message);
            cb();
        });
    };
    return AmqpPubSub;
}());
exports.AmqpPubSub = AmqpPubSub;
//# sourceMappingURL=amqp-pubsub.js.map