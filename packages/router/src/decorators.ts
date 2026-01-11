/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Define getter to `this.location.params` from component `this` and assign params to decorated property
 * 
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
export function RouteParams() {
  return function (target: HTMLElement, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return this.location.params;
      },
    });
  };
}
