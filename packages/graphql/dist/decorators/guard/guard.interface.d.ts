import { Observable } from 'rxjs';
import { GenericGapiResolversType } from '../query';
import { GraphQLObjectType } from 'graphql';
export interface ResolverContext {
}
export interface CanActivateResolver {
    canActivate(context: ResolverContext, payload?: any, descriptor?: GenericGapiResolversType): boolean | Promise<boolean> | Observable<boolean>;
}
export interface GraphQLControllerOptions {
    guards?: Function[];
    type?: GraphQLObjectType | any;
    scope?: string[];
    interceptor?: Function;
}
