import { ModuleService, Service, Inject, Container, ControllersService } from '@rxdi/core';
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLList,
  printSchema,
  GraphQLFieldConfigMap,
  buildSchema,
  GraphQLString,
  GraphQLScalarType,
  validateSchema
} from 'graphql';
import { GRAPHQL_PLUGIN_CONFIG } from '../config.tokens';
import { GenericGapiResolversType } from '../decorators/query/query.decorator';
import { GraphQLControllerOptions } from '../decorators/guard/guard.interface';
import {
  applySchemaCustomDirectives,
  GraphQLCustomDirective
} from '../helpers/directives/custom-directive';
import { ServiceArgumentsInternal } from '@rxdi/core/src/decorators/module/module.interfaces';

const scalarTypeCache = new Map<string, any>();

function isScalarType(type: any): boolean {
  return type?.constructor?.name === 'GraphQLScalarType';
}

function isListType(type: any): boolean {
  return type?.constructor?.name === 'GraphQLList';
}

function getScalarType(type: any): any {
  const name = type && type.name;
  if (!name) return type;
  if (!scalarTypeCache.has(name)) {
    scalarTypeCache.set(name, type);
  }
  return scalarTypeCache.get(name);
}

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
  ) { }

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
        `Missing type for resolver ${desc.method_name} inside @Controller ${self.constructor['originalName']
        }`
      );
    }
  }

  applyInitStatus() {
    const statusType = getScalarType(GraphQLString);
    return {
      type: new GraphQLObjectType({
        name: 'StatusQueryType',
        fields: () => ({ status: { type: statusType } })
      }),
      method_name: 'status',
      public: true,
      method_type: 'query',
      target: () => { },
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
      if (desc.type && isScalarType(desc.type)) {
        desc.type = getScalarType(desc.type);
      }
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
    this.Fields = { query: {}, mutation: {}, subscription: {} };
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
      d.metadata ? new GraphQLCustomDirective(Container.get(d) as any) : d
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
    const normalizedFields = Object.entries(fields).reduce((acc, [fieldName, field]) => {
      if (isScalarType(field.type)) {
        field.type = getScalarType(field.type);
      } else if (isListType(field.type)) {
        if (isScalarType((field.type as any).ofType)) {
          field.type = new GraphQLList(getScalarType((field.type as any).ofType));
        }
      }
      return { ...acc, [fieldName]: field };
    }, {});
    return new GraphQLObjectType({ name, description, fields: normalizedFields });
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

  private createControllerMetadata(controller: Function): void {
    const existingOriginalName = (controller as any)['originalName'];
    const originalName = existingOriginalName || controller.name || controller.constructor?.name || 'Unknown';
    const uniqueHashForClass = `${controller}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!existingOriginalName) {
      Object.defineProperty(controller, 'originalName', {
        value: originalName,
        writable: true
      });
    }
    Object.defineProperty(controller, 'name', {
      value: uniqueHashForClass,
      writable: true
    });

    if (!controller['metadata']) {
      controller['metadata'] = {};
    }
    controller['metadata'].moduleName = originalName;
    controller['metadata'].moduleHash = uniqueHashForClass;
    controller['metadata'].options = controller['metadata'].options || null;
    controller['metadata'].type = 'controller';
    controller['metadata'].raw = `---- @Controller '${originalName}' metadata (dynamically registered)----`;

    if (!controller['_descriptors']) {
      controller['_descriptors'] = new Map();
    }
  }

  registerControllerDynamic(controller: Function): GraphQLSchema {
    this.createControllerMetadata(controller);
    this.moduleService.watcherService.createConstructor(controller.name, { value: controller });
    const controllersService = Container.get(ControllersService);
    controllersService.register(controller);
    return this.generateSchema();
  }

  registerControllersDynamic(controllers: Function[]): GraphQLSchema {
    for (const controller of controllers) {
      this.createControllerMetadata(controller);
      this.moduleService.watcherService.createConstructor(controller.name, {
        type: controller,
        value: controller
      });
    }
    const controllersService = Container.get(ControllersService);
    for (const controller of controllers) {
      controllersService.register(controller);
    }
    this.mergeControllerFields(controllers);
    return this.generateSchema();
  }

  mergeControllerFields(newControllers: Function[]): void {
    for (const controller of newControllers) {
      const constructorKey = controller.name;
      const constructor = this.moduleService.watcherService.getConstructor(constructorKey);
      if (!constructor) continue;
      const map = constructor as any;
      if (!map.type || !map.type._descriptors) continue;
      Array.from(map.type._descriptors.keys())
        .map(k => map.type._descriptors.get(k))
        .map(d => d.value)
        .forEach((descriptorGetter: () => GenericGapiResolversType) => {
          const desc = descriptorGetter();
          desc.target = () => { };
          this.validateResolver(desc, controller);
          if (desc.type && isScalarType(desc.type)) {
            desc.type = getScalarType(desc.type);
          }
          this.Fields[desc.method_type][desc.method_name] = desc;
        });
    }
  }

  registerServiceDynamic(service: Function): void {
    const originalName = service.name || service.constructor?.name || 'Unknown';
    const uniqueHashForClass = `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    Object.defineProperty(service, 'originalName', {
      value: originalName,
      writable: true
    });
    Object.defineProperty(service, 'name', {
      value: uniqueHashForClass,
      writable: true
    });

    service['metadata'] = {
      moduleName: originalName,
      moduleHash: uniqueHashForClass,
      options: null,
      type: 'service',
      raw: `---- @Service '${originalName}' metadata (dynamically registered)----`
    };

    Container.set({ type: service });
    this.moduleService.watcherService.createConstructor(service.name, { value: service });
  }

  registerServicesDynamic(services: Function[]): void {
    for (const service of services) {
      this.registerServiceDynamic(service);
    }
  }

  registerModuleDynamic(moduleConfig: {
    controllers?: Function[];
    services?: Function[];
    providers?: ServiceArgumentsInternal[];
  }): GraphQLSchema {
    if (moduleConfig.services) {
      this.registerServicesDynamic(moduleConfig.services);
    }
    if (moduleConfig.providers) {
      for (const provider of moduleConfig.providers) {
        if (provider.useClass) {
          this.registerServiceDynamic(provider.useClass);
        }
        if (provider.useFactory) {
          const factoryService = provider.useFactory(...(provider.deps || []));
          if (typeof factoryService === 'function') {
            this.registerServiceDynamic(factoryService);
          }
        }
      }
    }
    if (moduleConfig.controllers) {
      this.registerControllersDynamic(moduleConfig.controllers);
    }
    return this.generateSchema();
  }
}
