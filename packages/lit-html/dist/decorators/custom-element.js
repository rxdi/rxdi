"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateSelector = (selector) => {
    if (selector.indexOf('-') <= 0) {
        throw new Error('You need at least 1 dash in the custom element name!');
    }
};
exports.CustomElement = (config) => cls => {
    validateSelector(config.selector);
    if (!config.template) {
        throw new Error('You need to pass a template for the element');
    }
    const template = document.createElement('template');
    if (config.style) {
        config.template = `<style>${config.style}</style> ${config.template}`;
    }
    template.innerHTML = config.template;
    const connectedCallback = cls.prototype.connectedCallback || function () { };
    cls.prototype.connectedCallback = function () {
        // Check if element is pure HTMLElement or LitElement
        if (!this.performUpdate) {
            const clone = document.importNode(template.content, true);
            if (config.useShadow) {
                this.attachShadow({ mode: 'open' }).appendChild(clone);
            }
            else {
                this.appendChild(clone);
            }
        }
        connectedCallback.call(this);
    };
    window.customElements.define(config.selector, cls);
};
