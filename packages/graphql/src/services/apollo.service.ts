import { Service, Inject, PluginInterface, Container } from '@rxdi/core';
import * as Boom from 'boom';
import { Server, Request, ResponseToolkit } from 'hapi';
import {
  runHttpQuery,
  convertNodeHttpToRequest,
  GraphQLOptions
} from 'apollo-server-core';
import { HAPI_SERVER } from '@rxdi/hapi';
import {
  GRAPHQL_PLUGIN_CONFIG,
  SCHEMA_OVERRIDE,
  CUSTOM_SCHEMA_DEFINITION,
  ON_REQUEST_HANDLER
} from '../config.tokens';
import { BootstrapService } from '../services/bootstrap.service';
import { GraphQLSchema } from 'graphql';
import { HookService } from './hooks.service';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Service()
export class ApolloService implements PluginInterface {
  isInitQuery: boolean;
  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
    private bootstrapService: BootstrapService,
    private hookService: HookService
  ) {}

  OnInit() {
    this.init();
    this.register();
  }

  init() {
    let schemaOverride: (schema: GraphQLSchema) => GraphQLSchema;
    try {
      schemaOverride = Container.get(SCHEMA_OVERRIDE);
    } catch (e) {}

    if (schemaOverride) {
      this.config.graphqlOptions.schema = schemaOverride(
        this.bootstrapService.generateSchema(true)
      );
    } else {
      let customSchemaDefinition: GraphQLSchema;
      try {
        customSchemaDefinition = Container.get(CUSTOM_SCHEMA_DEFINITION);
      } catch (e) {}
      this.config.graphqlOptions.schema =
        customSchemaDefinition ||
        this.config.graphqlOptions.schema ||
        this.bootstrapService.generateSchema();
    }

  }

  async register() {
    if (!this.config || !this.config.graphqlOptions) {
      throw new Error('Apollo Server requires options.');
    }
    this.config.graphqlOptions.schema = await this.config.graphqlOptions.schema;
    this.hookService.AttachHooks([
      this.config.graphqlOptions.schema.getQueryType(),
      this.config.graphqlOptions.schema.getMutationType(),
      this.config.graphqlOptions.schema.getSubscriptionType()
    ]);
    this.server.route(<any>{
      method: ['GET', 'POST'],
      path: this.config.path || '/graphql',
      vhost: this.config.vhost,
      config: this.config.route || {},
      handler: this.handler
    });
  }

  defaultOrNew = async (
    request: Request,
    response: ResponseToolkit,
    error: Error
  ) => {
    let onRequest: (
      next: (context?: {}) => Promise<any>,
      request?: Request,
      h?: ResponseToolkit,
      err?: Error
    ) => Promise<any>;
    try {
      onRequest = <any>Container.get(ON_REQUEST_HANDLER);
    } catch (e) {}
    if (onRequest) {
      return await onRequest(
        context => this.makeGQLRequest(request, response, error, context),
        request,
        response,
        error
      );
    }
    this.config.graphqlOptions.context =
      this.config.graphqlOptions.context || {};
    if (
      request.headers.authorization &&
      request.headers.authorization !== 'undefined' &&
      this.config.authentication
    ) {
      try {
        const serviceUtilsService: any = Container.get(<any>(
          this.config.authentication
        ));
        this.config.graphqlOptions.context.user = await serviceUtilsService.validateToken(
          request.headers.authorization
        );
      } catch (e) {
        return Boom.unauthorized();
      }
    } else {
      this.config.graphqlOptions.context.user = null;
    }
    return this.makeGQLRequest(
      request,
      response,
      error,
      this.config.graphqlOptions.context
    );
  };

  async makeGQLRequest(
    request: Request,
    h: ResponseToolkit,
    err?: Error,
    context?: {}
  ) {
    if (request.payload && request.payload.toString().includes('initQuery')) {
      this.isInitQuery = true;
    } else {
      this.isInitQuery = false;
    }
    this.config.graphqlOptions.context = {
      ...this.config.graphqlOptions.context,
      ...context
    };
    const { graphqlResponse, responseInit } = await runHttpQuery([request, h], {
      method: request.method.toUpperCase(),
      options: this.config.graphqlOptions,
      query:
        request.method === 'post'
          ? // TODO type payload as string or Record
            (request.payload as any)
          : request.query,
      request: convertNodeHttpToRequest(request.raw.req)
    });

    const response = h.response(graphqlResponse);
    response.type('application/json');
    return response;
  }
  handler = async (request: Request, h: ResponseToolkit, err?: Error) => {
    try {
      return await this.defaultOrNew(request, h, err);
    } catch (error) {
      if (this.isInitQuery) {
        throw new Error(error);
      }
      if (error) {
        console.error(error);
      }
      if ('HttpQueryError' !== error.name) {
        throw Boom.boomify(error);
      }
      if (
        error &&
        error.message.constructor === String &&
        error.message.includes('must be Output Type but got')
      ) {
        console.log(
          'Maybe you are trying to cross reference Schema Type? Instead of fields: {test: {type: GraphQLString }} try lazy evaluated fields: () => ({test: {type: GraphQLString }})'
        );
        console.error(error);
      }
      if (true === error.isGraphQLError) {
        const response = h.response(error.message);
        response.code(error.statusCode);
        response.type('application/json');
        return response;
      }

      const err = new Boom(error.message, { statusCode: error.statusCode });
      if (error.headers) {
        Object.keys(error.headers).forEach(
          header => (err.output.headers[header] = error.headers[header])
        );
      }
      // Boom hides the error when status code is 500
      err.output.payload.message = error.message;
      throw err;
    }
  };
}
