/* eslint-disable @typescript-eslint/no-explicit-any */
import { noop } from 'rxjs';

import { FormGroup } from './form.group';
import { FormOptions } from './form.tokens';

export function Form(
  options: FormOptions = {
    strategy: 'none',
  } as any
) {
  return function (clazz: any, name: string | number | symbol) {
    if (!options.name) {
      throw new Error('Missing form name');
    }
    const Destroy = clazz.constructor.prototype.disconnectedCallback || noop;
    const UpdateFirst = clazz.constructor.prototype.firstUpdated || noop;
    const Connect = clazz.constructor.prototype.connectedCallback || noop;

    clazz.constructor.prototype.connectedCallback = function () {
      if (!(this[name] instanceof FormGroup)) {
        throw new Error('Value provided is not an instance of FormGroup!');
      }
      (this[name] as FormGroup).setParentElement(this).setOptions(options).prepareValues();
      if (options.model && this[options.model]) {
        this[name].patchValue(this[options.model]);
      }
      return Connect.call(this);
    };

    clazz.constructor.prototype.firstUpdated = function () {
      /* Edge case for @rhtml/renderer */
      const renderer = this.shadowRoot.querySelector('r-renderer');
      if (renderer) {
        renderer.addEventListener('loaded', () => this[name].init());
      } else {
        this[name].init();
      }
      return UpdateFirst.call(this);
    };

    clazz.constructor.prototype.disconnectedCallback = function () {
      (this[name] as FormGroup).unsubscribe();
      return Destroy.call(this);
    };
  };
}
