import { InputErrorTemplate } from './error-template';
import { Form, FormGroup } from '@rxdi/forms';
import { Component, css, html, LitElement, property } from '@rxdi/lit-html';
import { InputStyle } from '@rxdi/ui-kit/styles/form/input';

import { convertModel } from '../helpers';
import { Validators } from '../validators';
import { CardModel } from './model';

/**
 * @customElement credit-card-form
 */
@Component({
 selector: 'credit-card-form',
 style: css`
  ${InputStyle}
  p {
   margin: 0px;
   padding: 0px;
  }

  .credit-card-container {
   padding-bottom: 60px;
  }
 `,
 template(this: CreditCardFormComponent) {
  return html`
   <div class="credit-card-container">
    <credit-card
     .cvc=${this.form.value.cvc}
     .expiry=${this.form.value.expiry}
     .name=${this.form.value.name}
     .number=${this.form.value.card}
     .flipped=${this.flipped}
    ></credit-card>
   </div>
   <form
    class="form"
    novalidate
    name="credit-card-details"
    @submit=${() => {
     if (!this.form.updateValueAndValidity().length) {
      this.dispatchEvent(
       new CustomEvent('submit', { detail: convertModel(this.form.value) }),
      );
     }
    }}
   >
    <p>Credit Card Number</p>
    <input
     class="rx-input"
     name="card"
     type="tel"
     required
     inputmode="numeric"
     autocomplete="cc-number"
     maxlength="19"
     placeholder="xxxx xxxx xxxx xxxx"
    />
    <div style="height:30px;">${InputErrorTemplate(this.form.get('card'))}</div>

    <p>Cardholder Name</p>
    <input required class="rx-input" type="text" name="name" />
    <div style="height:30px;">${InputErrorTemplate(this.form.get('name'))}</div>

    <p>Card Expiry</p>
    <input
     required
     placeholder="MM/YY"
     maxlength="5"
     class="rx-input"
     type="text"
     name="expiry"
    />
    <div style="height:30px;">${InputErrorTemplate(this.form.get('expiry'))}</div>

    <p>CVC Number</p>
    <input
     @focusout=${() => {
      this.flipped = false;
     }}
     @focus=${() => {
      this.flipped = true;
     }}
     placeholder="CVC"
     maxlength="3"
     class="rx-input"
     type="text"
     required
     name="cvc"
    />
    <div style="height:30px;">${InputErrorTemplate(this.form.get('cvc'))}</div>

    <rx-button type="submit">Submit form</rx-button>
   </form>
  `;
 },
})
export class CreditCardFormComponent extends LitElement {
 @property({ type: Boolean })
 private flipped: boolean;

 @Form({
  name: 'credit-card-details',
  strategy: 'input',
 })
 form = new FormGroup<CardModel>({
  card: ['', [Validators.CreditCard, Validators.CreditCardMask]],
  name: [''],
  lastName: [''],
  expiry: ['', [Validators.ExpiryMask]],
  cvc: [''],
 } as never);
}
