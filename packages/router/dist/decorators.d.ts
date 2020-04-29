/**
 * Define getter to `this.location.params` from component `this` and assign params to decorated property
 *
 * Info can be found at @vaadin-router https://vaadin.github.io/vaadin-router/vaadin-router/demo/#vaadin-router-route-parameters-demos
 * @param target: LitElement | HTMLElement
 * @returns this.location.params as getter (lazy evaluated)
 * Usage:
 *
 *
```
{path: '/profile/:name', component: 'x-user-profile'},

import { customElement, LitElement } from '@rxdi/lit-html';

@customElement('x-user-profile')
export class UserProfile extends LitElement {

  @RouteParams()
  params: { name: string }

  render() {
    return html`${this.params.name}`;
  }
}
```
   */
export declare function RouteParams(): (target: Object, propertyKey: string) => void;
