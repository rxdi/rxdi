import { CSSResult } from '../lit-element/lib/css-tag';
import { CSSResultArray } from '../lit-element/lit-element';
import { TemplateResult } from '../lit-html/lit-html';
export declare class Subscription {
    static EMPTY: Subscription;
    closed: boolean;
    protected _parentOrParents: Subscription | Subscription[];
    private _subscriptions;
    constructor(unsubscribe?: () => void);
    unsubscribe(): void;
}
export declare class RXDIElement extends HTMLElement {
    static setElement?<T>(component: T, document: RXDIElement): T;
    static is?(document: RXDIElement): RXDIElement;
    static styles?: CSSResult | CSSResultArray;
    static subscriptions?: Map<Subscription, Subscription>;
    getTemplateResult?(): TemplateResult;
    OnBefore?(): void;
    OnInit?(): void;
    OnUpdate?(): void;
    OnUpdateFirst?(): void;
}
