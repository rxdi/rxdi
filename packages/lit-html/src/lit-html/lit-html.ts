/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 *
 * Main lit-html module.
 *
 * Main exports:
 *
 * -  [[html]]
 * -  [[svg]]
 * -  [[render]]
 *
 * @module lit-html
 * @preferred
 */

/**
 * Do not remove this comment; it keeps typedoc from misplacing the module
 * docs.
 */
import { defaultTemplateProcessor } from './lib/default-template-processor';
import { SVGTemplateResult, TemplateResult } from './lib/template-result';
import { Part } from './lib/part';
import { directive } from './lib/directive';

export {
  DefaultTemplateProcessor,
  defaultTemplateProcessor,
} from './lib/default-template-processor';
export { directive, DirectiveFn, isDirective } from './lib/directive';
// TODO(justinfagnani): remove line when we get NodePart moving methods
export { removeNodes, reparentNodes } from './lib/dom';
export { noChange, nothing, Part } from './lib/part';
export {
  AttributeCommitter,
  AttributePart,
  BooleanAttributePart,
  EventPart,
  isIterable,
  isPrimitive,
  NodePart,
  PropertyCommitter,
  PropertyPart,
} from './lib/parts';
export { RenderOptions } from './lib/render-options';
export { parts, render } from './lib/render';
export { templateCaches, templateFactory } from './lib/template-factory';
export { TemplateInstance } from './lib/template-instance';
export { TemplateProcessor } from './lib/template-processor';
export { SVGTemplateResult, TemplateResult } from './lib/template-result';
export { createMarker, isTemplatePartActive, Template } from './lib/template';

declare global {
  interface Window {
    litHtmlVersions: string[];
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');

/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
export const svg = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new SVGTemplateResult(strings, values, 'svg', defaultTemplateProcessor);

export interface Unsubscribable {
  unsubscribe(): void;
}
export interface Subscribable<T> {
  /** @deprecated Use an observer instead of a complete callback */
  subscribe(
    next: null | undefined,
    error: null | undefined,
    complete: () => void
  ): Unsubscribable;
  /** @deprecated Use an observer instead of an error callback */
  subscribe(
    next: null | undefined,
    error: (error: any) => void,
    complete?: () => void
  ): Unsubscribable;
  /** @deprecated Use an observer instead of a complete callback */
  subscribe(
    next: (value: T) => void,
    error: null | undefined,
    complete: () => void
  ): Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Unsubscribable;
}

type SubscribableOrPromiseLike<T> = Subscribable<T> | PromiseLike<T>;

interface PreviousValue<T> {
  readonly value: T;
  readonly subscribableOrPromiseLike: SubscribableOrPromiseLike<T>;
}

// For each part, remember the value that was last rendered to the part by the
// subscribe directive, and the subscribable that was last set as a value.
// The subscribable is used as a unique key to check if the last value
// rendered to the part was with subscribe. If not, we'll always re-render the
// value passed to subscribe.
const previousValues = new WeakMap<Part, PreviousValue<unknown>>();

/**
 * A directive that renders the items of a subscribable, replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time.
 *
 * @param value A subscribable
 */
export const subscribe = directive(
  <T>(subscribableOrPromiseLike: SubscribableOrPromiseLike<T>) => (
    part: Part
  ) => {
    // If subscribableOrPromiseLike is neither a subscribable or
    // a promise like, throw an error
    if (
      !('then' in subscribableOrPromiseLike) &&
      !('subscribe' in subscribableOrPromiseLike)
    ) {
      throw new Error(
        'subscribableOrPromiseLike must be a subscribable or a promise like'
      );
    }

    // If we have already set up this subscribable in this part, we
    // don't need to do anything
    const previousValue = previousValues.get(part);

    if (
      previousValue !== undefined &&
      subscribableOrPromiseLike === previousValue.subscribableOrPromiseLike
    ) {
      return;
    }

    const cb = (value: T) => {
      // If we have the same value and the same subscribable in the same part,
      // we don't need to do anything
      if (
        previousValue !== undefined &&
        part.value === previousValue.value &&
        subscribableOrPromiseLike === previousValue.subscribableOrPromiseLike
      ) {
        return;
      }

      part.setValue(value);
      part.commit();
      previousValues.set(part, { value, subscribableOrPromiseLike });
    };

    if ('then' in subscribableOrPromiseLike) {
      subscribableOrPromiseLike.then(cb);
      return;
    }
    subscribableOrPromiseLike.subscribe(cb);
  }
);

export const async = subscribe;
