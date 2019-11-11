"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@rxdi/core");
function setElement(element, container) {
    element['setElement'](container);
    return element;
}
exports.setElement = setElement;
function MockComponent(component) {
    return core_1.Container.get(component);
}
exports.MockComponent = MockComponent;
function getTemplateResult(component) {
    return component.getTemplateResult();
}
exports.getTemplateResult = getTemplateResult;
