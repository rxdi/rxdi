import { Injectable } from '@gapi/core';
import { OGM } from '@neo4j/graphql-ogm';

@Injectable()
export class OGMProvider<T = OGM> {
  client: OGM<T>
}
