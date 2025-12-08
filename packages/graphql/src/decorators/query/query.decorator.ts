import { GraphQLObjectType, GraphQLNonNull, GraphQLInputFieldConfigMap } from 'graphql';
import { GraphQLControllerOptions } from '../../decorators/guard/guard.interface';

export class GenericGapiResolversType implements GraphQLControllerOptions {
  scope?: string[];
  target?: any;
  effect?: string;
  guards?: Function[];
  public?: boolean;
  interceptor?: Function;
  interceptors?: any[];
  method_name?: string;
  description?: string;
  subscribe?: (root: any, params: any, context: any, info: any, ...args) => {};
  method_type?: 'query' | 'subscription' | 'mutation' | 'event';
  type: GraphQLObjectType;
  resolve?(root: any, params: any, context: any, info: any, ...args): {};
  args?: {
    [key: string]: {
      [type: string]: GraphQLObjectType | GraphQLNonNull<any>;
    };
  };
}

interface TargetConstructor {
  constructor: {
    name: string;
    _descriptors: Map<
      string,
      TypedPropertyDescriptor<() => GenericGapiResolversType>
    >;
  };
}

/**
 * @Query annotation is creating GraphQLInputObjectType dynamically
 * @param fields parameter is type GraphQLInputFieldConfigMap
 * @param meta parameter has "description" field which is then added to the new GraphQLInputObjectType
 * 
 * "input" param is actually "fields" param inside the dynamically generated GraphQLInputObjectType
 * 
 * ```typescript
 *   new GraphQLInputObjectType({
 *    name: 'Taken from the descriptor name automatically',
 *    description: 'Taken from "meta.description" field'
 *    fields: input,
 *   })
 * ```
 */
export function Query<T>(fields?: GraphQLInputFieldConfigMap, meta?: { description?: string }) {
  return (t, propKey, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value;
    const target: TargetConstructor = t;
    const propertyKey = propKey;
    descriptor.value = function (...args: any[]) {
      const returnValue = Object.create({});
      returnValue.resolve = originalMethod;
      returnValue.args = fields ? fields : null;
      returnValue.method_type = 'query';
      returnValue.method_name = propertyKey;
      returnValue.description = meta ? meta.description : null;
      returnValue.target = target;
      return returnValue;
    };
    target.constructor._descriptors =
      target.constructor._descriptors || new Map();
    target.constructor._descriptors.set(propertyKey, descriptor);
    return descriptor;
  };
}
