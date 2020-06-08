import 'mousetrap';

import { Injectable, Injector } from '@rxdi/core';
import { Observable, Subject } from 'rxjs';

import { HotkeysConfig } from './hotkeys.interface';

@Injectable({ init: true })
export class HotKeysService {
  private mousetrap: Mousetrap = new Mousetrap();

  private map: Map<string, Subject<Event>> = new Map();

  @Injector(HotkeysConfig)
  private config: HotkeysConfig;

  OnInit() {
    if (this.config.globalBindings) {
      this.config.globalBindings.forEach(([key, callback]) =>
        this.mousetrap.bind(key, callback)
      );
    }
  }

  bind(key: string): Observable<Event>;
  bind(keys: string[]): Observable<Event>;
  bind(key) {
    if (this.map.has(key)) {
      return this.map.get(key).asObservable();
    }
    const item = this.map.set(key, new Subject()).get(key);
    this.mousetrap.bind(key, (e: Event) => item.next(e));
    return item.asObservable;
  }

  unbind(key: string, action?: keyof WindowEventMap): void;
  unbind(key: string[], action?: keyof WindowEventMap): void;
  unbind(key, action) {
    const item = this.map.get(key);
    if (item) {
      item.complete();
      this.map.delete(key);
    }
    this.mousetrap.unbind(key, action);
  }

  trigger(key: string, action?: keyof WindowEventMap): void;
  trigger(key: string[], action?: keyof WindowEventMap): void;
  trigger(key, action) {
    this.mousetrap.trigger(key, action);
  }

  reset() {
    this.mousetrap.reset();
  }

  stopCallback(e: KeyboardEvent, element: HTMLElement): Observable<boolean> {
    return new Observable((o) => {
      this.mousetrap.stopCallback(e, element, o.next.bind(o));
    });
  }
}
