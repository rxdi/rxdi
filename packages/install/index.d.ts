#!/usr/bin/env node
import { Observable } from 'rxjs';
export interface PackagesConfig {
    dependencies: string[];
    provider: string;
}
export declare const loadDeps: (jsonIpfs: PackagesConfig) => {
    hash: string;
    provider: string;
}[];
export declare const DownloadDependencies: (dependencies: any[]) => Observable<any>;
