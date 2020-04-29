import { BehaviorSubject } from 'rxjs';
import { Route } from './injection.tokens';
export declare const ChildRoutesObservable: BehaviorSubject<any>;
export declare function loadLazyRoutes(routes: Route[]): Route<any>[];
