# Firebase firestore reactive database mixins

- TypeSafe, Reactive
- Firebase cloud function and AWS Lambda compatability

#### Install
```bash
npm i @rxdi/firestore
```

#### Initialize firebase module
```typescript

import { Module } from '@rxdi/core';
import { FirebaseModule } from '@rxdi/firestore';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

@Module({
  imports: [
    FirebaseModule.forRoot({
      projectId: 'your-firebase-project-id',
      credential: process.env.IS_NOT_LAMBDA
        ? admin.credential.applicationDefault()
        : functions.config().firebase
    }),
  ],
})
export class AppModule {}
```

#### Set environment variable `GOOGLE_APPLICATION_CREDENTIALS` representing your Firebase configuration

> More info can be found here https://firebase.google.com/docs/admin/setup

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/service-account-file.json"
```

```json
{
    "type": "service_account",
    "project_id": "",
    "private_key_id": "",
    "private_key": "-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----\n",
    "client_email": "",
    "client_id": "",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-eb9yl%40xx-xx-xx.iam.gserviceaccount.com"
  }
```

When executing `admin.credential.applicationDefault()` firebase will get path from `GOOGLE_APPLICATION_CREDENTIALS` and try to read and load the credentials.



#### Define your reactive firestore collections


```typescript
import { Injectable, Inject } from '@rxdi/core';
import { GenericFirebaseModel, Firestore } from '@rxdi/firestore';

interface IUserType {
  id: string;
  displayName: string;
  email: string;
}

@Injectable()
export class UserCollection extends GenericFirebaseModel<IUserType> {
  constructor(@Inject(Firestore) firestore: Firestore) {
    super('users', firestore);
  }
}

```

#### import `UserCollection` inside `AppModule` as a provider/service

```typescript
import { Module } from '@rxdi/core';
import { FirebaseModule } from '@rxdi/firestore';
import { ModelsModule } from '../database/models.module';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserCollection } from './models/user';

@Module({
  imports: [
    FirebaseModule.forRoot({
      projectId: 'your-firebase-project-id',
      credential: process.env.IS_NOT_LAMBDA
        ? admin.credential.applicationDefault()
        : functions.config().firebase
    }),
  ],
  providers: [UserCollection]
})
export class AppModule {}

```


#### Use created mixins


```typescript
import { Injectable } from '@rxdi/core';
import { UserCollection } from '../models/user';

@Injectable()
export class UserCollectionService {
  constructor(
    private userCollection: UserCollection
  ) {}
}

```

#### Mixins provide the following instance methods

```typescript
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
```


#### Mixins provide also static methods

```typescript
import { FirestoreCollection } from './mixins';
export declare class StaticMethods {
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
```
