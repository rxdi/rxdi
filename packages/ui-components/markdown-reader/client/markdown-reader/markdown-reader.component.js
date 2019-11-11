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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lit_html_1 = require("@rxdi/lit-html");
const markdown_reader_component_css_1 = require("./markdown-reader.component.css");
const core_1 = require("@rxdi/core");
const markdown_reader_service_1 = require("../markdown-reader.service");
const markdown_reader_menu_provider_1 = require("../markdown-reader-menu.provider");
const services_1 = require("../../../services");
const operators_1 = require("rxjs/operators");
/**
 * @customElement markdown-reader
 */
let MarkdownReaderComponent = class MarkdownReaderComponent extends lit_html_1.LitElement {
    /**
     * @customElement markdown-reader
     */
    constructor() {
        super(...arguments);
        this.html = '';
        this.widthHeight = this.responsive.combineBoth();
    }
    OnInit() {
        this.widthHeight
            .pipe(operators_1.tap(({ width }) => {
            if (width < 600) {
                this.disableTocComponent = true;
            }
            else {
                this.disableTocComponent = false;
            }
        }))
            .subscribe();
    }
    OnUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.getRouteParams();
            // const res = await this.mdParser.fetchDefinitions('https://raw.githubusercontent.com/rxdi/ui-components/master/gapi-cli.conf.yml');
            yield this.fetch(params.namespace, params.repo, params.filePath);
            this.mdParser.highlightElements(this.tags);
            this.mdParserMenu.lookupHeadings(this.shadowRoot);
        });
    }
    getRouteParams() {
        let params = {};
        if (this['location']) {
            params = this['location'].params;
        }
        return {
            namespace: params.namespace || this.namespace,
            repo: params.repo || this.repo,
            filePath: params.filePath || this.filePath
        };
    }
    fetch(namespace = 'rxdi', repo = 'starter-client-lit-html', filePath = 'README.md') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.html = yield this.mdParser.fetchMarkdown(this.link ||
                    `https://raw.githubusercontent.com/${namespace}/${repo}/master/${filePath}`);
            }
            catch (e) {
                this.dispatchEvent(new CustomEvent('onError', {
                    detail: e
                }));
            }
        });
    }
};
__decorate([
    lit_html_1.property(),
    __metadata("design:type", Object)
], MarkdownReaderComponent.prototype, "html", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", Boolean)
], MarkdownReaderComponent.prototype, "disableTocComponent", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", String)
], MarkdownReaderComponent.prototype, "link", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", String)
], MarkdownReaderComponent.prototype, "namespace", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", String)
], MarkdownReaderComponent.prototype, "repo", void 0);
__decorate([
    lit_html_1.property(),
    __metadata("design:type", String)
], MarkdownReaderComponent.prototype, "filePath", void 0);
__decorate([
    lit_html_1.property(),
    lit_html_1.property(),
    __metadata("design:type", String)
], MarkdownReaderComponent.prototype, "markdownReaderJSON", void 0);
__decorate([
    core_1.Inject(markdown_reader_service_1.MarkdownParserService),
    __metadata("design:type", markdown_reader_service_1.MarkdownParserService)
], MarkdownReaderComponent.prototype, "mdParser", void 0);
__decorate([
    core_1.Inject(markdown_reader_menu_provider_1.MarkdownParserMenuProvider),
    __metadata("design:type", markdown_reader_menu_provider_1.MarkdownParserMenuProvider)
], MarkdownReaderComponent.prototype, "mdParserMenu", void 0);
__decorate([
    core_1.Inject(services_1.ResponsiveService),
    __metadata("design:type", services_1.ResponsiveService)
], MarkdownReaderComponent.prototype, "responsive", void 0);
__decorate([
    lit_html_1.queryAll('code'),
    __metadata("design:type", Array)
], MarkdownReaderComponent.prototype, "tags", void 0);
MarkdownReaderComponent = __decorate([
    lit_html_1.Component({
        selector: 'markdown-reader',
        style: markdown_reader_component_css_1.style,
        template() {
            return lit_html_1.html `
      ${!this.disableTocComponent
                ? lit_html_1.html `
            <toc-component></toc-component>
          `
                : ''}
      ${!this.html
                ? lit_html_1.html `
            <loading-screen-component></loading-screen-component>
          `
                : ''}
      ${this.html
                ? lit_html_1.html `
            <div class="container">
              ${lit_html_1.unsafeHTML(this.html)}
            </div>
          `
                : ''}
    `;
        }
    })
], MarkdownReaderComponent);
exports.MarkdownReaderComponent = MarkdownReaderComponent;
//# sourceMappingURL=markdown-reader.component.js.map