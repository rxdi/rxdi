import { Part } from '../lit-html/lit-html';
export interface Unsubscribable {
    unsubscribe(): void;
}
export interface Subscribable<T> {
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: null | undefined, error: null | undefined, complete: () => void): Unsubscribable;
    /** @deprecated Use an observer instead of an error callback */
    subscribe(next: null | undefined, error: (error: any) => void, complete?: () => void): Unsubscribable;
    /** @deprecated Use an observer instead of a complete callback */
    subscribe(next: (value: T) => void, error: null | undefined, complete: () => void): Unsubscribable;
    subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Unsubscribable;
}
declare type SubscribableOrPromiseLike<T> = Subscribable<T> | PromiseLike<T>;
/**
 * A directive that renders the items of a subscribable, replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time.
 *
 * @param value A subscribable
 */
export declare const subscribe: <T>(subscribableOrPromiseLike: SubscribableOrPromiseLike<T>) => (part: Part) => void;
export declare const async: <T>(subscribableOrPromiseLike: SubscribableOrPromiseLike<T>) => (part: Part) => void;
export {};
