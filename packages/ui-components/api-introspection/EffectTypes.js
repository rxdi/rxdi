"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable */
function strEnum(o) {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
exports.EffectTypes = strEnum(["status",
    "clickHamburgerButton",
    "subscribeToStatistics"]);
//# sourceMappingURL=EffectTypes.js.map