import { InjectionToken } from '@rxdi/core';

export const Firestore = new InjectionToken<FirebaseFirestore.Firestore>('firestore-database');
export interface Firestore extends FirebaseFirestore.Firestore {}
