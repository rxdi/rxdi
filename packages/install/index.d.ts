import { ExternalImporterIpfsConfig } from '@rxdi/core/services/external-importer';
import { Observable } from 'rxjs';
export interface PackagesConfig {
    dependencies: string[];
    provider: string;
}
export declare const loadDeps: (jsonIpfs: PackagesConfig) => {
    hash: string;
    provider: string;
}[];
export declare const DownloadDependencies: (dependencies: ExternalImporterIpfsConfig[]) => Observable<any>;
