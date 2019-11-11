"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function strEnum(o) {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
exports.HamburgerTypes = strEnum([
    '3dx',
    '3dx-r',
    '3dy',
    '3dy-r',
    '3dxy',
    '3dxy-r',
    'arrow',
    'arrow-r',
    'arrowalt',
    'arrowalt-r',
    'arrowturn',
    'arrowturn-r',
    'boring',
    'collapse',
    'collapse-r',
    'elastic',
    'elastic-r',
    'emphatic',
    'emphatic-r',
    'minus',
    'slider',
    'slider-r',
    'spin',
    'spin-r',
    'spring',
    'spring-r',
    'stand',
    'stand-r',
    'squeeze',
    'vortex',
    'vortex-r'
]);
//# sourceMappingURL=hamburger.type.js.map