import { InjectionToken } from '@rxdi/core';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { ResponseToolkit } from 'hapi';
export declare const Neo4JTypes: InjectionToken<GraphQLObjectType<any, any, {
    [key: string]: any;
}>[]>;
interface Neo4JTypesPrivate extends GraphQLObjectType {
}
export declare type Neo4JTypes = Neo4JTypesPrivate[];
export declare const NEO4J_MODULE_CONFIG: InjectionToken<NEO4J_MODULE_CONFIG>;
export declare type IExcludeType = string | Function | GraphQLObjectType;
export interface ExcludedTypes {
    mutation?: {
        exclude: IExcludeType[];
    };
    query?: {
        exclude: IExcludeType[];
    };
}
export interface NEO4J_MODULE_CONFIG {
    types?: GraphQLObjectType[];
    username?: string;
    password?: string;
    address?: string | 'bolt://localhost:7687';
    excludedTypes?: ExcludedTypes;
    debug?: boolean;
    auth?: boolean;
    context?: any;
    onRequest?(next: any, context: any, request: Request, h: ResponseToolkit, err: Error): Promise<any>;
    schemaOverride?(schema: GraphQLSchema): GraphQLSchema;
}
export declare const NEO4J_DRIVER: InjectionToken<{}>;
declare const graphRequest: <T>(root: any, params: any, ctx: any, resolveInfo: any) => Promise<T>;
export { graphRequest };
export { Driver } from 'neo4j-driver/types/v1';
