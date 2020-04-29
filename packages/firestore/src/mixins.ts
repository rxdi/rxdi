import { CollectionReference, Firestore, Query } from '@google-cloud/firestore';
import { StaticMethods } from './static-mixins';


export class FirestoreCollection<T> extends StaticMethods {
  private collection: CollectionReference;
  constructor(collectionName: string, firestore: Firestore) {
    super();
    this.collection = firestore.collection(collectionName);
    FirestoreCollection.setStaticSelf(this);
  }

  getCollectionRef() {
    return this.collection;
  }

  getFirestoreRef() {
    return this.collection.firestore;
  }

  getRef(doc: string) {
    return this.collection.doc(doc);
  }

  async create(payload: T, doc?: string): Promise<T> {
    let ref = this.collection.doc();
    if (doc) {
      ref = this.getRef(doc);
    }
    payload['id'] = ref.id;
    const document = await ref.set(payload);
    return {
      writeTime: document.writeTime,
      ...payload
    };
  }

  async get(doc: string): Promise<T> {
    return (await this.getRef(doc).get()).data() as T;
  }

  delete(doc: string) {
    return this.getRef(doc).delete();
  }

  async update(doc: string, payload: T): Promise<T> {
    await this.getRef(doc).update(payload);
    return this.get(doc);
  }

  async findAll(where?: T): Promise<T[]> {
    if (!where) {
      const snapshot = await this.collection.get();
      return snapshot.docs.map(doc => doc.data()) as T[];
    }
    let query: Query;
    Object.keys(where).forEach(k => {
      if (!query) {
        query = this.collection.where(k, '==', where[k]);
      }
      query.where(k, '==', where[k]);
    });
    return (await query.get()).docs.map(doc => doc.data()) as T[];
  }

  async find(payload: T): Promise<T> {
    const docs = await this.findAll(payload);
    if (docs.length > 1) {
      throw new Error('More than one documents found for this query');
    }
    if (docs.length) {
      return docs[0];
    }
    return null;
  }

  build<T>(payload: T): T {
    return payload;
  }
}
