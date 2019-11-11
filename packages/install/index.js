#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("@rxdi/core/services/file");
const Container_1 = require("@rxdi/core/container/Container");
const external_importer_1 = require("@rxdi/core/services/external-importer");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const config_service_1 = require("@rxdi/core/services/config/config.service");
const externalImporter = Container_1.Container.get(external_importer_1.ExternalImporter);
exports.loadDeps = (jsonIpfs) => {
    if (!jsonIpfs) {
        throw new Error('Missing ipfs config!');
    }
    if (!jsonIpfs.provider) {
        throw new Error('Missing ipfsProvider package.json');
    }
    jsonIpfs.dependencies = jsonIpfs.dependencies || [];
    return jsonIpfs.dependencies.map(hash => {
        return { hash, provider: jsonIpfs.provider };
    }).filter(res => !!res);
};
exports.DownloadDependencies = (dependencies) => {
    return Container_1.Container.get(external_importer_1.ExternalImporter).downloadIpfsModules(dependencies);
};
if (process.argv.toString().includes('-v') || process.argv.toString().includes('--verbose')) {
    Container_1.Container.get(config_service_1.ConfigService).setConfig({ logger: { logging: true, hashes: true, date: true, exitHandler: true, fileService: true } });
}
const fileService = Container_1.Container.get(file_1.FileService);
let provider = externalImporter.defaultProvider;
let hash = '';
let json;
let modulesToDownload = [];
let customConfigFile;
let packageJsonConfigFile;
let rxdiConfigFile;
process.argv.forEach(function (val, index, array) {
    if (index === 2) {
        if (val.length === 46) {
            hash = val;
        }
        else if (val.includes('--hash=')) {
            hash = val.split('--hash=')[1];
        }
        else if (val.includes('-h=')) {
            hash = val.split('-h=')[1];
        }
    }
    if (index === 3) {
        if (val.includes('--provider=')) {
            provider = val.split('--provider=')[1];
        }
        else if (val.includes('http')) {
            provider = val;
        }
        else if (val.includes('-p=')) {
            provider = val.split('-p=')[1];
        }
    }
});
customConfigFile = `${process.cwd() + `/${process.argv[3]}`}`;
packageJsonConfigFile = `${process.cwd() + '/package.json'}`;
rxdiConfigFile = `${process.cwd() + '/.rxdi.json'}`;
if (hash) {
    modulesToDownload = [exports.DownloadDependencies(exports.loadDeps({ provider, dependencies: [hash] }))];
}
if (!hash && fileService.isPresent(customConfigFile)) {
    json = require(customConfigFile).ipfs;
}
if (!hash && fileService.isPresent(packageJsonConfigFile)) {
    json = require(packageJsonConfigFile).ipfs;
}
if (!hash && fileService.isPresent(rxdiConfigFile)) {
    json = require(rxdiConfigFile).ipfs;
}
if (!hash) {
    json = json || [];
    modulesToDownload = [...modulesToDownload, ...json.map(json => exports.DownloadDependencies(exports.loadDeps(json)))];
}
rxjs_1.combineLatest(modulesToDownload)
    .pipe(operators_1.tap(() => hash ? Container_1.Container.get(external_importer_1.ExternalImporter).addPackageToJson(hash) : null), operators_1.tap(() => externalImporter.filterUniquePackages()))
    .subscribe((c) => {
    console.log(JSON.stringify(c, null, 2), '\nModules installed!');
}, e => console.error(e));
