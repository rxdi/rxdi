import { Route } from './injection.tokens';
export declare class ChildService {
    private _childs;
    constructor();
    childs: Route<any>[];
    flush(): void;
}
