"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const markdown_reader_service_1 = require("./markdown-reader.service");
const toc_component_1 = require("./toc/toc.component");
const markdown_reader_menu_provider_1 = require("./markdown-reader-menu.provider");
const markdown_reader_component_1 = require("./markdown-reader/markdown-reader.component");
let MarkdownReaderModule = class MarkdownReaderModule {
};
MarkdownReaderModule = __decorate([
    core_1.Module({
        components: [toc_component_1.TocComponent, markdown_reader_component_1.MarkdownReaderComponent],
        providers: [markdown_reader_service_1.MarkdownParserService, markdown_reader_menu_provider_1.MarkdownParserMenuProvider]
    })
], MarkdownReaderModule);
exports.MarkdownReaderModule = MarkdownReaderModule;
//# sourceMappingURL=markdown.reader.module.js.map