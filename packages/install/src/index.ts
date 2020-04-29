#!/usr/bin/env node

import { FileService } from '@rxdi/core/services/file';
import { Container } from '@rxdi/core/container/Container';
import { ExternalImporter, ExternalImporterIpfsConfig } from '@rxdi/core/services/external-importer';
import { Observable, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@rxdi/core/services/config/config.service';

const externalImporter = Container.get(ExternalImporter);
const fileService = Container.get(FileService);
let provider = externalImporter.defaultProvider;
let hash = '';
let json: PackagesConfig[];
let modulesToDownload = [];
let customConfigFile;
let packageJsonConfigFile;
let rxdiConfigFile;

export interface PackagesConfig {
    dependencies: string[];
    provider: string;
}

export const loadDeps = (jsonIpfs: PackagesConfig) => {
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

export const DownloadDependencies = (dependencies: ExternalImporterIpfsConfig[]): Observable<any> => {
    return Container.get(ExternalImporter).downloadIpfsModules(dependencies);
};

if (process.argv.toString().includes('-v') || process.argv.toString().includes('--verbose')) {
    Container.get(ConfigService).setConfig({ logger: { logging: true, hashes: true, date: true, exitHandler: true, fileService: true } });
}

process.argv.forEach(function (val, index, array) {
    if (index === 2) {
        if (val.length === 46) {
            hash = val;
        } else if (val.includes('--hash=')) {
            hash = val.split('--hash=')[1];
        } else if (val.includes('-h=')) {
            hash = val.split('-h=')[1];
        }
    }
    if (index === 3) {
        if (val.includes('--provider=')) {
            provider = val.split('--provider=')[1];
        } else if (val.includes('http')) {
            provider = val;
        } else if (val.includes('-p=')) {
            provider = val.split('-p=')[1];
        }

    }
});

customConfigFile = `${process.cwd() + `/${process.argv[3]}`}`;
packageJsonConfigFile = `${process.cwd() + '/package.json'}`;
rxdiConfigFile = `${process.cwd() + '/.rxdi.json'}`;

if (hash) {
    modulesToDownload = [DownloadDependencies(loadDeps({ provider, dependencies: [hash] }))];
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
    modulesToDownload = [...modulesToDownload, ...json.map(json => DownloadDependencies(loadDeps(json)))];
}

combineLatest(modulesToDownload)
    .pipe(
        tap(() => hash ? Container.get(ExternalImporter).addPackageToJson(hash) : null),
        tap(() => externalImporter.filterUniquePackages())
    )
    .subscribe((c) => {

        console.log(JSON.stringify(c, null, 2), '\nModules installed!');
    }, e => console.error(e));
