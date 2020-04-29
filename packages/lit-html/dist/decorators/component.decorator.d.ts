import { CSSResult } from '../lit-element/lib/css-tag';
import { TemplateResult } from '../lit-html/lit-html';
import { RXDIElement } from './tokens';
interface CustomElementConfig<T> {
    selector: string;
    template?: (self: T) => TemplateResult;
    style?: CSSResult;
    styles?: CSSResult[];
    useShadow?: boolean;
    extends?: string;
    container?: Element | DocumentFragment;
    providers?: Function[];
}
interface ClassDescriptor {
    kind: 'class';
    elements: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
}
interface ClassElement {
    kind: 'field' | 'method';
    key: PropertyKey;
    placement: 'static' | 'prototype' | 'own';
    initializer?: Function;
    extras?: ClassElement[];
    finisher?: <T>(clazz: Constructor<T>) => undefined | Constructor<T>;
    descriptor?: PropertyDescriptor;
}
declare type Constructor<T> = new (...args: unknown[]) => T;
export declare const customElement: <T>(tag: string, config?: CustomElementConfig<T>) => (classOrDescriptor: ClassDescriptor | Constructor<RXDIElement>) => void;
export declare const Component: <T>(config: CustomElementConfig<T>) => (classOrDescriptor: ClassDescriptor | Constructor<RXDIElement>) => void;
export {};
