"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const defaults_1 = require("../defaults");
function main(options) {
    options = transform(options);
    return (0, schematics_1.chain)([
        updateTsConfig(options.name, options.prefix, options.path),
        addLibraryToCliOptions(options.path, options.name),
        (0, schematics_1.branchAndMerge)((0, schematics_1.mergeWith)(generate(options))),
    ]);
}
exports.main = main;
function transform(options) {
    const target = Object.assign({}, options);
    const defaultSourceRoot = options.rootDir !== undefined ? options.rootDir : defaults_1.DEFAULT_LIB_PATH;
    if (!target.name) {
        throw new schematics_1.SchematicsException('Option (name) is required.');
    }
    target.language = !!target.language ? target.language : defaults_1.DEFAULT_LANGUAGE;
    target.name = core_1.strings.dasherize(target.name);
    target.path =
        target.path !== undefined
            ? (0, core_1.join)((0, core_1.normalize)(defaultSourceRoot), target.path)
            : (0, core_1.normalize)(defaultSourceRoot);
    target.prefix = target.prefix || '@app';
    return target;
}
function updateJsonFile(host, path, callback) {
    const source = host.read(path);
    if (source) {
        const sourceText = source.toString('utf-8');
        const json = (0, core_1.parseJson)(sourceText);
        callback(json);
        host.overwrite(path, JSON.stringify(json, null, 2));
    }
    return host;
}
function updateTsConfig(packageName, packagePrefix, root) {
    return (host) => {
        if (!host.exists('tsconfig.json')) {
            return host;
        }
        const distRoot = (0, core_1.join)(root, packageName, 'src');
        const packageKey = packagePrefix
            ? packagePrefix + '/' + packageName
            : packageName;
        return updateJsonFile(host, 'tsconfig.json', (tsconfig) => {
            if (!tsconfig.compilerOptions) {
                tsconfig.compilerOptions = {};
            }
            if (!tsconfig.compilerOptions.baseUrl) {
                tsconfig.compilerOptions.baseUrl = './';
            }
            if (!tsconfig.compilerOptions.paths) {
                tsconfig.compilerOptions.paths = {};
            }
            if (!tsconfig.compilerOptions.paths[packageKey]) {
                tsconfig.compilerOptions.paths[packageKey] = [];
            }
            tsconfig.compilerOptions.paths[packageKey].push(distRoot);
            const deepPackagePath = packageKey + '/*';
            if (!tsconfig.compilerOptions.paths[deepPackagePath]) {
                tsconfig.compilerOptions.paths[deepPackagePath] = [];
            }
            tsconfig.compilerOptions.paths[deepPackagePath].push(distRoot + '/*');
        });
    };
}
function addLibraryToCliOptions(projectRoot, projectName) {
    const project = {
        root: (0, core_1.join)(projectRoot, projectName),
        sourceRoot: (0, core_1.join)(projectRoot, projectName, 'src'),
    };
    return (host) => {
        const nestCliFileExists = host.exists('nest-cli.json');
        const nestFileExists = host.exists('nest.json');
        if (!nestCliFileExists && !nestFileExists) {
            return host;
        }
        return updateJsonFile(host, nestCliFileExists ? 'nest-cli.json' : 'nest.json', (optionsFile) => {
            if (!optionsFile.projects) {
                optionsFile.projects = {};
            }
            optionsFile.projects[projectName] = project;
        });
    };
}
function generate(options) {
    const path = (0, core_1.join)(options.path, options.name);
    return (0, schematics_1.apply)((0, schematics_1.url)((0, core_1.join)('./files', options.language)), [
        (0, schematics_1.template)(Object.assign(Object.assign({}, core_1.strings), options)),
        (0, schematics_1.move)(path),
    ]);
}
