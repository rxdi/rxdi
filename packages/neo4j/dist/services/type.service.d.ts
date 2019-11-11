import { GraphQLObjectType } from 'graphql';
import { NEO4J_MODULE_CONFIG } from '../injection.tokens';
export declare class TypeService {
    private defaultExcludedTypes;
    private _registeredTypesMap;
    private _registeredTypes;
    readonly types: GraphQLObjectType<any, any, {
        [key: string]: any;
    }>[];
    getType(type: GraphQLObjectType): GraphQLObjectType<any, any, {
        [key: string]: any;
    }>;
    private addType;
    addTypes(types?: GraphQLObjectType[]): GraphQLObjectType<any, any, {
        [key: string]: any;
    }>[];
    extendExcludedTypes(c: NEO4J_MODULE_CONFIG): NEO4J_MODULE_CONFIG;
}
