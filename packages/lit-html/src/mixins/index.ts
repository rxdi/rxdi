import { LitElement } from '../lit-element/lit-element';

export class BaseComponent extends LitElement {
  createRenderRoot() {
    return this;
  }
}
