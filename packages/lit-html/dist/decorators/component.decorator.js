"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const lit_html_1 = require("../lit-html/lit-html");
const rxjs_1 = require("rxjs");
const legacyCustomElement = (tagName, clazz, options) => {
    window.customElements.define(tagName, clazz, options);
    return clazz;
};
const standardCustomElement = (tagName, descriptor, options) => {
    const { kind, elements } = descriptor;
    return {
        kind,
        elements,
        // This callback is called once the class is otherwise fully defined
        finisher(clazz) {
            window.customElements.define(tagName, clazz, options);
        }
    };
};
// function CustomElement() {
//   return Reflect.construct(HTMLElement, [], CustomElement);
// }
//   Object.setPrototypeOf(CustomElement.prototype, HTMLElement.prototype);
//   Object.setPrototypeOf(CustomElement, HTMLElement);
//   Object.setPrototypeOf(cls, CustomElement);
const unfreezeRouterWhenUnmounted = () => {
    let outlet;
    try {
        outlet = core_1.Container.get('router-outlet').getValue();
        outlet.unfreezeRouter();
    }
    catch (e) { }
};
exports.customElement = (tag, config = {}) => (classOrDescriptor) => {
    if (!tag || (tag && tag.indexOf('-') <= 0)) {
        throw new Error(`You need at least 1 dash in the custom element name! ${classOrDescriptor}`);
    }
    const cls = classOrDescriptor;
    cls.is = () => tag;
    cls.setElement = (document) => {
        config.container = document;
        return cls;
    };
    config.styles = config.styles || [];
    cls.prototype.getTemplateResult = function () {
        return this;
    };
    const OnInit = cls.prototype.OnInit || function () { };
    const OnDestroy = cls.prototype.OnDestroy || function () { };
    const OnUpdate = cls.prototype.OnUpdate || function () { };
    const OnUpdateFirst = cls.prototype.OnUpdateFirst || function () { };
    const connectedCallback = cls.prototype.connectedCallback || function () { };
    const disconnectedCallback = cls.prototype.disconnectedCallback || function () { };
    const update = cls.prototype.update || function () { };
    const firstUpdated = cls.prototype.firstUpdated || function () { };
    if (!config.template) {
        config.template = cls.prototype.render;
    }
    if (config.style) {
        config.styles.push(config.style);
    }
    cls.styles = config.styles;
    cls.subscriptions = new Map();
    cls.prototype.render = config.template;
    const render = cls.prototype.render || function () { };
    cls.prototype.OnInit = function () {
        if (config.container) {
            lit_html_1.render(config.template.call(this), config.container);
            if (config.style) {
                const style = document.createElement('style');
                style.type = 'text/css';
                if (style['styleSheet']) {
                    // This is required for IE8 and below.
                    style['styleSheet'].cssText = config.style.toString();
                }
                else {
                    style.appendChild(document.createTextNode(config.style.toString()));
                }
                config.container.prepend(style);
            }
        }
        return OnInit.call(this);
    };
    cls.prototype.disconnectedCallback = function () {
        if (config.providers && config.providers.length) {
            config.providers.forEach(provider => {
                console.log(provider, 'Will be removed')
                core_1.Container.reset(provider);
                core_1.Container.remove(provider);
            });
        }
        // Disconnect from all observables when component is about to unmount
        cls.subscriptions.forEach(sub => sub.unsubscribe());
        OnDestroy.call(this);
        disconnectedCallback.call(this);
        unfreezeRouterWhenUnmounted();
    };
    cls.prototype.render = function () {
        return render.call(this);
    };
    cls.prototype.update = function () {
        update.call(this);
        OnUpdate.call(this);
    };
    cls.prototype.firstUpdated = function () {
        firstUpdated.call(this);
        OnUpdateFirst.call(this);
    };
    cls.prototype.connectedCallback = function () {
        if (config.providers && config.providers.length) {
            console.log(config.providers)
            config.providers.forEach(provider => core_1.Container.get(provider));
        }
        // Override subscribe method so we can set subscription to new Map() later when component is unmounted we can unsubscribe
        Object.keys(this).forEach(observable => {
            if (rxjs_1.isObservable(this[observable])) {
                const original = this[observable].subscribe.bind(this[observable]);
                this[observable].subscribe = (cb, err) => {
                    const subscribe = original(cb, err);
                    cls.subscriptions.set(subscribe, subscribe);
                    return subscribe;
                };
            }
        });
        if (!config.template) {
            config.template = () => lit_html_1.html ``;
        }
        // Check if element is pure HTMLElement or LitElement
        if (!this.performUpdate) {
            config.template = config.template.bind(this);
            const clone = document.importNode(config.template(this).getTemplateElement().content, true);
            if (config.style) {
                const style = document.createElement('style');
                style.type = 'text/css';
                if (style['styleSheet']) {
                    // This is required for IE8 and below.
                    style['styleSheet'].cssText = config.style.toString();
                }
                else {
                    style.appendChild(document.createTextNode(config.style.toString()));
                }
                clone.append(style);
            }
            if (config.useShadow) {
                this.attachShadow({ mode: 'open' }).append(clone);
            }
            else {
                this.appendChild(clone);
            }
        }
        connectedCallback.call(this);
        OnInit.call(this);
    };
    // window.customElements.define(config.selector, cls);
    if (typeof cls === 'function') {
        legacyCustomElement(tag, cls, { extends: config.extends });
    }
    else {
        standardCustomElement(tag, cls, { extends: config.extends });
    }
    core_1.Component(config)(cls);
};
exports.Component = (config) => exports.customElement(config.selector, config);
// @CustomElement2({
//   selector: 'home-component',
//   style: '',
//   template: (self) => html``,
//   useShadow: true
// })
// export class Pesho {}
