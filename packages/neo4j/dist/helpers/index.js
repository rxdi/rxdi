"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToString = (a) => a.map(t => t.toString());
exports.exclude = (c, type, defaultExcludedTypes) => ({
    [type]: {
        exclude: defaultExcludedTypes.concat(...c.excludedTypes[type].exclude)
    }
});
