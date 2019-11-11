import { BehaviorSubject, Observable } from 'rxjs';
export declare class ResponsiveService {
    width: BehaviorSubject<number>;
    height: BehaviorSubject<number>;
    private readonly scrollDebounceTime;
    scrollSubscription: Observable<Event>;
    isPositionFixed: boolean;
    constructor();
    private setWindowSize;
    getBoth(): {
        width: number;
        height: number;
    };
    combineBoth(): Observable<{
        width: number;
        height: number;
    }>;
}
