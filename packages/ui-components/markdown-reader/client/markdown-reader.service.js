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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
require("./prism");
const js_yaml_1 = __importDefault(require("js-yaml"));
const marked_1 = __importDefault(require("marked"));
let MarkdownParserService = class MarkdownParserService {
    constructor() {
        this.renderer = new marked_1.default.Renderer();
        this.cache = new Map();
        this.initParser();
    }
    highlightElements(tags) {
        return [].forEach.call(tags, (code) => {
            if (code.className) {
                Prism.highlightElement(code);
            }
        });
    }
    flushCache() {
        this.cache.clear();
    }
    readAndCompile(text) {
        const html = `<div class="content" #contentReference>
      ${marked_1.default(text, { renderer: this.renderer })}
    </div>`;
        return html + '\n';
    }
    fetchMarkdown(link) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cache.has(link)) {
                return this.cache.get(link);
            }
            const res = yield fetch(link);
            if (res.status !== 200) {
                // location.href = '/not-found';
                throw new Error(`Unable to load markdown status is ${res.status}`);
            }
            const result = this.readAndCompile(yield (res).text());
            this.cache.set(link, result);
            return this.cache.get(link);
        });
    }
    fetchDefinitions(link) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cache.has(link)) {
                return this.cache.get(link);
            }
            const res = yield fetch(link);
            if (res.status !== 200) {
                // location.href = '/not-found';
                throw new Error(`Unable to load config status is ${res.status}`);
            }
            const result = yield (res).text();
            const doc = js_yaml_1.default.load(result);
            this.cache.set(link, doc);
            return result;
        });
    }
    crypto(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    escapeBrackets(text) {
        text = text.replace(new RegExp('{', 'g'), '&#123;');
        text = text.replace(new RegExp('}', 'g'), '&#125;');
        return text;
    }
    appendEmptyLine(text) {
        const codeEscape = '">';
        const codeEscId = text.indexOf(codeEscape);
        return (text.slice(0, codeEscId + codeEscape.length) +
            '\n' +
            text.slice(codeEscId + codeEscape.length, text.length));
    }
    replaceFilename(renderer, text, filenameKey, filenameIndex) {
        const startIndex = filenameIndex + filenameKey.length;
        const endIndex = text.indexOf(')');
        const directiveRef = `app` + this.crypto(20);
        const filename = text.slice(startIndex + 1, endIndex);
        return (`
<span class="filename">` +
            (filename.length > 0
                ? `
  {{ '${filename}' | extension: ${directiveRef}.isJsActive }}`
                : '') +
            `
<app-tabs #${directiveRef}></app-tabs>
</span>` +
            renderer(text.slice(endIndex + 1), directiveRef).trim());
    }
    parseSwitcher(renderer, text, switchKey, switchIndex, elementKey) {
        const tsCode = text.slice(0, switchIndex).trim();
        const jsCode = text
            .slice(switchIndex + switchKey.length, text.length)
            .trim();
        const wrapCondition = (snippet, lang) => elementKey
            ? snippet.slice(0, 4) +
                ` [class.hide]="${lang === 'js' ? '!' : ''}${elementKey}.isJsActive"` +
                snippet.slice(4, snippet.length)
            : snippet;
        return (wrapCondition(renderer(tsCode, 'typescript'), 'ts') +
            wrapCondition(renderer(jsCode, 'typescript'), 'js'));
    }
    insertText(text, index, textToAdd) {
        return text.slice(0, index) + textToAdd + text.slice(index);
    }
    initParser() {
        const originalTableRenderer = this.renderer.table;
        this.renderer.table = (header, body) => header.includes('<th></th>')
            ? originalTableRenderer.call(this.renderer, '', body)
            : originalTableRenderer.call(this.renderer, header, body);
        const originalCodeRenderer = this.renderer.code;
        this.renderer.code = (code, language, isEscaped, switcherKey) => {
            const filenameKey = '@@filename';
            const filenameIndex = code.indexOf(filenameKey);
            if (filenameIndex >= 0) {
                return this.replaceFilename((text) => this.renderer.code(text, language, isEscaped), code, filenameKey, filenameIndex);
            }
            const switchKey = '@@switch';
            const switchIndex = code.indexOf(switchKey);
            if (switchIndex >= 0) {
                const result = this.parseSwitcher((text, lang) => this.renderer.code(text, lang, isEscaped), code, switchKey, switchIndex, switcherKey);
                return this.escapeBrackets(result);
            }
            let output = originalCodeRenderer.call(this.renderer, code, language, isEscaped);
            output = switcherKey ? output : this.appendEmptyLine(output);
            return this.escapeBrackets(output);
        };
        const originalLinkRenderer = this.renderer.link;
        this.renderer.link = (href, title, text) => {
            if (!href.includes('http') && !href.includes('mailto')) {
                return originalLinkRenderer.call(this.renderer, href, title, text);
            }
            return originalLinkRenderer.call(this.renderer, href, title, text);
        };
        const originalHeadingRenderer = this.renderer.heading.bind(this.renderer);
        this.renderer.heading = (...args) => {
            let text = originalHeadingRenderer(...args);
            if (!text.includes('h4')) {
                return text;
            }
            const startIndex = text.indexOf('<h') + 3;
            text = this.insertText(text, startIndex, ` appAnchor`);
            text = this.insertText(text, text.indexOf('">') + 2, '<span>');
            return this.insertText(text, text.length - 6, '</span>');
        };
        const originalBlockquoteRenderer = this.renderer.blockquote.bind(this.renderer);
        this.renderer.blockquote = (quote) => {
            let text = originalBlockquoteRenderer(quote);
            text = text.replace('<p>', '');
            text = text.replace('</p>', '');
            const blockquoteTag = '<blockquote>';
            text = text.replace('<blockquote>', '<blockquote class="warning">');
            //   text = insertText(text, blockquoteTag.length - 1, ` class="`);
            //   text = insertText(text, text.indexOf('<strong>'), '">');
            return text;
        };
    }
};
MarkdownParserService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [])
], MarkdownParserService);
exports.MarkdownParserService = MarkdownParserService;
//# sourceMappingURL=markdown-reader.service.js.map