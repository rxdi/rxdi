import { noChange, Part } from 'lit';
import { directive } from 'lit/directive';
import { AsyncDirective } from 'lit/async-directive';

interface Unsubscribable {
  unsubscribe(): void;
}
interface Subscribable<T> {
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

class ObserveDirective extends AsyncDirective {
  observable: Subscribable<unknown> | undefined;
  subscription: Unsubscribable;
  // When the observable changes, unsubscribe to the old one and
  // subscribe to the new one
  render(asyncResult: Subscribable<unknown>) {
    if ('then' in asyncResult) {
      Promise.resolve(asyncResult).then((v) => this.setValue(v));
      return '';
    }
    if (this.observable !== asyncResult) {
      this.unsubscribe();
      this.observable = asyncResult;
      if (this.isConnected) {
        this.subscribe(asyncResult);
      }
    }
    return noChange;
  }

  // Subscribes to the observable, calling the directive's asynchronous
  // setValue API each time the value changes
  subscribe(observable: Subscribable<unknown>) {
    this.subscription = observable.subscribe((v: unknown) => {
      this.setValue(v);
    });
  }
  // When the directive is disconnected from the DOM, unsubscribe to ensure
  // the directive instance can be garbage collected
  disconnected() {
    this.unsubscribe();
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  // If the subtree the directive is in was disconneted and subsequently
  // re-connected, re-subscribe to make the directive operable again
  reconnected() {
    this.subscribe(this.observable!);
  }
}
export const async = directive(ObserveDirective);
