"use strict";
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * Main lit-html module.
 *
 * Main exports:
 *
 * -  [[html]]
 * -  [[svg]]
 * -  [[render]]
 *
 * @module lit-html
 * @preferred
 */
/**
 * Do not remove this comment; it keeps typedoc from misplacing the module
 * docs.
 */
const default_template_processor_1 = require("./lib/default-template-processor");
const template_result_1 = require("./lib/template-result");
var default_template_processor_2 = require("./lib/default-template-processor");
exports.DefaultTemplateProcessor = default_template_processor_2.DefaultTemplateProcessor;
exports.defaultTemplateProcessor = default_template_processor_2.defaultTemplateProcessor;
var directive_1 = require("./lib/directive");
exports.directive = directive_1.directive;
exports.isDirective = directive_1.isDirective;
// TODO(justinfagnani): remove line when we get NodePart moving methods
var dom_1 = require("./lib/dom");
exports.removeNodes = dom_1.removeNodes;
exports.reparentNodes = dom_1.reparentNodes;
var part_1 = require("./lib/part");
exports.noChange = part_1.noChange;
exports.nothing = part_1.nothing;
var parts_1 = require("./lib/parts");
exports.AttributeCommitter = parts_1.AttributeCommitter;
exports.AttributePart = parts_1.AttributePart;
exports.BooleanAttributePart = parts_1.BooleanAttributePart;
exports.EventPart = parts_1.EventPart;
exports.isIterable = parts_1.isIterable;
exports.isPrimitive = parts_1.isPrimitive;
exports.NodePart = parts_1.NodePart;
exports.PropertyCommitter = parts_1.PropertyCommitter;
exports.PropertyPart = parts_1.PropertyPart;
var render_1 = require("./lib/render");
exports.parts = render_1.parts;
exports.render = render_1.render;
var template_factory_1 = require("./lib/template-factory");
exports.templateCaches = template_factory_1.templateCaches;
exports.templateFactory = template_factory_1.templateFactory;
var template_instance_1 = require("./lib/template-instance");
exports.TemplateInstance = template_instance_1.TemplateInstance;
var template_result_2 = require("./lib/template-result");
exports.SVGTemplateResult = template_result_2.SVGTemplateResult;
exports.TemplateResult = template_result_2.TemplateResult;
var template_1 = require("./lib/template");
exports.createMarker = template_1.createMarker;
exports.isTemplatePartActive = template_1.isTemplatePartActive;
exports.Template = template_1.Template;
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
exports.html = (strings, ...values) => new template_result_1.TemplateResult(strings, values, 'html', default_template_processor_1.defaultTemplateProcessor);
/**
 * Interprets a template literal as an SVG template that can efficiently
 * render to and update a container.
 */
exports.svg = (strings, ...values) => new template_result_1.SVGTemplateResult(strings, values, 'svg', default_template_processor_1.defaultTemplateProcessor);
__export(require("./directives/index"));
