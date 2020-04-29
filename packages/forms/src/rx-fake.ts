import {
  BehaviorSubject as BS,
  Observable as O,
  Subscription as S
} from 'rxjs';

type OBS<T> = (o: $Observable<T>) => void | Function;
type FN<T> = (a: T) => void;

export class $Subscription<T> {
  o: Map<Function, FN<T>> = new Map();

  unsubscribe() {
    [...this.o.values()].forEach(v => this.o.delete(v));
  }
}

export class $Observable<T> extends $Subscription<T> {
  fn: OBS<T>;
  init: boolean = true;
  constructor(fn?: OBS<T>) {
    super();
    this.fn = fn;
  }

  subscribe(c: FN<T>) {
    this.o.set(c, c);
    if (typeof this.fn === 'function' && this.init) {
      this.fn(this);
      this.init = false;
    }
    return <$Subscription<T>>{
      unsubscribe: () => {
        this.o.delete(c);
      }
    };
  }

  complete() {
    this.unsubscribe();
  }

  next(s: T) {
    [...this.o.values()].forEach(f => f(s));
  }
}

export class $BehaviorSubject<T> extends $Observable<T> {
  v: T;
  constructor(v: T) {
    if (typeof v === 'function') {
      super(v as any);
    }
    super(null);
    this.setValue(v);
  }

  private setValue(v: T) {
    this.v = v;
  }

  next(s: T) {
    this.setValue(s);
    super.next(s);
  }

  getValue() {
    return this.v;
  }

  asObservable() {
    return this;
  }
}

function behaviorOrFake<T>(): void {
  try {
    return require('rxjs').BehaviorSubject;
  } catch (e) {}
  return $BehaviorSubject as any;
}

function observableOrFake<T>(): void {
  try {
    return require('rxjs').Observable;
  } catch (e) {}
  return $Observable as any;
}

function subscriptionOrFake<T>(): void {
  try {
    return require('rxjs').Subscription;
  } catch (e) {}
  return $Subscription as any;
}

export function noop() {}

export function BehaviorSubject<T>(init: T): void {
  const b: any = behaviorOrFake();
  return new b(init);
}

export function Observable<T>(fn?: OBS<T>): void {
  const o: any = observableOrFake();
  return new o(fn);
}

export function Subscription<T>(): void {
  const s: any = subscriptionOrFake();
  return new s();
}

export interface BehaviorSubject<T> extends BS<T> {}
export interface Observable<T> extends O<T> {}
export interface Subscription extends S {}
