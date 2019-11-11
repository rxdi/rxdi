import { TemplateResult } from '../lit-html/lit-html';
import { RXDIElement } from './tokens';
export declare function setElement<T>(element: T, container: HTMLElement): T;
export declare function MockComponent<T>(component: any): T;
export declare function getTemplateResult(component: RXDIElement): TemplateResult;
