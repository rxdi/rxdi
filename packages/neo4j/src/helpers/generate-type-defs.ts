import { GraphQLSchema, printSchema, GraphQLObjectType } from 'graphql';
import {
  RelationshipMap,
  RelationshipType,
  Relationship
} from '../injection.tokens';

export function findRelations(schema: GraphQLSchema) {
  const relations = {} as RelationshipMap;
  Object.values(schema.getQueryType()).forEach(field => {
    if (!field) {
      return;
    }
    if (typeof field === 'string') {
      return;
    }

    Object.keys(field).reduce((prev, currentType) => {
      const type = schema.getType(`${currentType}`) as GraphQLObjectType;
      console.log(type, currentType);
      if (type) {

        Object.entries(type.getFields()).map(([key, value]) => {
          relations[currentType] =
            relations[currentType] || ({} as RelationshipType);
          const relation = value['relation'] as Relationship;
          if (typeof relation === 'object') {
            relations[currentType].searchIndex = `${key}: ${value.type}`;
            const cyper =
              relation.cyper ||
              `@relation(name: "${relation.name}", direction: "${relation.direction}")`;
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

export function generateTypeDefs(schema: GraphQLSchema) {
  return Object.values(findRelations(schema)).reduce(
    (curr, prev) => curr.replace(prev.searchIndex, prev.replaceWith),
    printSchema(schema)
  );
}
