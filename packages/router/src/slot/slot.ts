import { property, html, Component, LitElement, query } from '@rxdi/lit-html';
import { IRoute, RouterSlot } from 'router-slot';

import 'router-slot';


/**
 * @customElement router-slots
 */
@Component({
  selector: 'router-slots',
  template(this: RouterSlots) {
    return html`
      <router-slot></router-slot>
    `;
  }
})
export class RouterSlots extends LitElement {
  @property({ type: Array })
  public slots: IRoute[] = [];

  @query('router-slot')
  private routerSlot: RouterSlot;

  OnUpdate() {
    this.routerSlot.add(this.slots);
  }
}