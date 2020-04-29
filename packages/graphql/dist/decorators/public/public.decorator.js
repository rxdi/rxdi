"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Public() {
    const pub = { public: true };
    return (t, propKey, desc) => {
        const descriptor = desc;
        const originalMethod = descriptor.value;
        const propertyKey = propKey;
        const self = t;
        descriptor.value = function (...args) {
            const returnValue = originalMethod.apply(args);
            Object.assign(returnValue, pub);
            return returnValue;
        };
        self.constructor._descriptors = self.constructor._descriptors || new Map();
        self.constructor._descriptors.set(propertyKey, descriptor);
        return descriptor;
    };
}
exports.Public = Public;
