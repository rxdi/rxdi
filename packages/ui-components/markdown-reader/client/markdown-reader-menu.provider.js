"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const rxjs_1 = require("rxjs");
let MarkdownParserMenuProvider = class MarkdownParserMenuProvider {
    constructor() {
        this.menu = new rxjs_1.BehaviorSubject([]);
        this.scrollTopOffset = 100;
    }
    setItems(items) {
        this.menu.next(items);
    }
    clearMenu() {
        this.menu.next([]);
    }
    addItem(item) {
        this.menu.next([...this.menu.getValue(), item]);
    }
    lookupHeadings(contentReference) {
        if (!contentReference) {
            return;
        }
        const headings = contentReference.querySelectorAll('h3, h4');
        const removeAnchor = (text) => {
            const anchorId = text && text.indexOf('#');
            return anchorId >= 0 ? text.slice(0, anchorId) : text;
        };
        const heads = Array.from(headings).map((item) => ({
            offsetTop: item.offsetTop,
            textContent: removeAnchor(item.textContent),
            elementRef: item
        }));
        if (heads && heads.length) {
            const index = this.findCurrentHeading(headings);
            this.setItems([
                ...heads.map(e => ({
                    elementRef: e.elementRef,
                    title: e.textContent
                }))
            ]);
            if (index > 0) {
                this.navigateToAnchor(heads[index].elementRef);
            }
        }
    }
    findCurrentHeading(headings) {
        const marginOffset = 15;
        for (let i = 0; i < headings.length; i++) {
            if (headings.length - 1 === i) {
                return (this.activeId = i);
            }
            else if (headings[i + 1].offsetTop >=
                window.pageYOffset + this.scrollTopOffset + marginOffset) {
                return (this.activeId = i);
            }
        }
    }
    navigateToAnchor(elementRef) {
        if (elementRef) {
            window.scroll({
                top: elementRef.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }
};
MarkdownParserMenuProvider = __decorate([
    core_1.Injectable()
], MarkdownParserMenuProvider);
exports.MarkdownParserMenuProvider = MarkdownParserMenuProvider;
//# sourceMappingURL=markdown-reader-menu.provider.js.map