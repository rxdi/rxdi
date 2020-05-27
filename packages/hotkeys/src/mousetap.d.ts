declare class Mousetrap {
 bind(key: string, callback: Function, action?: keyof WindowEventMap): void;
 bind(keys: string[], callback: Function, action?: keyof WindowEventMap): void;
 unbind(key: string, action?: keyof WindowEventMap): void;
 unbind(key: string[], action?: keyof WindowEventMap): void;
 trigger(key: string, action?: keyof WindowEventMap): void;
 trigger(key: string[], action?: keyof WindowEventMap): void;
 reset(): void;
 stopCallback(
  e: KeyboardEvent,
  element: HTMLElement,
  callback: Function,
 ): boolean;
}
