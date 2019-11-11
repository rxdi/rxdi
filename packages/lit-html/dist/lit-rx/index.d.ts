import { Part } from '../lit-html/lit-html';
import { Subscribable } from 'rxjs';
declare type SubscribableOrPromiseLike<T> = Subscribable<T> | PromiseLike<T>;
/**
 * A directive that renders the items of a subscribable, replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time.
 *
 * @param value A subscribable
 */
export declare const subscribe: (subscribableOrPromiseLike: SubscribableOrPromiseLike<unknown>) => (part: Part) => void;
export declare const async: (subscribableOrPromiseLike: SubscribableOrPromiseLike<unknown>) => (part: Part) => void;
export {};
