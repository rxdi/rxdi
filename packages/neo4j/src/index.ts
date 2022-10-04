import { Module, ModuleWithServices } from '@rxdi/core';
import {
  NEO4J_MODULE_CONFIG,
  NEO4J_DRIVER
} from './injection.tokens';
import { SCHEMA_OVERRIDE } from '@rxdi/graphql';
import { GraphQLSchema } from 'graphql';
import { UtilService } from './neo4j.service';
import { OGMProvider } from './ogm.provider';

@Module({
  providers: [UtilService, OGMProvider]
})
export class Neo4JModule {
  public static forRoot(
    config: NEO4J_MODULE_CONFIG = {} as any
  ): ModuleWithServices {
    return {
      module: Neo4JModule,
      providers: [
        UtilService,
        {
          provide: NEO4J_MODULE_CONFIG,
          useValue: config
        },
        {
          provide: NEO4J_DRIVER,
          deps: [UtilService],
          useFactory: (util: UtilService) => util.createDriver()
        },
        ...(config.schemaOverride
          ? [
            {
              provide: SCHEMA_OVERRIDE,
              useFactory: () => (schema: GraphQLSchema) =>
                config.schemaOverride(schema)
            }
          ]
          : [
            {
              provide: SCHEMA_OVERRIDE,
              deps: [UtilService, NEO4J_DRIVER],
              useFactory: (util: UtilService, driver: NEO4J_DRIVER) => async (schema: GraphQLSchema) =>
                util.augmentSchema(schema)(driver)
            }
          ])
      ]
    };
  }

}

export * from './injection.tokens';
export * from './neo4j.service';
