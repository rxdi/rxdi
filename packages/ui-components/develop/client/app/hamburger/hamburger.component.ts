import { Component, LitElement, html } from '@rxdi/lit-html';

@Component({
  selector: 'hamburger-details-view',
  template() {
    return html`
      <h1>Hamburger Component</h1>
      <hamburger-component
        enableBackendStatistics=${true}
      ></hamburger-component>
    `;
  }
})
export class HamburgerViewComponent extends LitElement {}
