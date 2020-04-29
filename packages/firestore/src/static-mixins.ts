import { FirestoreCollection } from './mixins';

export class StaticMethods {
  public static model: FirestoreCollection<any>;
  public static setStaticSelf<T>(self: FirestoreCollection<T>) {
    StaticMethods.model = self;
  }

  public static create<T>(payload: T, doc?: string): Promise<T> {
    return StaticMethods.model.create(payload, doc);
  }

  public static getCollectionRef() {
    return StaticMethods.model.getCollectionRef();
  }

  public static getFirestoreRef() {
    return StaticMethods.model.getFirestoreRef();
  }

  public static getRef(doc: string) {
    return StaticMethods.model.getRef(doc);
  }

  public static async get<T>(doc: string): Promise<T> {
    return StaticMethods.model.get(doc);
  }

  public static delete(doc: string) {
    return StaticMethods.model.delete(doc);
  }

  public static async update<T>(doc: string, payload: T): Promise<T> {
    return StaticMethods.model.update(doc, payload);
  }

  public static async findAll<T>(where?: T): Promise<T[]> {
    return StaticMethods.model.findAll(where);
  }

  public static async find<T>(payload: T): Promise<T> {
    return StaticMethods.model.find(payload);
  }

  public static build<T>(payload: T): T {
    return payload;
  }
}
