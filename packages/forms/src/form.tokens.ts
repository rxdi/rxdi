import { LitElement } from '@rxdi/lit-html';
import { Observable } from 'rxjs';

export type FormStrategies = keyof WindowEventMap;
export interface FormOptions {
  /** Name of the form element */
  name: string;
  /** Event type on which form will be triggered 'blur', 'change'*/
  strategy?: FormStrategies;
  /** Multiple input elements like checkboxes with the same name will be binded together */
  multi?: boolean;
  /** When set to true `.valueChanges` will emit values only
   * if current input validation passes, default behavior is to emit every change fro */
  strict?: boolean;

  /**
   * When set form will expand capabilities by selecting another custom element made as a form element
   * Example can be found here https://gist.github.com/Stradivario/57acf0fa19900867a7f55b0f01251d6e
   * */
  customElements?: string[];
  /**
   * Internal property for handling nested forms.
   */
  namespace?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AbstractControl<T = any> {
  setOptions(options: FormOptions): this | void;
  getOptions(): FormOptions;
  init(): void;
  setParentElement(parent: LitElement): this | void;
  setFormElement(form: HTMLFormElement): this | void;
  unsubscribe(): void;
  valueChanges: Observable<T>;
  value: T;
  valid: boolean;
  invalid: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateValueAndValidity?(): Promise<any>;
  name?: string;
  push?(control: AbstractControl): void;
  getFormElement?(): HTMLFormElement;
}

export type ValidatorFn = (
  element: AbstractInput | HTMLInputElement
) => Promise<InputErrorMessage | void> | InputErrorMessage | void;

export interface FormInputOptions {
  [key: string]: [string | number | boolean | Date, ValidatorFn[]];
}

export interface InputErrorMessage<T = any> {
  key: T;
  message: string;
}

export interface ErrorObject {
  element: HTMLInputElement;
  errors: InputErrorMessage[];
}

export interface AbstractInput extends HTMLInputElement {
  valid?: boolean;
  invalid?: boolean;
  dirty?: boolean;
  touched?: boolean;
}

function strEnum<T extends string>(o: Array<T>): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export const InputValidityState = strEnum([
  'badInput',
  'customError',
  'patternMismatch',
  'rangeOverflow',
  'rangeUnderflow',
  'stepMismatch',
  'tooLong',
  'tooShort',
  'typeMismatch',
  'valid',
  'valueMissing',
]);
export type InputValidityState = keyof typeof InputValidityState;
