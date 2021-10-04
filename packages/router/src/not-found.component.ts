import { html, Component, LitElement } from '@rxdi/lit-html';

@Component({
 selector: 'not-found-component-rxdi',
 template: () => html`
  <h1>Not found component!</h1>
  <p>Please check your URL.2222daad</p>
 `,
})
export class NotFoundComponent extends LitElement {}

export const NotFoundPathConfig = {
 path: '(.*)',
 component: 'not-found-component-rxdi',
};
