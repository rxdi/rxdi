import { directive, Part } from '../lit-html';
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
