import { CollectionReference, Firestore } from '@google-cloud/firestore';
import { StaticMethods } from './static-mixins';
export declare class FirestoreCollection<T> extends StaticMethods {
    private collection;
    constructor(collectionName: string, firestore: Firestore);
    getCollectionRef(): CollectionReference;
    getFirestoreRef(): Firestore;
    getRef(doc: string): FirebaseFirestore.DocumentReference;
    create(payload: T, doc?: string): Promise<T>;
    get(doc: string): Promise<T>;
    delete(doc: string): Promise<FirebaseFirestore.WriteResult>;
    update(doc: string, payload: T): Promise<T>;
    findAll(where?: T): Promise<T[]>;
    find(payload: T): Promise<T>;
    build<T>(payload: T): T;
}
