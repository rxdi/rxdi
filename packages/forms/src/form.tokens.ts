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
  customElements?: string[]
}

export interface FormInputOptions {
  [key: string]: [string, Function[]];
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
  'valueMissing'
]);
export type InputValidityState = keyof typeof InputValidityState;
