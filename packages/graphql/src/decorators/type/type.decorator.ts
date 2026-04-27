import { Container } from '@rxdi/core';
import { GraphQLObjectType, GraphQLList, GraphQLScalarType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean } from 'graphql';

const SCALAR_TYPES = [String, Number, Boolean, Date];

export function Type<T>(type): Function {
    let currentType;
    const typeName = type && (type as any).name;
    if (type === String) {
        type = { type: GraphQLString };
    } else if (type === Number) {
        type = { type: GraphQLFloat };
    } else if (type === Boolean) {
        type = { type: GraphQLBoolean };
    } else if (type && (type.constructor === GraphQLObjectType ||
        type.constructor === GraphQLList ||
        type.constructor === GraphQLScalarType)) {
        type = { type };
    } else if (SCALAR_TYPES.includes(type)) {
        type = { type: type };
    } else {
        currentType = new type();
        if (typeof currentType !== 'string' &&
            typeof currentType !== 'number' &&
            typeof currentType !== 'boolean' &&
            currentType !== null &&
            currentType !== undefined &&
            currentType.constructor !== Date &&
            !Array.isArray(currentType)) {
            const typeName = currentType.name;
            if (typeName && typeName.length > 0 && !Container.has(typeName)) {
                Container.set({ id: typeName, value: currentType });
            }
            type = { type: typeName && Container.has(typeName) ? Container.get(typeName) : currentType };
        } else {
            type = { type: currentType };
        }
    }

    return (t, propKey, descriptor: TypedPropertyDescriptor<any>) => {
        const self = t;
        const originalMethod = descriptor.value;
        const propertyKey = propKey;
        descriptor.value = function (...args: any[]) {
            const returnValue = originalMethod.apply(this, args);
            Object.assign(returnValue, type);
            return returnValue;
        };
        self.constructor._descriptors = self.constructor._descriptors || new Map();
        self.constructor._descriptors.set(propertyKey, descriptor);

        return descriptor;
    };
}