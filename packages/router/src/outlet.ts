import { fromEvent, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { getQueryParams } from './helpers';
import { RouterOptions } from './injection.tokens';
import { Router } from './lib';

interface Detail extends Event {
  detail: { location: { pathname: string } };
}

export class Outlet extends Router {
  activePath = '/';
  private freeze: boolean;
  private subscription: Subscription;

  constructor(element: Element, private options: RouterOptions) {
    super(element, options);
    this.subscription = this.onSnapshotChange()
      .pipe(
        tap((event) => {
          if (this.options.log) {
            console.log(`You are at '${event.detail.location.pathname}'`);
          }
          this.activePath = event.detail.location.pathname;
        })
      )
      .subscribe();
  }

  onSnapshotChange(): Observable<Detail> {
    return fromEvent<Detail>(window, 'router-location-changed');
  }

  freezeRouter() {
    this.freeze = true;
  }

  unfreezeRouter() {
    this.freeze = false;
  }

  getQueryParams<T>(params: string[]) {
    return getQueryParams<T>(params);
  }

  /**
   * Triggers navigation to a new path. Returns a boolean without waiting until the navigation is complete. Returns true if at least one Router has handled the navigation (was subscribed and had baseUrl matching the pathname argument), otherwise returns false.
   * @param pathnamea new in-app path
   * @returns void
   */
  go(path: string): boolean {
    if (this.activePath === path || this.freeze) {
      return false;
    }
    this.activePath = path;
    if (this.options.freeze) {
      this.freezeRouter();
    }
    // window.dispatchEvent(new CustomEvent('router-go', {detail: {pathname: '/to/path'}}));
    return Router.go(path);
  }

  /**
   * Removes the subscription to navigation events created in the subscribe() method.
   */
  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    super.unsubscribe();
  }
}
