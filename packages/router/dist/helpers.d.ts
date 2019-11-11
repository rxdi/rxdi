import { BehaviorSubject } from 'rxjs';
import { Route } from './injection.tokens';
export declare const ChildRoutesObservable: BehaviorSubject<Route<any>[]>;
export declare function loadRoutes(routes: Route[]): Route<any>[];
