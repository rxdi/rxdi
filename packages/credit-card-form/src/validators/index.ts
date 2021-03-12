import { convertCard } from '../helpers';

export class Validators {
 public static CreditCard(element: HTMLInputElement) {
  const regex = /^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;

  if (!regex.test(convertCard(element.value))) {
   element.classList.add('is-invalid');
   return {
    key: 'email-validator',
    message: 'Credit card number is invalid valid example xxxx-xxxx-xxxx-xxxx',
   };
  }
  element.classList.remove('is-invalid');
 }

 public static CreditCardMask(element: HTMLInputElement) {
  element.value = element.value.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ');
 }

 public static ExpiryMask(element: HTMLInputElement) {
  element.value = element.value
   .replace(/\W/gi, '')
   .replace(/(.{2})/g, '$1/')
   .slice(0, 5);
 }
}
