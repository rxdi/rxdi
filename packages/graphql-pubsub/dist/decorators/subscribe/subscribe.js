"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Subscribe(asyncIteratorFunction, filterFn) {
    const subscribe = { subscribe: asyncIteratorFunction };
    return (t, propKey, desc) => {
        const descriptor = desc;
        const originalMethod = descriptor.value;
        const propertyKey = propKey;
        const self = t;
        descriptor.value = function (...args) {
            const returnValue = originalMethod.apply(args);
            Object.assign(returnValue, subscribe);
            return returnValue;
        };
        self.constructor._descriptors = self.constructor._descriptors || new Map();
        self.constructor._descriptors.set(propertyKey, descriptor);
        return descriptor;
    };
}
exports.Subscribe = Subscribe;
