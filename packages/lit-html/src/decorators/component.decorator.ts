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
  unsubscribeOnDestroy?: boolean;
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
    },
  };
};

export const customElement = <T>(
  tag: string,
  config: CustomElementConfig<T> = {} as CustomElementConfig<T>
) => <K extends new (...args: any[]) => {}>(Base: K) => {
  if (!tag || (tag && tag.indexOf('-') <= 0)) {
    throw new Error(
      `You need at least 1 dash in the custom element name! ${Base}`
    );
  }
  config.styles = config.styles || [];
  if (!('unsubscribeOnDestroy' in config)) {
    config.unsubscribeOnDestroy = true;
  }
  const OnInit = Base.prototype.OnInit || function () {};
  const OnDestroy = Base.prototype.OnDestroy || function () {};
  const OnUpdate = Base.prototype.OnUpdate || function () {};
  const OnUpdateFirst = Base.prototype.OnUpdateFirst || function () {};
  const connectedCallback = Base.prototype.connectedCallback || function () {};
  const disconnectedCallback =
    Base.prototype.disconnectedCallback || function () {};
  const update = Base.prototype.update || function () {};
  const firstUpdated = Base.prototype.firstUpdated || function () {};

  if (!config.template) {
    config.template = Base.prototype.render;
  }
  if (config.style) {
    config.styles.push(config.style);
  }

  const ModifiedClass = class NoName extends Base {
    static styles = config.styles;
    static subscriptions = new Map();
    constructor(...args: any[]) {
      super(...args);
    }

    static is() {
      return tag;
    }
    static setElement = (document: RXDIElement) => {
      config.container = document;
      return Base;
    };

    getTemplateResult() {
      return this;
    }

    OnInit() {
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
    }

    mapToSubscriptions() {
      // Override subscribe method so we can set subscription to new Map() later when component is unmounted we can unsubscribe
      Object.keys(this).forEach((observable) => {
        if (
          this[observable] &&
          typeof this[observable].lift === 'function' &&
          typeof this[observable].subscribe === 'function'
        ) {
          const original = this[observable].subscribe.bind(this[observable]);
          this[observable].subscribe = (cb, err) => {
            const subscribe = original(cb, err);
            NoName.subscriptions.set(subscribe, subscribe);
            return subscribe;
          };
        }
      });
    }
    disconnectedCallback() {
      // Disconnect from all observables when component is about to unmount
      if (config.unsubscribeOnDestroy) {
        NoName.subscriptions.forEach((sub) => sub.unsubscribe());
        NoName.subscriptions.clear();
      }
      OnDestroy.call(this);
      disconnectedCallback.call(this);
    }

    connectedCallback() {
      if (config.unsubscribeOnDestroy) {
        this.mapToSubscriptions.call(this);
      }
      if (!config.template) {
        config.template = () => html``;
      }
      // Check if element is pure HTMLElement or LitElement
      if (!this['performUpdate']) {
        config.template = config.template.bind(this);
        const clone = document.importNode(
          config.template(this as never).getTemplateElement().content,
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
          this['attachShadow']({ mode: 'open' }).append(clone);
        } else {
          this['appendChild'](clone);
        }
      }
      connectedCallback.call(this);
      OnInit.call(this);
    }
    render() {
      return config.template.call(this);
    }

    update() {
      update.call(this);
      OnUpdate.call(this);
      if (config.unsubscribeOnDestroy) {
        this.mapToSubscriptions.call(this);
      }
    }

    firstUpdated() {
      firstUpdated.call(this);
      OnUpdateFirst.call(this);
      if (config.unsubscribeOnDestroy) {
        this.mapToSubscriptions.call(this);
      }
    }
  };

  if (typeof ModifiedClass === 'function') {
    legacyCustomElement(tag, ModifiedClass as never, {
      extends: config.extends,
    });
  } else {
    standardCustomElement(tag, ModifiedClass, { extends: config.extends });
  }
  return ModifiedClass;
};

export const Component = <T>(config: CustomElementConfig<T>) =>
  customElement(config.selector, config);
