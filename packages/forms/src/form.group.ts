/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement } from '@rxdi/lit-html';
import { BehaviorSubject, Subscription } from 'rxjs';

import {
  AbstractControl,
  AbstractInput,
  ErrorObject,
  FormInputOptions,
  FormOptions,
  InputValidityState,
  NestedKeyOf,
  UnwrapValue,
  ValidatorFn,
  DeepPropType,
} from './form.tokens';

export class FormGroup<T = FormInputOptions, E = { [key: string]: never }> implements AbstractControl<UnwrapValue<T>> {
  public validators: Map<string, ValidatorFn[]> = new Map();
  public valid = true;
  public invalid = false;
  public errors: UnwrapValue<T> = {} as UnwrapValue<T>;
  private controls: Map<keyof T, AbstractControl> = new Map();

  private readonly _valueChanges: BehaviorSubject<UnwrapValue<T>>;
  private form: HTMLFormElement;
  private errorMap = new Map();
  private inputs: Map<keyof T, AbstractInput> = new Map();
  private options: FormOptions = {} as FormOptions;
  private parentElement: LitElement;
  private subscriptions: Map<keyof T, Subscription> = new Map();

  constructor(value?: T, errors?: E) {
    this._valueChanges = new BehaviorSubject<UnwrapValue<T>>(value as never);
    if (value) {
      Object.keys(value).forEach((key) => {
        if (
          typeof value[key] === 'object' &&
          value[key] !== null &&
          (value[key]['controls'] || value[key]['push']) &&
          value[key]['valueChanges']
        ) {
          // It's likely a FormGroup or FormArray
          const control = value[key] as AbstractControl;
          if (control.name === '' || control.name === undefined) {
            control.name = key;
          }
          this.controls.set(key as keyof T, control);
          if (control.valueChanges) {
            this.subscriptions.set(
              key as keyof T,
              control.valueChanges.subscribe(() => {
                this._valueChanges.next(this.value);
              })
            );
          }
        }
      });
    }
  }

  public init() {
    this.setFormElement(this.querySelectForm(this.parentElement.shadowRoot || this.parentElement)).setInputs(
      this.mapEventToInputs(this.querySelectorAllInputs())
    );
    this.controls.forEach((c) => {
      if (c.init) c.init();
    });
  }

  public prepareValues() {
    Object.keys(this.value).forEach((v) => {
      // Skip nested controls
      if (this.controls.has(v as keyof T)) return;

      const value = this.value[v];
      this.errors[v] = this.errors[v] || {};
      if (value && value.constructor === Array) {
        if (value[1] && value[1].constructor === Array) {
          value[1].forEach((val) => {
            const oldValidators = this.validators.get(v) || [];
            this.validators.set(v, [...oldValidators, val]);
          });
        }
        if (value[0] === undefined || value[0] === null) {
          (this.value[v] as unknown) = '';
        } else if (
          value[0].constructor === String ||
          value[0].constructor === Number ||
          value[0].constructor === Boolean
        ) {
          (this.value[v] as unknown) = value[0];
        } else {
          throw new Error(`Input value must be of type 'string', 'boolean' or 'number'`);
        }
      }
    });
    return this;
  }

  public setParentElement(parent: LitElement) {
    this.parentElement = parent;

    this.controls.forEach((c) => {
      if (c.setParentElement) {
        c.setParentElement(parent);
      }
    });
    return this;
  }

  public getParentElement() {
    return this.parentElement;
  }

  public setOptions(options: FormOptions) {
    this.options = options;
    this.controls.forEach((c) => {
      if (c.setOptions) {
        c.setOptions({
          ...options,
          namespace: this.options.namespace ? `${this.options.namespace}.${c.name}` : c.name,
        });
      }
    });
    return this;
  }

  public getOptions(): FormOptions {
    return this.options;
  }

  public get valueChanges() {
    return this._valueChanges.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async updateValueAndValidity(): Promise<(ErrorObject | { message: string })[]> {
    this.resetErrors();
    const inputs = await Promise.all(
      this.querySelectorAllInputs().map(async (i) => {
        i.setCustomValidity('');
        this.setElementValidity(i);
        this.setElementDirty(i);
        return await this.validate(i);
      })
    );

    for (const [key, control] of this.controls.entries()) {
      if (control.updateValueAndValidity) {
        await control.updateValueAndValidity();
        if (control.invalid) {
          this.invalid = true;
          this.valid = false;
        }
      }
    }

    this.getParentElement().requestUpdate();
    return inputs.filter((e) => e.errors.length) || (this.invalid ? [{ message: 'Invalid Form' }] : []);
  }

  private updateValueAndValidityOnEvent(method: (event: { target: AbstractInput }) => void) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return async function (this: AbstractInput, event: { target: AbstractInput }) {
      self.setElementDirty(this);
      const selector = `input[name="${this.name}"]`;
      const hasMultipleBindings = [
        ...(self.getFormElement().querySelectorAll(selector) as unknown as Map<string, NodeListOf<Element>>).values(),
      ].length;
      let value = this.value as unknown;

      if (hasMultipleBindings === 1) {
        if (this.type === 'radio') {
          value = String(this.checked);
        }

        if (this.type === 'checkbox') {
          value = this.checked;
        }
      }

      if (this.type === 'number') {
        value = Number(value);
      }

      const inputsWithBindings = [
        ...(
          (<never>self.getFormElement().querySelectorAll(`input[name="${this.name}"]:checked`)) as Map<
            string,
            AbstractInput
          >
        ).values(),
      ];

      if (hasMultipleBindings > 1) {
        if (!self.options.multi && this.type === 'checkbox') {
          value = inputsWithBindings.map((e) => e.value);
        }

        if (self.options.multi) {
          inputsWithBindings.forEach((el) => (el.checked = false));
          this.checked = true;
        }
      }

      self.resetErrors();
      const isValid = self.applyValidationContext(await self.validate(this));
      if (self.options.strict) {
        if (isValid) {
          await self.setElementValidity(this, isValid);
          self.setValue(self.getModelKeyName(this.name) as keyof T, value);
        }
        self.parentElement.requestUpdate();
        return method.call(self.parentElement, event);
      }
      await self.setElementValidity(this, isValid);
      self.setValue(self.getModelKeyName(this.name) as keyof T, value);
      self.parentElement.requestUpdate();
      return method.call(self.parentElement, event);
    };
  }

  applyValidationContext({ errors, element }: ErrorObject) {
    const form = this.getFormElement();
    if (errors.length) {
      this.invalid = form['invalid'] = true;
      this.valid = form['valid'] = false;
      return false;
    } else {
      this.errors[this.getModelKeyName(element.name)] = {} as E;
      this.invalid = form['invalid'] = !form.checkValidity();
      this.valid = form['valid'] = form.checkValidity();
      return true;
    }
  }

  public querySelectForm(shadowRoot: HTMLElement | ShadowRoot): HTMLFormElement {
    if (this.options['form']) {
      return this.options['form'] as HTMLFormElement;
    }
    const form = shadowRoot.querySelector(`form[name="${this.options.name}"]`) as HTMLFormElement;
    if (!form) {
      throw new Error(
        `Form element with name "${this.options.name}" not present inside ${
          this.getParentElement().outerHTML
        } component`
      );
    }
    form.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    });
    return form;
  }

  private querySelectAll(name: string) {
    return [...((<never>this.form.querySelectorAll(name)) as Map<string, AbstractInput>).values()];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public querySelectorAllInputs(): AbstractInput[] {
    return [...(this.options.customElements ?? []), 'input', 'select', 'textarea']
      .map((item) => this.querySelectAll(item))
      .flat()
      .filter((el) => this.isInputPresentOnStage(el))
      .filter((el) => !!el.name);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public mapEventToInputs(inputs: HTMLElement[] = []): AbstractInput[] {
    return inputs.map((el: AbstractInput) => {
      const strategy = `on${this.options.strategy}`;
      if (!el[strategy]) {
        el[strategy] = function () {
          //
        };
      }
      const customAttributes = Object.keys(el.attributes)
        .map((k) => (el.attributes[k].name.startsWith('#') ? el.attributes[k] : null))
        .filter((i) => !!i);
      if (customAttributes.length) {
        const attr = customAttributes.find((a) => a.name.startsWith('#'));
        this.parentElement[attr.name.replace('#', '')] = el;
      }
      el.addEventListener('blur', async () => {
        this.setElementDirty(el);
        await this.parentElement.requestUpdate();
        await this.setElementValidity(el);
      });
      el[strategy] = this.updateValueAndValidityOnEvent(el[strategy]);
      return el;
    });
  }

  async setElementValidity(el: AbstractInput, validity?: boolean) {
    const isValid = validity || this.applyValidationContext(await this.validate(el));
    el['valid'] = isValid;
    el['invalid'] = !isValid;
  }

  setElementDirty(input: AbstractInput) {
    input['touched'] = true;
    input['dirty'] = true;
  }

  public isInputPresentOnStage(input: AbstractInput) {
    if (input.outerHTML === '<input type="submit" style="display: none;">') {
      return 0;
    }
    const keyIndex = this.getModelKeyName(input.name);
    const isInputPresent = Object.keys(this.value).filter((v) => v === keyIndex);
    return isInputPresent.length;
  }

  private getModelKeyName(domName: string): string {
    if (this.options['namespace']) {
      // pattern: namespace[key] or namespace.key
      // Example: allowedIps[0].ip -> namespace=allowedIps[0] -> key=ip
      if (domName.startsWith(this.options['namespace'])) {
        const suffix = domName.replace(this.options['namespace'], '');
        // Handle .key or [key]
        if (suffix.startsWith('.')) {
          return suffix.substring(1);
        }
        if (suffix.startsWith('[')) {
          return suffix.substring(1, suffix.length - 1); // Not dealing with that yet
        }
      }
      return domName;
    }
    return domName;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async validate(element: AbstractInput): Promise<ErrorObject> {
    let errors = [];

    element.setCustomValidity('');
    if (!element.checkValidity()) {
      return {
        errors: errors.concat(
          Object.keys(InputValidityState)
            .map((key) => (element.validity[key] ? { key, message: element.validationMessage } : null))
            .filter((i) => !!i)
        ),
        element,
      };
    }
    errors = await this.mapInputErrors(element);
    if (!errors.length) {
      return { errors: [], element };
    }

    element.setCustomValidity(errors[0].message);
    return { element, errors };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async mapInputErrors(element: AbstractInput) {
    const modelKey = this.getModelKeyName(element.name);
    const res = await Promise.all(
      (this.validators.get(modelKey) || []).map(async (v) => {
        this.errors[modelKey] = this.errors[modelKey] || {};
        const error = await v.bind(this.getParentElement())(element);
        // if (error) {
        //   element.focus();
        // }
        if (error && error.key) {
          this.errors[modelKey][error.key] = error.message;
          this.errorMap.set(v, error.key);
          return { key: error.key, message: error.message };
        } else if (this.errorMap.has(v)) {
          delete this.errors[modelKey][this.errorMap.get(v)];
        }
      })
    );
    return res.filter((i) => !!i);
  }

  public get<K extends NestedKeyOf<T>>(name: K): DeepPropType<T, K> {
    if (this.controls.has(name as any)) {
      return this.controls.get(name as any) as any;
    }
    if (String(name).includes('.')) {
      const names = String(name).split('.');
      const key = names.shift() as keyof T;
      const control = this.controls.get(key);
      if (control && (control as any).get) {
        return (control as any).get(names.join('.')) as any;
      }
    }
    return this.inputs.get(name as any) as any;
  }

  public getError(inputName: keyof T, errorKey: string) {
    return this.errors[inputName as keyof UnwrapValue<T>][errorKey as never];
  }

  public hasError(inputName: keyof T, errorKey: string) {
    return !!this.getError(inputName, errorKey as never);
  }

  public reset() {
    this.form.reset();
    this.resetErrors();
    this.setFormValidity();
    this.inputs.clear();
  }

  public setFormValidity(validity = true) {
    this.valid = validity;
    this.invalid = !validity;
    this.getParentElement().requestUpdate();
  }

  public resetErrors() {
    this.errors = Object.keys(this.errors).reduce((object, key) => {
      object[key] = {};
      return object;
    }, {}) as unknown as UnwrapValue<T>;
    this.errorMap.clear();
  }

  public get value(): UnwrapValue<T> {
    const values = this._valueChanges.getValue();
    this.controls.forEach((control, key) => {
      values[key as keyof UnwrapValue<T>] = control.value;
    });
    return values;
  }

  public set value(value: UnwrapValue<T>) {
    this._valueChanges.next(value);
  }

  public unsubscribe() {
    this.reset();
    this._valueChanges.unsubscribe();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions.clear();
    this.controls.forEach((c) => c.unsubscribe?.());
  }

  public getValue(name: keyof T): T[keyof T] {
    return this.value[name as never];
  }

  public patchValue(value: Partial<UnwrapValue<T>>) {
    if (!value) {
      return;
    }
    Object.keys(value).forEach((key) => {
      if (this.controls.has(key as keyof T) && this.controls.get(key as keyof T)['patchValue']) {
        this.controls.get(key as keyof T)['patchValue'](value[key]);
      } else {
        this.setValue(key as keyof T, value[key]);
      }
    });
  }

  public setValue(name: keyof T, value: unknown) {
    const input = this.get(name as any) as any;
    if (!input) {
      // If no input, maybe just set the value in model?
      // User code had return; but we might want to update model even if no input?
      //  return;
    }
    if (input && input.value !== undefined) input.value = value as string;
    const values = this.value;
    values[name as keyof UnwrapValue<T>] = value as never;
    this.value = values;
  }

  public setFormValue(value: UnwrapValue<T>) {
    this.value = value;
  }

  public setFormElement(form: HTMLFormElement) {
    this.form = form;
    this.controls.forEach((c) => {
      if (c.setFormElement) c.setFormElement(form);
    });
    return this;
  }

  public setInputs(inputs: AbstractInput[]) {
    this.inputs = new Map<keyof T, AbstractInput>(
      inputs.map((e) => {
        const key = this.getModelKeyName(e.name) as keyof T;
        e.value = this.getValue(key) as never;
        return [key, e];
      })
    );
  }

  public getFormElement() {
    return this.form;
  }
}
