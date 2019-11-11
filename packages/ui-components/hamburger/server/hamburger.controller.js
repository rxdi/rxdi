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
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const graphql_1 = require("@rxdi/graphql");
const graphql_pubsub_1 = require("@rxdi/graphql-pubsub");
const hamburger_statistics_type_1 = require("./types/hamburger-statistics.type");
const EffectTypes_1 = require("../../introspection/EffectTypes");
let HamburgerController = class HamburgerController {
    constructor(pubsub) {
        this.pubsub = pubsub;
        this.payload = { clicks: 1 };
    }
    clickHamburgerButton() {
        this.payload.clicks++;
        return this.payload;
    }
    subscribeToStatistics(payload) {
        return payload;
    }
};
__decorate([
    graphql_1.Mutation(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HamburgerController.prototype, "clickHamburgerButton", null);
__decorate([
    graphql_pubsub_1.Subscribe(function () {
        return this.pubsub.asyncIterator(EffectTypes_1.EffectTypes.clickHamburgerButton);
    }),
    graphql_pubsub_1.Subscription(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], HamburgerController.prototype, "subscribeToStatistics", null);
HamburgerController = __decorate([
    core_1.Controller({
        type: hamburger_statistics_type_1.HamburgerStatisticsType
    }),
    __metadata("design:paramtypes", [graphql_pubsub_1.PubSubService])
], HamburgerController);
exports.HamburgerController = HamburgerController;
//# sourceMappingURL=hamburger.controller.js.map