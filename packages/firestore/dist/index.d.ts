import { ModuleWithProviders } from '@rxdi/core';
import * as admin from 'firebase-admin';
export declare class FirebaseModule {
    static forRoot(config: admin.AppOptions): ModuleWithProviders;
}
export * from './firebase.tokens';
export * from './mixins';
