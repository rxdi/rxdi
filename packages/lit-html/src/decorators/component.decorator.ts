import { CSSResult } from '../lit-element/lib/css-tag';
import { TemplateResult, html, render as renderer } from '../lit-html/lit-html';
import { RXDIElement } from './tokens';

interface CustomElementConfig<T> {
  selector: string;
  template?: (self: T) => TemplateResult;
  style?: CSSResult;
  styles?: CSSResult[];
  useShadow?: boolean;
  extends?: string;
  container?: Element | DocumentFragment;
  providers?: Function[];
}

// From the TC39 Decorators proposal
interface ClassDescriptor {
  kind: 'class';
  elements: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
}

// From the TC39 Decorators proposal
interface ClassElement {
  kind: 'field' | 'method';
  key: PropertyKey;
  placement: 'static' | 'prototype' | 'own';
  initializer?: Function;
  extras?: ClassElement[];
  finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
  descriptor?: PropertyDescriptor;
}
type Constructor<T> = new (...args: unknown[]) => T;

const legacyCustomElement = (
  tagName: string,
  clazz: Constructor<RXDIElement>,
  options: { extends: HTMLElementTagNameMap | string }
) => {
  window.customElements.define(
    tagName,
    clazz,
    options as ElementDefinitionOptions
  );
  return clazz;
};

const standardCustomElement = (
  tagName: string,
  descriptor: ClassDescriptor,
  options: { extends: HTMLElementTagNameMap | string }
) => {
  const { kind, elements } = descriptor;
  return {
    kind,
    elements,
    // This callback is called once the class is otherwise fully defined
    finisher(clazz: Constructor<RXDIElement>) {
      window.customElements.define(
        tagName,
        clazz,
        options as ElementDefinitionOptions
      );
    }
  };
};

// function CustomElement() {
//   return Reflect.construct(HTMLElement, [], CustomElement);
// }
//   Object.setPrototypeOf(CustomElement.prototype, HTMLElement.prototype);
//   Object.setPrototypeOf(CustomElement, HTMLElement);
//   Object.setPrototypeOf(cls, CustomElement);


export const customElement = <T>(
  tag: string,
  config: CustomElementConfig<T> = {} as any
) => (classOrDescriptor: Constructor<RXDIElement> | ClassDescriptor) => {
  if (!tag || (tag && tag.indexOf('-') <= 0)) {
    throw new Error(
      `You need at least 1 dash in the custom element name! ${classOrDescriptor}`
    );
  }
  const cls = classOrDescriptor as any;

  cls.is = () => tag;
  cls.setElement = (document: RXDIElement) => {
    config.container = document;
    return cls;
  };
  config.styles = config.styles || [];
  cls.prototype.getTemplateResult = function() {
    return this;
  };
  const OnInit = cls.prototype.OnInit || function() {};
  const OnDestroy = cls.prototype.OnDestroy || function() {};
  const OnUpdate = cls.prototype.OnUpdate || function() {};
  const OnUpdateFirst = cls.prototype.OnUpdateFirst || function() {};
  const connectedCallback = cls.prototype.connectedCallback || function() {};
  const disconnectedCallback =
    cls.prototype.disconnectedCallback || function() {};
  const update = cls.prototype.update || function() {};
  const firstUpdated = cls.prototype.firstUpdated || function() {};
  if (!config.template) {
    config.template = cls.prototype.render;
  }
  if (config.style) {
    config.styles.push(config.style);
  }
  cls.styles = config.styles;
  cls.subscriptions = new Map();
  cls.prototype.render = config.template;
  const render = cls.prototype.render || function() {};

  cls.prototype.OnInit = function() {
    if (config.container) {
      renderer(config.template.call(this), config.container);
      if (config.style) {
        const style = document.createElement('style');
        style.type = 'text/css';
        if (style['styleSheet']) {
          // This is required for IE8 and below.
          style['styleSheet'].cssText = config.style.toString();
        } else {
          style.appendChild(document.createTextNode(config.style.toString()));
        }
        config.container.prepend(style);
      }
    }
    return OnInit.call(this);
  };
  function mapToSubscriptions() {
    // Override subscribe method so we can set subscription to new Map() later when component is unmounted we can unsubscribe
    Object.keys(this).forEach(observable => {
      if (this[observable] && typeof this[observable].lift === 'function' && typeof this[observable].subscribe === 'function') {
        const original = this[observable].subscribe.bind(this[observable]);
        this[observable].subscribe = (cb, err) => {
          const subscribe = original(cb, err);
          cls.subscriptions.set(subscribe, subscribe);
          return subscribe;
        };
      }
    });
  }
  cls.prototype.disconnectedCallback = function() {
    if (config.providers && config.providers.length) {
      config.providers.forEach(provider => {
        try {
          const rxdi = '@rxdi/core';
          const { Container } = require(rxdi);
          Container.reset(provider);
          Container.remove(provider);
          
        } catch (e) {}
      });
    }
    // Disconnect from all observables when component is about to unmount
    cls.subscriptions.forEach(sub => sub.unsubscribe());
    cls.subscriptions.clear();
    OnDestroy.call(this);
    disconnectedCallback.call(this);
  };
  cls.prototype.render = function() {
    return render.call(this);
  };
  cls.prototype.update = function() {
    update.call(this);
    OnUpdate.call(this);
    mapToSubscriptions.call(this);
  };
  cls.prototype.firstUpdated = function() {
    firstUpdated.call(this);
    OnUpdateFirst.call(this);
    mapToSubscriptions.call(this);
  };
  cls.prototype.connectedCallback = function() {
    if (config.providers && config.providers.length) {
      try {
        const rxdi = '@rxdi/core';
        const { Container } = require(rxdi);
        config.providers.forEach(provider => Container.get(provider));
      } catch (e) {}
    }
    mapToSubscriptions.call(this);
    if (!config.template) {
      config.template = () => html``;
    }
    // Check if element is pure HTMLElement or LitElement
    if (!this.performUpdate) {
      config.template = config.template.bind(this);
      const clone = document.importNode(
        config.template(this).getTemplateElement().content,
        true
      );
      if (config.style) {
        const style = document.createElement('style');
        style.type = 'text/css';
        if (style['styleSheet']) {
          // This is required for IE8 and below.
          style['styleSheet'].cssText = config.style.toString();
        } else {
          style.appendChild(document.createTextNode(config.style.toString()));
        }
        clone.append(style);
      }
      if (config.useShadow) {
        this.attachShadow({ mode: 'open' }).append(clone);
      } else {
        this.appendChild(clone);
      }
    }
    connectedCallback.call(this);
    OnInit.call(this);
  };
  // window.customElements.define(config.selector, cls);
  if (typeof cls === 'function') {
    legacyCustomElement(tag, cls, { extends: config.extends });
  } else {
    standardCustomElement(tag, cls, { extends: config.extends });
  }
  try {
    const rxdi = '@rxdi/core';
    require(rxdi).Component(config)(cls)
  } catch (e) {}
};

export const Component = <T>(config: CustomElementConfig<T>) =>
  customElement(config.selector, config);

// @CustomElement2({
//   selector: 'home-component',
//   style: '',
//   template: (self) => html``,
//   useShadow: true
// })
// export class Pesho {}
