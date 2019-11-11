import { GraphQLObjectType, GraphQLNonNull } from 'graphql';
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

export function Query<T>(options?: any) {
  return (t, propKey: string, descriptor: TypedPropertyDescriptor<any>) => {
    const originalMethod = descriptor.value;
    const target: TargetConstructor = t;
    const propertyKey = propKey;
    descriptor.value = function(...args: any[]) {
      const returnValue = Object.create({});
      returnValue.resolve = originalMethod;
      returnValue.args = options ? options : null;
      returnValue.method_type = 'query';
      returnValue.method_name = propertyKey;
      returnValue.target = target;
      return returnValue;
    };
    target.constructor._descriptors =
      target.constructor._descriptors || new Map();
    target.constructor._descriptors.set(propertyKey, descriptor);
    return descriptor;
  };
}
