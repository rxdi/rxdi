export declare class Subscription {
  static EMPTY: Subscription;
  closed: boolean;
  protected _parentOrParents: Subscription | Subscription[];
  private _subscriptions;
  constructor(unsubscribe?: () => void);
  unsubscribe(): void;
}
