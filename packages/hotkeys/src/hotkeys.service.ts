import 'mousetrap';

import { Injectable, Injector } from '@rxdi/core';
import { Observable } from 'rxjs';

import { HotkeysConfig } from './hotkeys.interface';

@Injectable({ init: true })
export class HotKeysService {
 private mousetrap: Mousetrap = new Mousetrap();

 @Injector(HotkeysConfig)
 private config: HotkeysConfig;

 OnInit() {
  this.config?.globalBindings?.forEach(([key, callback]) =>
   this.mousetrap.bind(key, callback),
  );
 }

 bind(key: string): Observable<Event>;
 bind(keys: string[]): Observable<Event>;
 bind(key) {
  return new Observable<Event>((o) => {
   this.mousetrap.bind(key, (e: Event) => o.next(e));
   return () => this.mousetrap.unbind(key);
  });
 }

 unbind(key: string, action?: keyof WindowEventMap): void;
 unbind(key: string[], action?: keyof WindowEventMap): void;
 unbind(key, action) {
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
