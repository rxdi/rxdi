import { bundleKeys, MODULE, NOMODULE } from './constants';
import { Router } from './router';
import {  Route, RouteBundle, RouteContext } from './types';

export function toArray<T>(objectOrArray: T | T[]): T[] {
  objectOrArray = objectOrArray || ([] as T[]);
  return Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
}

export function log(msg: string): string {
  return `[Router] ${msg}`;
}

export function logValue(value: unknown): string {
  if (typeof value !== 'object') {
    return String(value);
  }

  const stringType = Object.prototype.toString.call(value).match(/ (.*)\]$/)[1];
  if (stringType === 'Object' || stringType === 'Array') {
    return `${stringType} ${JSON.stringify(value)}`;
  } else {
    return stringType;
  }
}

export function ensureBundle(src: string): void {
  if (!src.match(/.+\.[m]?js$/)) {
    throw new Error(log(`Unsupported type for bundle "${src}": .js or .mjs expected.`));
  }
}

export function isObject(o: unknown): o is Record<string, unknown> {
  return typeof o === 'object' && !!o;
}

export function isFunction(f: unknown) {
  return typeof f === 'function';
}

export function isString(s: unknown): s is string {
  return typeof s === 'string';
}

export function ensureRoute(route: Route): void {
  if (!route || !isString(route.path)) {
    throw new Error(
      log(`Expected route config to be an object with a "path" string property, or an array of such objects`)
    );
  }

  const bundle = route.bundle;

  const stringKeys = ['component', 'redirect', 'bundle'];
  if (
    !isFunction(route.action) &&
    !Array.isArray(route.children) &&
    !isFunction(route.children) &&
    !isObject(bundle) &&
    !stringKeys.some((key) => isString(route[key as keyof Route]))
  ) {
    throw new Error(
      log(
        `Expected route config "${route.path}" to include either "${stringKeys.join('", "')}" ` +
          `or "action" function but none found.`
      )
    );
  }

  if (bundle) {
    if (isString(bundle)) {
      ensureBundle(bundle);
    } else if (!bundleKeys.some((key) => key in bundle)) {
      throw new Error(
        log('Expected route bundle to include either "' + NOMODULE + '" or "' + MODULE + '" keys, or both')
      );
    } else {
      bundleKeys.forEach((key) => key in bundle && ensureBundle(bundle[key]));
    }
  }

  if (route.redirect) {
    ['bundle', 'component'].forEach((overriddenProp) => {
      if (overriddenProp in route) {
        console.warn(
          log(
            `Route config "${route.path}" has both "redirect" and "${overriddenProp}" properties, ` +
              `and "redirect" will always override the latter. Did you mean to only use "${overriddenProp}"?`
          )
        );
      }
    });
  }
}

export function ensureRoutes(routes: Route | Route[]): void {
  toArray(routes).forEach((route) => ensureRoute(route));
}

export function loadScript(src: string, key?: string): Promise<Event | void> {
  let script = document.head.querySelector('script[src="' + src + '"][async]') as
    | (HTMLScriptElement & { __dynamicImportLoaded?: boolean })
    | null;
  if (!script) {
    script = document.createElement('script') as HTMLScriptElement & { __dynamicImportLoaded?: boolean };
    script.setAttribute('src', src);
    if (key === MODULE) {
      script.setAttribute('type', MODULE);
    } else if (key === NOMODULE) {
      script.setAttribute(NOMODULE, '');
    }
    script.async = true;
  }
  return new Promise<Event | void>((resolve, reject) => {
    script['onreadystatechange'] = script.onload = (e: Event) => {
      script.__dynamicImportLoaded = true;
      resolve(e);
    };
    script.onerror = (e: Event | string) => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(e);
    };
    if (script.parentNode === null) {
      document.head.appendChild(script);
    } else if (script.__dynamicImportLoaded) {
      resolve();
    }
  });
}

export function loadBundle(bundle: string | RouteBundle): Promise<void> {
  if (isString(bundle)) {
    return loadScript(bundle).then(() => {
      //
    });
  } else {
    return Promise.race(bundleKeys.filter((key) => key in bundle).map((key) => loadScript(bundle[key], key))).then(
      () => {
        //
      }
    );
  }
}

export function fireRouterEvent(
  type: string,
  detail: Partial<HTMLAnchorElement> | Partial<Location> | Partial<Router>
): boolean {
  return !window.dispatchEvent(new CustomEvent(`router-${type}`, { cancelable: type === 'go', detail }));
}

export function getNotFoundError(context: RouteContext): Error & { context: RouteContext; code: number } {
  const error = new Error(log(`Page not found (${context.pathname})`)) as Error & {
    context: RouteContext;
    code: number;
  };
  error.context = context;
  error.code = 404;
  return error;
}

export function getAnchorOrigin(anchor: HTMLAnchorElement): string {
  const port = anchor.port;
  const protocol = anchor.protocol;
  const defaultHttp = protocol === 'http:' && port === '80';
  const defaultHttps = protocol === 'https:' && port === '443';
  const host = defaultHttp || defaultHttps ? anchor.hostname : anchor.host;
  return `${protocol}//${host}`;
}

export function runCallbackIfPossible<T extends unknown[], R>(
  callback: ((...args: T) => R) | undefined,
  args: T,
  thisArg: unknown
): R | undefined {
  if (isFunction(callback)) {
    return callback.apply(thisArg, args);
  }
  return undefined;
}
