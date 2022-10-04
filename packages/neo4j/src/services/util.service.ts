import { Injectable, Inject } from '@rxdi/core';
import { NEO4J_DRIVER, NEO4J_MODULE_CONFIG, Relationship, RelationshipMap, RelationshipType } from '../injection.tokens';
import { mergeSchemas } from 'graphql-tools';
import * as neo4j from 'neo4j-driver';
import { Neo4jGraphQL, Neo4jGraphQLSubscriptionsSingleInstancePlugin } from '@neo4j/graphql';
import { GraphQLObjectType, GraphQLSchema, printSchema, validateSchema } from 'graphql';
import { SubscriptionService } from '@gapi/core';

import { useServer } from 'graphql-ws/lib/use/ws';

// @ts-ignore
String.prototype.replaceAll = function (search: string, replacement: string) {
  return this.split(search).join(replacement);
};

@Injectable()
export class UtilService {
  constructor(
    @Inject(NEO4J_MODULE_CONFIG) private config: NEO4J_MODULE_CONFIG,
    private websocket: SubscriptionService
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

  augmentSchema(schema: GraphQLSchema) {
    return async (driver: NEO4J_DRIVER) => {
      this.validateSchema(schema);
      const typeDefs = this.generateTypeDefs(schema);
      const neoSchema = new Neo4jGraphQL({
        typeDefs,
        driver,
        assumeValidSDL: true,
        plugins: {
          subscriptions: new Neo4jGraphQLSubscriptionsSingleInstancePlugin(),
        },
      });
      const augmentedSchema = await neoSchema.getSchema();
      useServer({ schema: augmentedSchema }, this.websocket.wsServer.server)
      return this.extendSchemaDirectives(
        augmentedSchema,
        schema
      );
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

  assignDriverToContext() {
    return neo4j.driver(
      this.config.address || 'bolt://localhost:7687',
      neo4j.auth.basic(this.config.username, this.config.password)
    );
  }

  generateTypeDefs(schema: GraphQLSchema) {
    return Object.values(this.findRelations(schema)).reduce(
      (curr, prev) => curr['replaceAll'](prev.searchIndex, prev.replaceWith),
      printSchema(schema)
    );
  }

  private findRelations(schema: GraphQLSchema) {
    const relations = {} as RelationshipMap;
    Object.values(schema.getQueryType()).forEach(field => {
      if (!field) {
        return;
      }
      if (typeof field === 'string') {
        return;
      }

      Object.keys(field).reduce((prev, currentType) => {
        const type = field[currentType].type as GraphQLObjectType;
        if (type && typeof type.getFields === 'function') {
          Object.entries(type.getFields()).map(([key, value]) => {
            relations[key] =
              relations[key] || ({} as RelationshipType);
            const relation = value['relation'] as Relationship;
            if (typeof relation === 'object') {
              relations[key].searchIndex = `${key}: ${value.type}`;
              const cyper =
                relation.cyper ||
                `@relationship(type: "${relation.name}", direction: ${relation.direction})`;
              relations[
                key
              ].replaceWith = `${relations[key].searchIndex} ${cyper}`;
            }
          });
        }
        return prev;
      }, {} as RelationshipType);
    });
    return relations;
  }
}
