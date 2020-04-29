"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form_group_1 = require("./form.group");
const rx_fake_1 = require("./rx-fake");
function Form(options = {
    strategy: 'none'
}) {
    return function (clazz, name) {
        if (!options.name) {
            throw new Error('Missing form name');
        }
        const Destroy = clazz.constructor.prototype.disconnectedCallback || rx_fake_1.noop;
        const UpdateFirst = clazz.constructor.prototype.firstUpdated || rx_fake_1.noop;
        const Connect = clazz.constructor.prototype.connectedCallback || rx_fake_1.noop;
        clazz.constructor.prototype.connectedCallback = function () {
            if (!(this[name] instanceof form_group_1.FormGroup)) {
                throw new Error('Value provided is not an instance of FormGroup!');
            }
            this[name]
                .setParentElement(this)
                .setOptions(options)
                .prepareValues();
            return Connect.call(this);
        };
        clazz.constructor.prototype.firstUpdated = function () {
            this[name].init();
            return UpdateFirst.call(this);
        };
        clazz.constructor.prototype.disconnectedCallback = function () {
            this[name].unsubscribe();
            return Destroy.call(this);
        };
    };
}
exports.Form = Form;
