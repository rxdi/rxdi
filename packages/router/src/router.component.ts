import { Container } from "@rxdi/core";
import { LitElement, html, property, Component } from "@rxdi/lit-html";
import { Route, RouterOptions, Routes } from "./injection.tokens";
import { Outlet } from "./outlet";

/**
 * @customElement router-outlet
 */
@Component({
  selector: "router-outlet",
  template(this: RouterComponent) {
    return html`
      <slot name="header"></slot>
      ${html` <main id="${this.id}"></main> `}
      <slot name="footer"></slot>
    `;
  },
})
export class RouterComponent extends LitElement {
  @property() id: string = "router-identifier";

  @property({ type: Array }) routes: Route[];

  OnUpdateFirst() {
    const router = new Outlet(this.shadowRoot.getElementById(this.id), Container.get(RouterOptions));
    router.setRoutes(this.routes ? this.routes : Container.get(Routes));

    Container.set('router-outlet', router);
    this.dispatchEvent(new CustomEvent('onRouterLoaded', {detail: router}))
  }
}
