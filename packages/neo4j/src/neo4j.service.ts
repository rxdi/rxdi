import { Injectable, Inject } from '@rxdi/core';
import {
  NEO4J_DRIVER,
  NEO4J_MODULE_CONFIG,
  Relationship,
  RelationshipMap,
  RelationshipType
} from './injection.tokens';
import { mergeSchemas } from 'graphql-tools';
import * as neo4j from 'neo4j-driver';
import { Neo4jGraphQL } from '@neo4j/graphql';
import {
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  validateSchema
} from 'graphql';
import { OGMProvider } from './ogm.provider';
import { OGM } from '@neo4j/graphql-ogm';

@Injectable()
export class UtilService {
  constructor(
    @Inject(NEO4J_MODULE_CONFIG)
    private config: NEO4J_MODULE_CONFIG,
    private ogmProvider: OGMProvider
  ) { }

  private extendSchemaDirectives(
    augmentedSchema: GraphQLSchema,
    schema: GraphQLSchema
  ) {
    augmentedSchema['_directives'] = schema['_directives'];
    return augmentedSchema;
  }

  private validateSchema(schema: GraphQLSchema) {
    const schemaErrors = validateSchema(schema);
    if (schemaErrors.length) {
      throw new Error(JSON.stringify(schemaErrors));
    }
  }
  private replaceAll(value: string) {
    return (search: string) => (replacement: string) =>
      value.split(search).join(replacement)
  }

  augmentSchema(schema: GraphQLSchema) {
    return async (driver: NEO4J_DRIVER) => {
      this.validateSchema(schema);
      const typeDefs = this.generateTypeDefs(schema);
      await this.initOgmClient(typeDefs)(driver)
      const neoSchema = new Neo4jGraphQL({
        typeDefs,
        driver,
        assumeValidSDL: true,
      });
      const augmentedSchema = await neoSchema.getSchema();
      const newSchema = this.extendSchemaDirectives(
        augmentedSchema,
        schema
      );
      return newSchema;
    }
  }

  initOgmClient(typeDefs: string) {
    return async (driver: NEO4J_DRIVER) => {
      const ogm = new OGM({
        assumeValidSDL: true,
        assumeValid: true,
        typeDefs,
        driver
      });
      await ogm.init();
      this.ogmProvider.client = ogm;
    }
  }

  mergeSchemas(...schemas: GraphQLSchema[]) {
    return this.extendSchemaDirectives(
      mergeSchemas({
        schemas: schemas.filter(s => !!s)
      }),
      schemas.filter(s => !!s)[0]
    );
  }

  createDriver() {
    return neo4j.driver(
      this.config.address || 'bolt://localhost:7687',
      neo4j.auth.basic(this.config.username, this.config.password)
    );
  }

  generateTypeDefs(schema: GraphQLSchema) {
    return Object.values(this.findSchemaExtensions(schema)).reduce(
      (curr, prev) => {
        if (prev.extends) {
          return `${curr}\n${prev.extends}`
        }
        return this.replaceAll(curr)(prev.searchIndex)(prev.replaceWith);
      },
      printSchema(schema)
    );
  }

  private findSchemaExtensions(schema: GraphQLSchema) {
    const extensions = {} as RelationshipMap;
    for (const field of Object.values(schema.getQueryType()).filter(i => !!i)) {
      if (typeof field !== 'string') {
        Object.keys(field).reduce((prev, currentType) => {
          const type = field[currentType].type as GraphQLObjectType;
          if (type['extend']) {
            extensions[currentType] = {
              extends: `extend type ${type.name} ${type['extend']}`
            }
          }
          if (type && typeof type.getFields === 'function') {
            for (const [key, value] of Object.entries(type.getFields())) {
              extensions[key] =
                extensions[key] || ({} as RelationshipType);
              const relation = value['relation'] as Relationship;
              const directive: string = typeof relation === 'object' ?
                `@relationship(type: "${relation.name}", direction: ${relation.direction})`
                :
                value['directive']

              if (directive) {
                extensions[key].searchIndex = `${key}: ${value.type}`;
                extensions[key].replaceWith = `${extensions[key].searchIndex} ${directive}`
              }
            }
          }
          return prev
        }, {} as RelationshipType);
      }
    }
    return extensions;
  }
}
