import { GraphQLInputFieldConfigMap } from 'graphql';

/**
 * @Mutation annotation is creating GraphQLInputObjectType dynamically
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
export function Mutation(
 fields?: GraphQLInputFieldConfigMap,
 meta?: { description?: string },
) {
 return (t: any, propKey: string, descriptor: TypedPropertyDescriptor<any>) => {
  const originalMethod = descriptor.value;
  const target = t;
  const propertyKey = propKey;
  descriptor.value = function (...args: any[]) {
   const returnValue = Object.create({});
   returnValue.resolve = originalMethod;
   returnValue.args = fields ? fields : null;
   returnValue.method_type = 'mutation';
   returnValue.method_name = propertyKey;
   returnValue.description = meta ? meta.description : null;
   returnValue.target = target;
   return returnValue;
  };
  target.constructor._descriptors = target.constructor._descriptors || new Map();
  target.constructor._descriptors.set(propertyKey, descriptor);
  return descriptor;
 };
}
