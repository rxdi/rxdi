import { AbstractInput /* InputValidityState */ } from '@rxdi/forms';
import { html } from '@rxdi/lit-html';

// import { translate } from '../i18n/translate';

export function InputErrorTemplate(input: any) {
 if (input && input.invalid && (input.touched || input.dirty)) {
  const message = input.validationMessage;
  // const key = Object.keys(InputValidityState).filter(o => input.validity[o])[0];
  // message = translate(key, 'bg_BG');
  input.classList.add('is-invalid');
  return html`
   <style>
    .validation-error {
     color: #a94442;
     font-size: 12px;
    }
   </style>
   <span style="padding-top: 5px;color: #a94442" class="validation-error"
    >${message}</span
   >
  `;
 }

 input && input.classList.remove('is-invalid');
 return '';
}
