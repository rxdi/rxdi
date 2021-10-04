/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/*
 * IMPORTANT: For compatibility with tsickle and the Closure JS compiler, all
 * property decorators (but not class decorators) in this file that have
 * an @ExportDecoratedItems annotation must be defined as a regular function,
 * not an arrow function.
 */

import { ReactiveElement } from '@lit/reactive-element/reactive-element';
import { decorateProperty } from './base.js';

/**
 * A property decorator that converts a class property into a getter that
 * returns the `assignedNodes` of the given named `slot`. Note, the type of
 * this property should be annotated as `NodeListOf<HTMLElement>`.
 *
 * @param slotName A string name of the slot.
 * @param flatten A boolean which when true flattens the assigned nodes,
 *     meaning any assigned nodes that are slot elements are replaced with their
 *     assigned nodes.
 * @param selector A string which filters the results to elements that match
 *     the given css selector.
 *
 * ```ts
 * class MyElement {
 *   @queryAssignedNodes('list', true, '.item')
 *   listItems;
 *
 *   render() {
 *     return html`
 *       <slot name="list"></slot>
 *     `;
 *   }
 * }
 * ```
 * @category Decorator
 */
export function queryAssignedNodes(
  slotName = '',
  flatten = false,
  selector = ''
) {
  return decorateProperty({
    descriptor: (_name: PropertyKey) => ({
      get(this: ReactiveElement) {
        const slotSelector = `slot${
          slotName ? `[name=${slotName}]` : ':not([name])'
        }`;
        const slot = this.renderRoot?.querySelector(slotSelector);
        let nodes = (slot as HTMLSlotElement)?.assignedNodes({ flatten }) ?? [];
        if (selector) {
          nodes = nodes.filter(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).matches(selector)
          );
        }
        return nodes;
      },
      enumerable: true,
      configurable: true,
    }),
  });
}
