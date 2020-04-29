import { GraphQLDirective, GraphQLSchema, DirectiveLocationEnum } from 'graphql';
/**
 * Apply custom directives support in the graphql schema
 */
export declare const applySchemaCustomDirectives: (schema: GraphQLSchema) => GraphQLSchema;
export interface GraphQLCustomDirectiveInterface<T = {}, A = {}, K = {}> {
    name: string;
    description?: string;
    locations: DirectiveLocationEnum[];
    args?: {
        [key: string]: {
            description: string;
            type: any;
        };
    };
    resolve: (resolve: () => Promise<T>, source: any, args: A, context: K, info: any) => Promise<T>;
}
export declare const GraphQLCustomDirective: GraphQLCustomDirective;
export interface GraphQLCustomDirective {
    new <T = {}, K = {}, A = {}>(options: GraphQLCustomDirectiveInterface<T, K, A>): GraphQLDirective;
}
