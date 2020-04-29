"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lit_element_1 = require("../lit-element/lit-element");
class BaseComponent extends lit_element_1.LitElement {
    createRenderRoot() {
        return this;
    }
}
exports.BaseComponent = BaseComponent;
