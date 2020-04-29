import { BehaviorSubject as BS, Observable as O, Subscription as S } from 'rxjs';
declare type OBS<T> = (o: $Observable<T>) => void | Function;
declare type FN<T> = (a: T) => void;
export declare class $Subscription<T> {
    o: Map<Function, FN<T>>;
    unsubscribe(): void;
}
export declare class $Observable<T> extends $Subscription<T> {
    fn: OBS<T>;
    init: boolean;
    constructor(fn?: OBS<T>);
    subscribe(c: FN<T>): $Subscription<T>;
    complete(): void;
    next(s: T): void;
}
export declare class $BehaviorSubject<T> extends $Observable<T> {
    v: T;
    constructor(v: T);
    private setValue;
    next(s: T): void;
    getValue(): T;
    asObservable(): this;
}
export declare function noop(): void;
export declare function BehaviorSubject<T>(init: T): void;
export declare function Observable<T>(fn?: OBS<T>): void;
export declare function Subscription<T>(): void;
export interface BehaviorSubject<T> extends BS<T> {
}
export interface Observable<T> extends O<T> {
}
export interface Subscription extends S {
}
export {};
