export declare type FormStrategies = keyof WindowEventMap;
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
export declare const InputValidityState: {
    badInput: "badInput";
    customError: "customError";
    patternMismatch: "patternMismatch";
    rangeOverflow: "rangeOverflow";
    rangeUnderflow: "rangeUnderflow";
    stepMismatch: "stepMismatch";
    tooLong: "tooLong";
    tooShort: "tooShort";
    typeMismatch: "typeMismatch";
    valid: "valid";
    valueMissing: "valueMissing";
};
export declare type InputValidityState = keyof typeof InputValidityState;
