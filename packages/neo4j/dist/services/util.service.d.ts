import { GraphQLSchema } from 'graphql';
import { NEO4J_MODULE_CONFIG } from '../injection.tokens';
import { TypeService } from './type.service';
import { GRAPHQL_PLUGIN_CONFIG } from '@rxdi/graphql';
import { v1 as neo4j } from 'neo4j-driver';
export declare class UtilService {
    private config;
    private gqlConfig;
    private typeService;
    constructor(config: NEO4J_MODULE_CONFIG, gqlConfig: GRAPHQL_PLUGIN_CONFIG, typeService: TypeService);
    private extendSchemaDirectives;
    private validateSchema;
    augmentSchema(schema: GraphQLSchema): GraphQLSchema;
    mergeSchemas(...schemas: GraphQLSchema[]): GraphQLSchema;
    createRootSchema(): GraphQLSchema;
    assignDriverToContext(): neo4j.Driver;
}
