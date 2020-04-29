import { Module, ModuleWithProviders } from '@rxdi/core';
import * as admin from 'firebase-admin';
import { Firestore } from './firebase.tokens';

@Module()
export class FirebaseModule {
  public static forRoot(config: admin.AppOptions): ModuleWithProviders {
    return {
      module: FirebaseModule,
      providers: [
        {
          provide: Firestore,
          useFactory: () => {
            admin.initializeApp(config);
            return admin.firestore();
          }
        }
      ]
    };
  }
}

export * from './firebase.tokens';
export * from './mixins';