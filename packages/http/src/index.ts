import { Module } from '@rxdi/core';
import { HttpClient } from './http.provider';
import { GraphqClientConfig } from './http.tokens';

@Module({
  providers: [HttpClient],
})
export class HttpModule {
  public static forRoot(config: GraphqClientConfig) {
    return {
      module: HttpModule,
      providers: [
        {
          provide: GraphqClientConfig,
          useValue: config,
        },
      ],
    };
  }
}

export * from './http.provider';
export * from './http.tokens';
