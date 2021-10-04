import { CSSResult, LitElement } from 'lit-element';
import { TemplateResult, html } from 'lit-element';

export interface CustomElementConfig<T> {
  selector: string;
  template?: (self: T) => TemplateResult;
  style?: CSSResult;
  styles?: CSSResult[];
  extends?: string;
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
  clazz: Constructor<LitElement>,
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
    finisher(clazz: Constructor<LitElement>) {
      window.customElements.define(
        tagName,
        clazz,
        options as ElementDefinitionOptions
      );
    },
  };
};

const customElement = <T>(
  tag: string,
  config: CustomElementConfig<T> = {} as CustomElementConfig<T>
) => <K extends new (...args: any[]) => {}>(Base: K) => {
  if (!tag || (tag && tag.indexOf('-') <= 0)) {
    throw new Error(
      `You need at least 1 dash in the custom element name! ${Base}`
    );
  }
  config.styles = config.styles || [];
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
    config.template = Base.prototype.render || (() => html``);
  }

  if (config.style) {
    config.styles.push(config.style);
  }

  const ModifiedClass = class NoName extends Base {
    static styles = config.styles;

    static is() {
      return tag;
    }

    getTemplateResult() {
      return this;
    }

    OnInit() {
      return OnInit.call(this);
    }

    disconnectedCallback() {
      OnDestroy.call(this);
      disconnectedCallback.call(this);
    }

    connectedCallback() {
      connectedCallback.call(this);
      OnInit.call(this);
    }
    render() {
      return config.template.call(this);
    }

    update() {
      update.call(this);
      OnUpdate.call(this);
    }

    firstUpdated() {
      firstUpdated.call(this);
      OnUpdateFirst.call(this);
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
