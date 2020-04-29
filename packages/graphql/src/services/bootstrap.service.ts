import { ModuleService, Service, Inject, Container } from '@rxdi/core';
import {
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  GraphQLFieldConfigMap,
  buildSchema,
  GraphQLString,
  validateSchema
} from 'graphql';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { GenericGapiResolversType } from '../decorators/query/query.decorator';
import { GraphQLControllerOptions } from '../decorators/guard/guard.interface';
import {
  applySchemaCustomDirectives,
  GraphQLCustomDirective
} from '../helpers/directives/custom-directive';
// import { makeExecutableSchema, addMockFunctionsToSchema, mergeSchemas, } from 'graphql-tools';

export class FieldsModule {
  query: {};
  mutation: {};
  subscription: {};
}
export class MetaDescriptor {
  descriptor: () => GenericGapiResolversType;
  self;
}
export interface CurrentConstructorInteraface {
  value: any;
  type: {
    _descriptors: Map<string, { value: () => GenericGapiResolversType }>;
  };
}
export interface InternalFields {
  query: GraphQLFieldConfigMap<any, any>;
  mutation: GraphQLFieldConfigMap<any, any>;
  subscription: GraphQLFieldConfigMap<any, any>;
}

@Service()
export class BootstrapService {
  Fields: InternalFields = { query: {}, mutation: {}, subscription: {} };
  schema: GraphQLSchema;

  constructor(
    private moduleService: ModuleService,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG
  ) {}

  getResolverByName(resolverName: string) {
    return (
      this.Fields.query[resolverName] ||
      this.Fields.mutation[resolverName] ||
      this.Fields.subscription[resolverName]
    );
  }

  validateResolver(desc: GenericGapiResolversType, self: Function) {
    if (!desc.type) {
      throw new Error(
        `Missing type for resolver ${desc.method_name} inside @Controller ${
          self.constructor['originalName']
        }`
      );
    }
  }

  applyInitStatus() {
    return {
      type: new GraphQLObjectType({
        name: 'StatusQueryType',
        fields: () => ({ status: { type: GraphQLString } })
      }),
      method_name: 'status',
      public: true,
      method_type: 'query',
      target: () => {},
      resolve: function initQuery() {
        return { status: 200 };
      }
    };
  }

  collectAppSchema() {
    const Fields: InternalFields = this.Fields;
    if (this.config.initQuery) {
      Fields.query.status = this.applyInitStatus();
    }
    this.applyGlobalControllerOptions();
    this.getMetaDescriptors().forEach(({ descriptor, self }) => {
      const desc = descriptor();
      desc.target = self;
      this.validateResolver(desc, self);
      Fields[desc.method_type][desc.method_name] = desc;
    });

    this.Fields = Fields;
    return this.Fields;
  }

  getFieldsFromType(
    schema: GraphQLSchema
  ): {
    [key: string]: {
      type: any;
      resolve: () => {};
      isDeprecated: boolean;
      name: string;
      args: any[];
    };
  } {
    return schema
      .getQueryType()
      .getFields()
      .findUser.type['getFields']();
  }

  isEmptySchemaFields(Fields: InternalFields) {
    return !Object.keys(Fields)
      .map(f => Fields[f])
      .filter(f => !!Object.keys(f).length).length;
  }

  generateSchema(schemaOverride?: boolean): GraphQLSchema {
    const Fields = this.collectAppSchema();
    if (this.isEmptySchemaFields(Fields) && schemaOverride) {
      return null;
    }
    let schema: GraphQLSchema = new GraphQLSchema({
      directives: this.getDirectives(),
      query: this.generateType(
        Fields.query,
        'Query',
        'Query type for all get requests which will not change persistent data'
      ),
      mutation: this.generateType(
        Fields.mutation,
        'Mutation',
        'Mutation type for all requests which will change persistent data'
      ),
      subscription: this.generateType(
        Fields.subscription,
        'Subscription',
        'Subscription type for all subscriptions via pub sub'
      )
    });
    const schemaErrors = validateSchema(schema);
    if (schemaErrors.length) {
      throw new Error(JSON.stringify(schemaErrors));
    }
    // Build astNode https://github.com/graphql/graphql-js/issues/1575
    if (this.config.buildAstDefinitions) {
      schema = buildSchema(printSchema(schema));
    }
    if (this.config.directives && this.config.directives.length) {
      schema = applySchemaCustomDirectives(schema);
    }
    this.schema = schema;
    return schema;
  }

  private getDirectives() {
    return [...(this.config.directives || [])].map(d =>
      d.metadata ? new GraphQLCustomDirective(Container.get(d)) : d
    );
  }

  private generateType(
    fields: GraphQLFieldConfigMap<any, any>,
    name: string,
    description: string
  ): GraphQLObjectType {
    if (!Object.keys(fields).length) {
      return;
    }
    return new GraphQLObjectType({ name, description, fields });
  }

  private applyGlobalControllerOptions() {
    Array.from(this.moduleService.watcherService._constructors.keys())
      .filter(
        key =>
          this.moduleService.watcherService.getConstructor(key)['type'][
            'metadata'
          ]['type'] === 'controller'
      )
      .map(key => {
        const currentConstructor: CurrentConstructorInteraface = this.moduleService.watcherService.getConstructor(
          key
        ) as any;
        const options: GraphQLControllerOptions =
          currentConstructor.type['metadata'].options;
        currentConstructor.type._descriptors =
          currentConstructor.type._descriptors || ([] as any);
        Array.from(currentConstructor.type._descriptors.keys()).map(k => {
          if (!options) {
            return;
          }
          const orig = currentConstructor.type._descriptors.get(k);
          const descriptor: GenericGapiResolversType = orig.value();

          if (options.scope) {
            descriptor.scope = descriptor.scope || options.scope;
          }

          if (options.guards && options.guards.length && !descriptor.public) {
            descriptor.guards = descriptor.guards || options.guards;
          }

          if (options.type) {
            descriptor.type = descriptor.type || options.type;
          }

          if (options.interceptor && !descriptor.interceptor) {
            descriptor.interceptor = options.interceptor;
          }
          orig.value = () => descriptor;
          currentConstructor.type._descriptors.set(k, orig);
        });
        return key;
      });
  }

  getMetaDescriptors(): MetaDescriptor[] {
    const descriptors: MetaDescriptor[] = [];
    Array.from(this.moduleService.watcherService._constructors.keys())
      .filter(
        key =>
          this.moduleService.watcherService.getConstructor(key)['type'][
            'metadata'
          ]['type'] === 'controller'
      )
      .map(
        key => this.moduleService.watcherService.getConstructor(key) as unknown
      )
      .forEach((map: CurrentConstructorInteraface) =>
        Array.from(map.type._descriptors.keys())
          .map(k => map.type._descriptors.get(k))
          .map(d => d.value)
          .forEach(v => descriptors.push({ descriptor: v, self: map.value }))
      );
    return descriptors;
  }
}
