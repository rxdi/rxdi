import { Injector } from '@rxdi/core';
import { LitElement, customElement, html, property } from '@rxdi/lit-html';
import { RouterRoutlet, RouterInitialized } from './injection.tokens';

@customElement(RouterRoutlet)
export class RouterComponent extends LitElement {

  @Injector(RouterInitialized) private routerInitialized: RouterInitialized;

  @property() id: string = RouterRoutlet;

  connectedCallback() {
    super.connectedCallback();
    this.routerInitialized.next(this);
  }

  render() {
    return html`
      <slot name="header"></slot>
      ${html`
        <main id="${this.id}"></main>
      `}
      <slot name="footer"></slot>
    `;
  }
}
