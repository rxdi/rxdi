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
const graphql_pubsub_1 = require("@rxdi/graphql-pubsub");
const graphql_1 = require("@rxdi/graphql");
const EffectTypes_1 = require("../../introspection/EffectTypes");
let HamburgerControllerEffect = class HamburgerControllerEffect {
    constructor(pubsub) {
        this.pubsub = pubsub;
    }
    clickHamburgerButtonAction(result) {
        this.pubsub.publish(EffectTypes_1.EffectTypes.clickHamburgerButton, result);
    }
};
__decorate([
    graphql_1.OfType(EffectTypes_1.EffectTypes.clickHamburgerButton),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HamburgerControllerEffect.prototype, "clickHamburgerButtonAction", null);
HamburgerControllerEffect = __decorate([
    core_1.Effect(),
    __metadata("design:paramtypes", [graphql_pubsub_1.PubSubService])
], HamburgerControllerEffect);
exports.HamburgerControllerEffect = HamburgerControllerEffect;
//# sourceMappingURL=hamburger-controller.effect.js.map