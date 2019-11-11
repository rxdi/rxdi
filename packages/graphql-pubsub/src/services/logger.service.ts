import { Injectable, Inject } from '@rxdi/core';
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG
} from '../config.tokens';

@Injectable()
export class PubSubLogger {
  child = () => new PubSubLogger(this.config);
  constructor(
    @Inject(GRAPHQL_PUB_SUB_CONFIG) private config: GRAPHQL_PUB_SUB_DI_CONFIG
  ) {}
  private logger(
    type: 'Trace' | 'Error' | 'Debug',
    log: string,
    channel: string,
    data: any
  ) {
    if (this.config.log) {
      console.log(`${type}: `, log, channel, data);
    }
  }
  trace(log: string, channel: string, data: any) {
    this.logger('Trace', log, channel, data);
  }
  debug(log: string, channel: string, data: any) {
    this.logger('Debug', log, channel, data);
  }
  error(log: string, channel: string, data: any) {
    this.logger('Error', log, channel, data);
  }
}
