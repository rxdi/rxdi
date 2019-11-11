import { BootstrapLogger } from '@rxdi/core';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { GraphQLObjectType, GraphQLField, GraphQLResolveInfo, GraphQLFieldConfig } from 'graphql';
import { GenericGapiResolversType } from '../decorators/query/query.decorator';
import { EffectService } from './effect.service';
export declare class HookService {
    private config;
    private effectService;
    private logger;
    private bootstrap;
    methodBasedEffects: any[];
    constructor(config: GRAPHQL_PLUGIN_CONFIG, effectService: EffectService, logger: BootstrapLogger);
    AttachHooks(graphQLFields: GraphQLObjectType[]): void;
    writeEffectTypes(effects?: Array<string>): void;
    applyMeta(resolver: GraphQLField<any, any>): void;
    applyTypeFields<T, K>(resolver: GraphQLField<T, K>, rxdiResolver: GraphQLFieldConfig<T, K>): void;
    applyGuards(desc: GenericGapiResolversType, a: any): Promise<void>;
    validateGuard(res: Function): Promise<void>;
    applyMetaToResolver(resolver: GenericGapiResolversType): void;
    canAccess<K extends {
        user: {
            type: string;
        };
    }>(resolverScope: string[], context: K): boolean;
    AuthenticationHooks<T, K>(resolver: GraphQLField<T, K>, context: K): void;
    ResolverHooks<T, K>(resolver: GraphQLField<T, K>, root: T, args: {
        [key: string]: any;
    }, context: K, info: GraphQLResolveInfo): void;
    AddHooks<T, K>(resolver: GraphQLField<T, K>): void;
}
