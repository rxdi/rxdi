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
const lit_html_1 = require("@rxdi/lit-html");
const toc_component_css_1 = require("./toc.component.css");
const core_1 = require("@rxdi/core");
const markdown_reader_menu_provider_1 = require("../markdown-reader-menu.provider");
const operators_1 = require("rxjs/operators");
/**
 * @customElement toc-component
 */
let TocComponent = class TocComponent extends lit_html_1.LitElement {
    /**
     * @customElement toc-component
     */
    constructor() {
        super(...arguments);
        this.opened = true;
        this.menus = this.menuProvider.menu.pipe(operators_1.filter(() => !!this.opened), operators_1.map(menus => this.createMenusTemplate(menus)));
    }
    clickAnchor(element) {
        this.menuProvider.navigateToAnchor(element);
    }
    createMenusTemplate(menus) {
        return lit_html_1.html `
      ${menus.map(i => this.createSingleItem(i))}
    `;
    }
    createSingleItem(item) {
        return lit_html_1.html `
      <li @click=${() => this.clickAnchor(item.elementRef)}>
        ${item.title}
      </li>
    `;
    }
};
__decorate([
    lit_html_1.property(),
    __metadata("design:type", Object)
], TocComponent.prototype, "opened", void 0);
__decorate([
    core_1.Inject(markdown_reader_menu_provider_1.MarkdownParserMenuProvider),
    __metadata("design:type", markdown_reader_menu_provider_1.MarkdownParserMenuProvider)
], TocComponent.prototype, "menuProvider", void 0);
TocComponent = __decorate([
    lit_html_1.Component({
        selector: 'toc-component',
        style: toc_component_css_1.style,
        template() {
            return lit_html_1.html `
      <div class="toc-wrapper">
        <ul>
          ${lit_html_1.async(this.menus)}
        </ul>
      </div>
    `;
        }
    })
], TocComponent);
exports.TocComponent = TocComponent;
//# sourceMappingURL=toc.component.js.map