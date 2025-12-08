import { GraphQLInputFieldConfigMap } from "graphql";

export function Mutation(input?: GraphQLInputFieldConfigMap, meta?: Pick<GraphQLInputFieldConfigMap, 'description'>) {
  return (
    t: any,
    propKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const originalMethod = descriptor.value;
    const target = t;
    const propertyKey = propKey;
    descriptor.value = function(...args: any[]) {
      const returnValue = Object.create({});
      returnValue.resolve = originalMethod;
      returnValue.args = input ? input : null;
      returnValue.method_type = 'mutation';
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
