/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement } from '@rxdi/lit-html';
import { BehaviorSubject, Subscription } from 'rxjs';

import { AbstractControl, FormOptions } from './form.tokens';

export class FormArray<T = any> implements AbstractControl<T[]> {
  public controls: AbstractControl<T>[] = [];
  public readonly valueChanges: BehaviorSubject<T[]>;
  private readonly _valueChanges: BehaviorSubject<T[]>;
  public parentElement: LitElement;
  public name: string;
  public valid = true;
  public invalid = false;
  public errors = {};
  private form: HTMLFormElement;
  private options: FormOptions = {} as FormOptions;
  private subscriptions: Map<AbstractControl<T>, Subscription> = new Map();

  constructor(controls: AbstractControl<T>[] = [], name = '') {
    this.controls = controls;
    this.name = name;
    this._valueChanges = new BehaviorSubject(this.value);
    this.valueChanges = this._valueChanges;
    this.controls.forEach((c) => this.subscribeToControl(c));
  }

  public get value() {
    return this.controls.map((c) => c.value);
  }

  public getOptions() {
    return this.options;
  }

  public setOptions(options: FormOptions) {
    this.options = options;
    this.controls.forEach((c, index) => {
      c.setOptions({
        ...options,
        namespace: `${this.name}[${index}]`,
      });
    });
  }

  public async push(control: AbstractControl<T>) {
    this.controls.push(control);
    this.subscribeToControl(control);
    const index = this.controls.length - 1;
    control.setOptions({
      ...this.options,
      ...control.getOptions(),
      namespace: `${this.name}[${index}]`,
    });
    this.updateValue();
    this.requestUpdate();

    if (this.parentElement) {
      await this.parentElement.updateComplete;
      control.setParentElement(this.parentElement);
      if (this.form) {
        control.setFormElement(this.form);
        control.init();
      } else if (control.getFormElement()) {
        control.init();
      } else if (this.controls[0] && this.controls[0].getFormElement()) {
        control.setFormElement(this.controls[0].getFormElement());
        control.init();
      }
    }
  }

  public removeAt(index: number) {
    const control = this.controls[index];
    if (this.subscriptions.has(control)) {
      this.subscriptions.get(control).unsubscribe();
      this.subscriptions.delete(control);
    }
    this.controls.splice(index, 1);
    this.updateValue();
    this.requestUpdate();
  }

  private subscribeToControl(control: AbstractControl<T>) {
    if (control.valueChanges) {
      this.subscriptions.set(
        control,
        control.valueChanges.subscribe(() => {
          this.updateValue();
        })
      );
    }
  }

  public unsubscribe() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.controls.forEach((c) => c.unsubscribe && c.unsubscribe());
  }

  public updateValue() {
    this._valueChanges.next(this.value);
  }

  public requestUpdate() {
    if (this.parentElement) {
      this.parentElement.requestUpdate();
    }
  }

  public setParentElement(parent: LitElement) {
    this.parentElement = parent;
    this.controls.forEach((c) => c.setParentElement(parent));
  }

  public setFormElement(form: HTMLFormElement) {
    this.form = form;
    this.controls.forEach((c) => c.setFormElement(form));
  }

  public init() {
    this.controls.forEach((c) => c.init());
  }

  public getParentElement() {
    return this.parentElement;
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  public set value(values: T[]) {
    if (!Array.isArray(values)) {
      return;
    }
    values.forEach((v, i) => {
      if (this.controls[i]) {
        this.controls[i].value = v;
      }
    });
    this.updateValue();
  }
}
