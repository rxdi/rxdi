import { Injectable, Inject } from '@rxdi/core';
import { NEO4J_DRIVER, NEO4J_MODULE_CONFIG, Relationship, RelationshipMap, RelationshipType } from '../injection.tokens';
import { mergeSchemas } from 'graphql-tools';
import * as neo4j from 'neo4j-driver';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { GraphQLObjectType, GraphQLSchema, printSchema, validateSchema } from 'graphql';

@Injectable()
export class UtilService {
  constructor(
    @Inject(NEO4J_MODULE_CONFIG) private config: NEO4J_MODULE_CONFIG,
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
      });
      return this.extendSchemaDirectives(
        await neoSchema.getSchema(),
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
      (curr, prev) => curr.replace(prev.searchIndex, prev.replaceWith),
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
            relations[currentType] =
              relations[currentType] || ({} as RelationshipType);
            const relation = value['relation'] as Relationship;
            if (typeof relation === 'object') {
              relations[currentType].searchIndex = `${key}: ${value.type}`;
              const cyper =
                relation.cyper ||
                `@relationship(type: "${relation.name}", direction: ${relation.direction})`;
              relations[
                currentType
              ].replaceWith = `${relations[currentType].searchIndex} ${cyper}`;
            }
          });
        }
        return prev;
      }, {} as RelationshipType);
    });
    return relations;
  }
}
