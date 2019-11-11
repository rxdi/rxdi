import { ModuleService } from '@rxdi/core';
import { GraphQLObjectType, GraphQLSchema, GraphQLFieldConfigMap } from 'graphql';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { GenericGapiResolversType } from '../decorators/query/query.decorator';
export declare class FieldsModule {
    query: {};
    mutation: {};
    subscription: {};
}
export declare class MetaDescriptor {
    descriptor: () => GenericGapiResolversType;
    self: any;
}
export interface CurrentConstructorInteraface {
    value: any;
    type: {
        _descriptors: Map<string, {
            value: () => GenericGapiResolversType;
        }>;
    };
}
export interface InternalFields {
    query: GraphQLFieldConfigMap<any, any>;
    mutation: GraphQLFieldConfigMap<any, any>;
    subscription: GraphQLFieldConfigMap<any, any>;
}
export declare class BootstrapService {
    private moduleService;
    private config;
    Fields: InternalFields;
    schema: GraphQLSchema;
    constructor(moduleService: ModuleService, config: GRAPHQL_PLUGIN_CONFIG);
    getResolverByName(resolverName: string): import("graphql").GraphQLFieldConfig<any, any, {
        [key: string]: any;
    }>;
    validateResolver(desc: GenericGapiResolversType, self: Function): void;
    applyInitStatus(): {
        type: GraphQLObjectType<any, any, {
            [key: string]: any;
        }>;
        method_name: string;
        public: boolean;
        method_type: string;
        target: () => void;
        resolve: () => {
            status: number;
        };
    };
    collectAppSchema(): InternalFields;
    getFieldsFromType(schema: GraphQLSchema): {
        [key: string]: {
            type: any;
            resolve: () => {};
            isDeprecated: boolean;
            name: string;
            args: any[];
        };
    };
    isEmptySchemaFields(Fields: InternalFields): boolean;
    generateSchema(schemaOverride?: boolean): GraphQLSchema;
    private getDirectives;
    private generateType;
    private applyGlobalControllerOptions;
    getMetaDescriptors(): MetaDescriptor[];
}
