import { NavigationTrigger } from './types';
import { fireRouterEvent, getAnchorOrigin, isFunction } from './utils';

// IE Polyfill for PopStateEvent
const isIE = /Trident/.test(navigator.userAgent);

interface PopStateEventConstructor {
  new (type: string, eventInitDict?: PopStateEventInit): PopStateEvent;
  prototype: PopStateEvent;
}

if (isIE && !isFunction(window.PopStateEvent)) {
  (window as Window & { PopStateEvent: PopStateEventConstructor }).PopStateEvent = function (
    this: PopStateEvent,
    inType: string,
    params?: PopStateEventInit
  ): PopStateEvent {
    params = params || {};
    const e = document.createEvent('Event') as PopStateEvent & { state: unknown };
    e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
    e.state = params.state || null;
    return e;
  } as unknown as PopStateEventConstructor;

  (window as Window & { PopStateEvent: PopStateEventConstructor }).PopStateEvent.prototype = window.Event
    .prototype as never;
}

export function RouterGlobalClickHandler(event: MouseEvent): void {
  if (event.defaultPrevented) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  let anchor = event.target as Node | null;
  const path = (event as MouseEvent & { composedPath?: () => EventTarget[] }).composedPath
    ? (event as MouseEvent & { composedPath: () => EventTarget[] }).composedPath()
    : (event as MouseEvent & { path?: EventTarget[] }).path || [];

  for (let i = 0; i < path.length; i++) {
    const target = path[i] as Node & { nodeName?: string };
    if (target.nodeName && target.nodeName.toLowerCase() === 'a') {
      anchor = target;
      break;
    }
  }

  while (anchor && (anchor as Element).nodeName && (anchor as Element).nodeName.toLowerCase() !== 'a') {
    anchor = anchor.parentNode;
  }

  if (!anchor || (anchor as Element).nodeName.toLowerCase() !== 'a') {
    return;
  }

  const anchorElement = anchor as HTMLAnchorElement;

  if (anchorElement.target && anchorElement.target.toLowerCase() !== '_self') {
    return;
  }

  if (anchorElement.hasAttribute('download')) {
    return;
  }

  if (anchorElement.hasAttribute('router-ignore')) {
    return;
  }

  if (anchorElement.pathname === window.location.pathname && anchorElement.hash !== '') {
    return;
  }

  const origin = (anchorElement as HTMLAnchorElement & { origin?: string }).origin || getAnchorOrigin(anchorElement);
  if (origin !== window.location.origin) {
    return;
  }

  const { pathname, search, hash } = anchorElement;
  if (fireRouterEvent('go', { pathname, search, hash })) {
    event.preventDefault();
  }
}

export const CLICK: NavigationTrigger = {
  activate() {
    window.document.addEventListener('click', RouterGlobalClickHandler);
  },

  inactivate() {
    window.document.removeEventListener('click', RouterGlobalClickHandler);
  },
};

export function RouterGlobalPopstateHandler(event: PopStateEvent): void {
  if (event.state === 'router-ignore') {
    return;
  }
  const { pathname, search, hash } = window.location;
  fireRouterEvent('go', { pathname, search, hash });
}

export const POPSTATE: NavigationTrigger = {
  activate() {
    window.addEventListener('popstate', RouterGlobalPopstateHandler);
  },

  inactivate() {
    window.removeEventListener('popstate', RouterGlobalPopstateHandler);
  },
};

let triggers: NavigationTrigger[] = [];

export function setNavigationTriggers(newTriggers: NavigationTrigger[]): void {
  triggers.forEach((trigger) => trigger.inactivate());
  newTriggers.forEach((trigger) => trigger.activate());
  triggers = newTriggers;
}
