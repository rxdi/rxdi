import { CSSResult, CSSResultArray, TemplateResult } from 'lit';

export declare class Subscription {
  static EMPTY: Subscription;
  closed: boolean;
  protected _parentOrParents: Subscription | Subscription[];
  private _subscriptions;
  constructor(unsubscribe?: () => void);
  unsubscribe(): void;
}

export class RXDIElement extends HTMLElement {
  public static setElement?<T>(component: T, document: RXDIElement): T;
  public static is?(document: RXDIElement): RXDIElement;
  public static styles?: CSSResult | CSSResultArray;
  public static subscriptions?: Map<Subscription, Subscription>;
  public getTemplateResult?(): TemplateResult;

  OnBefore?(): void;
  OnInit?(): void;
  OnUpdate?(): void;
  OnUpdateFirst?(): void;
}
