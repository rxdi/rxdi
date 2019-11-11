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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lit_html_1 = require("@rxdi/lit-html");
const hamburger_component_css_1 = require("./hamburger.component.css");
const hamburger_type_1 = require("./hamburger.type");
const base_component_1 = require("./base.component");
const operators_1 = require("rxjs/operators");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const rxjs_1 = require("rxjs");
/**
 * @customElement hamburger-component
 */
let HamburgerComponent = class HamburgerComponent extends base_component_1.BaseComponent {
    /**
     * @customElement hamburger-component
     */
    constructor() {
        super(...arguments);
        this.type = '3dx';
    }
    clickHamburgerButton() {
        return rxjs_1.of(this.active)
            .pipe(operators_1.tap(active => (this.active = !active)), operators_1.filter(() => !!this.enableBackendStatistics), operators_1.switchMap(() => this.sendClickStatistics()), operators_1.take(1))
            .subscribe();
    }
    sendClickStatistics() {
        return this.mutate({
            mutation: graphql_tag_1.default `
        mutation clickHamburgerButton {
          clickHamburgerButton {
            clicks
          }
        }
      `
        }).pipe(operators_1.map(mutation => mutation.data.clickHamburgerButton));
    }
};
__decorate([
    lit_html_1.property(),
    __metadata("design:type", Boolean)
], HamburgerComponent.prototype, "active", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", String)
], HamburgerComponent.prototype, "type", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", Boolean)
], HamburgerComponent.prototype, "enableBackendStatistics", void 0);
HamburgerComponent = __decorate([
    lit_html_1.Component({
        selector: 'hamburger-component',
        style: hamburger_component_css_1.style,
        template() {
            return lit_html_1.html `
      <div
        @click=${this.clickHamburgerButton}
        class="hamburger hamburger--${this.type} ${this.active
                ? 'is-active'
                : ''}"
      >
        <div class="hamburger-box">
          <div class="hamburger-inner"></div>
        </div>
      </div>
    `;
        }
    })
], HamburgerComponent);
exports.HamburgerComponent = HamburgerComponent;
//# sourceMappingURL=hamburger.component.js.map