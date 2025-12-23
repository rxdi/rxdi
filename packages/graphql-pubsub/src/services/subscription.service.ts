import { Inject, Service, PluginInterface, Container } from '@rxdi/core';
import { ServerOptions, SubscriptionServer } from 'subscriptions-transport-ws';
import { subscribe } from 'graphql/subscription';
import { execute } from 'graphql/execution';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from '@hapi/hapi';
import { GRAPHQL_PLUGIN_CONFIG } from '@rxdi/graphql';
import {
 GRAPHQL_PUB_SUB_CONFIG,
 GRAPHQL_PUB_SUB_DI_CONFIG,
 PubSubOptions,
} from '../config.tokens';
import { DocumentNode, GraphQLFieldResolver, GraphQLSchema } from 'graphql';

@Service()
export class SubscriptionService implements PluginInterface {
 constructor(
  @Inject(HAPI_SERVER) private server: Server,
  @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
  @Inject(GRAPHQL_PUB_SUB_CONFIG) private pubConfig: GRAPHQL_PUB_SUB_DI_CONFIG,
 ) {}

 OnInit() {
  this.register();
 }

 async register() {
  const config: ServerOptions = {
   execute: this.execute.bind(this),
   subscribe: this.subscribe.bind(this),
   schema: this.config.graphqlOptions.schema,
   onConnect(connectionParams) {
    // return connectionHookService.modifyHooks
    //   .onSubConnection(connectionParams);
    return connectionParams;
   },
   onOperation: (connectionParams, params, webSocket) => {
    return params;
    // return connectionHookService.modifyHooks
    //   .onSubOperation(
    //     connectionParams,
    //     params,
    //     webSocket
    //   );
   },
  };
  if (this.pubConfig.authentication) {
   const auth: PubSubOptions = Container.get(this.pubConfig.authentication);
   Object.assign(config, auth);
   if (auth.onSubConnection) {
    config.onConnect = auth.onSubConnection.bind(auth);
   }
   if (auth.onSubOperation) {
    config.onOperation = auth.onSubOperation.bind(auth);
   }
   if (auth.onSubOperationComplete) {
    config.onOperationComplete = auth.onSubOperationComplete.bind(auth);
   }
   if (auth.onSubDisconnect) {
    config.onDisconnect = auth.onSubDisconnect.bind(auth);
   }
  }
  new SubscriptionServer(config, {
   server: this.server.listener,
   path: '/subscriptions',
   ...this.pubConfig.subscriptionServerOptions,
  });
 }

 /**
  * Cross compatability graphql v15 and v16 for subscriptions
  */
 private execute(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {
   [key: string]: any;
  },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>,
 ) {
  return execute({
   schema,
   document,
   rootValue,
   contextValue,
   variableValues,
   operationName,
   fieldResolver,
   subscribeFieldResolver,
  });
 }

 /**
  * Cross compatability graphql v15 and v16 for subscriptions
  */
 private subscribe(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {
   [key: string]: any;
  },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  subscribeFieldResolver?: GraphQLFieldResolver<any, any>,
 ) {
  return subscribe({
   schema,
   document,
   rootValue,
   contextValue,
   variableValues,
   operationName,
   fieldResolver,
   subscribeFieldResolver,
  });
 }
}
