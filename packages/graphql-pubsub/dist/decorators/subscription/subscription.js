"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Subscription(options) {
    return (t, propKey, descriptor) => {
        const originalMethod = descriptor.value;
        const target = t;
        const propertyKey = propKey;
        descriptor.value = function (...args) {
            const returnValue = Object.create({});
            returnValue.resolve = originalMethod;
            returnValue.args = options ? options : null;
            returnValue.method_type = 'subscription';
            returnValue.method_name = propertyKey;
            returnValue.target = target;
            return returnValue;
        };
        target.constructor._descriptors = target.constructor._descriptors || new Map();
        target.constructor._descriptors.set(propertyKey, descriptor);
        return descriptor;
    };
}
exports.Subscription = Subscription;
