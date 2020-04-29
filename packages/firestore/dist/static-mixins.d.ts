import { FirestoreCollection } from './mixins';
export declare class StaticMethods {
    static model: FirestoreCollection<any>;
    static setStaticSelf<T>(self: FirestoreCollection<T>): void;
    static create<T>(payload: T, doc?: string): Promise<T>;
    static getCollectionRef(): FirebaseFirestore.CollectionReference;
    static getFirestoreRef(): FirebaseFirestore.Firestore;
    static getRef(doc: string): FirebaseFirestore.DocumentReference;
    static get<T>(doc: string): Promise<T>;
    static delete(doc: string): Promise<FirebaseFirestore.WriteResult>;
    static update<T>(doc: string, payload: T): Promise<T>;
    static findAll<T>(where?: T): Promise<T[]>;
    static find<T>(payload: T): Promise<T>;
    static build<T>(payload: T): T;
}
