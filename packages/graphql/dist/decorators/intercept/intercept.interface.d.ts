import { Observable } from 'rxjs';
import { GenericGapiResolversType } from '../query/query.decorator';
export interface InterceptResolver {
    intercept(chainable: Observable<any>, context?: any, payload?: any, desc?: GenericGapiResolversType): Observable<any> | Promise<any | void>;
}
