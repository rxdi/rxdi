"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const name_parser_1 = require("../../utils/name.parser");
const source_root_helpers_1 = require("../../utils/source-root.helpers");
const defaults_1 = require("../defaults");
function main(options) {
    options = transform(options);
    return (0, schematics_1.chain)([(0, source_root_helpers_1.mergeSourceRoot)(options), (0, schematics_1.mergeWith)(generate(options))]);
}
exports.main = main;
function transform(options) {
    const target = Object.assign({}, options);
    if (!target.name) {
        throw new schematics_1.SchematicsException('Option (name) is required.');
    }
    const location = new name_parser_1.NameParser().parse(target);
    target.name = core_1.strings.dasherize(location.name);
    target.language =
        target.language !== undefined ? target.language : defaults_1.DEFAULT_LANGUAGE;
    target.path = core_1.strings.dasherize(location.path);
    target.path = target.flat
        ? target.path
        : (0, core_1.join)(target.path, target.name);
    return target;
}
function generate(options) {
    return (context) => (0, schematics_1.apply)((0, schematics_1.url)((0, core_1.join)('./files', options.language)), [
        options.spec ? (0, schematics_1.noop)() : (0, schematics_1.filter)(path => !path.endsWith('.spec.ts')),
        (0, schematics_1.template)(Object.assign(Object.assign({}, core_1.strings), options)),
        (0, schematics_1.move)(options.path),
    ])(context);
}
