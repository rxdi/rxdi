"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lit_rx_1 = require("../lit-rx");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
function TemplateObservable(animationFrame) {
    return (target, key) => {
        const Connect = target.constructor.prototype.connectedCallback || function () { };
        target.constructor.prototype.connectedCallback = function () {
            if (animationFrame) {
                this[key] = lit_rx_1.async(this[key].pipe(operators_1.shareReplay({ scheduler: rxjs_1.animationFrameScheduler, refCount: true })));
            }
            this[key] = lit_rx_1.async(this[key]);
            return Connect.call(this);
        };
    };
}
exports.TemplateObservable = TemplateObservable;
