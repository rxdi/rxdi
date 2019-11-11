import { Injectable, Inject } from '@rxdi/core';
import {
  GraphQLSchema,
  printSchema,
  validateSchema,
  GraphQLObjectType
} from 'graphql';
import * as neo4jgql from 'neo4j-graphql-js';
import { NEO4J_MODULE_CONFIG } from '../injection.tokens';
import { TypeService } from './type.service';
import { GRAPHQL_PLUGIN_CONFIG } from '@rxdi/graphql';
import { mergeSchemas } from '@gapi/core';
import { v1 as neo4j } from 'neo4j-driver';

@Injectable()
export class UtilService {
  constructor(
    @Inject(NEO4J_MODULE_CONFIG) private config: NEO4J_MODULE_CONFIG,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private gqlConfig: GRAPHQL_PLUGIN_CONFIG,
    private typeService: TypeService
  ) {}

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

  augmentSchema(schema: GraphQLSchema) {
    this.validateSchema(schema);
    return this.extendSchemaDirectives(
      neo4jgql.makeAugmentedSchema({
        typeDefs: printSchema(schema),
        config: this.config.excludedTypes
      }),
      schema
    );
  }

  mergeSchemas(...schemas: GraphQLSchema[]) {
    return this.extendSchemaDirectives(
      mergeSchemas({
        schemas: schemas.filter(s => !!s)
      }),
      schemas.filter(s => !!s)[0]
    );
  }

  createRootSchema() {
    return new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'RootQuery',
        fields: {}
      }),
      directives: this.gqlConfig.directives || [],
      types: this.typeService.types || []
    });
  }

  assignDriverToContext() {
    const driver = neo4j.driver(
      this.config.address || 'bolt://localhost:7687',
      neo4j.auth.basic(this.config.username, this.config.password)
    );
    Object.assign(this.gqlConfig.graphqlOptions, {
      context: { driver, ...{ ...this.config.context } }
    });
    return driver;
  }
}
