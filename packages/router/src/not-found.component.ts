import { html, Component } from '@rxdi/lit-html';

@Component({
  selector: 'not-found-component-rxdi',
  useShadow: true,
  template: () => html`
    <h1>Not found component!</h1>
    <p>Please check your URL.2222daad</p>
  `
})
export class NotFoundComponent extends HTMLElement {}

export const NotFoundPathConfig = {
  path: '(.*)',
  component: 'not-found-component-rxdi'
};
