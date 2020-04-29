"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
const graphql_1 = require("graphql");
function Type(type) {
    let currentType;
    if (type.constructor === graphql_1.GraphQLObjectType ||
        type.constructor === graphql_1.GraphQLList ||
        type.constructor === graphql_1.GraphQLScalarType) {
        currentType = type;
        type = { type: currentType };
    }
    else {
        currentType = new type();
        if (!core_1.Container.has(currentType.name)) {
            core_1.Container.set(currentType.name, currentType);
        }
        type = { type: core_1.Container.get(currentType.name) };
    }
    return (t, propKey, descriptor) => {
        const self = t;
        const originalMethod = descriptor.value;
        const propertyKey = propKey;
        descriptor.value = function (...args) {
            const returnValue = originalMethod.apply(args);
            Object.assign(returnValue, type);
            return returnValue;
        };
        self.constructor._descriptors = self.constructor._descriptors || new Map();
        self.constructor._descriptors.set(propertyKey, descriptor);
        return descriptor;
    };
}
exports.Type = Type;
