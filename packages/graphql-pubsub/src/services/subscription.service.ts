import {
  Plugin,
  Inject,
  Service,
  PluginInterface,
  Container
} from '@rxdi/core';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { subscribe } from 'graphql/subscription';
import { execute } from 'graphql/execution';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from 'hapi';
import { GRAPHQL_PLUGIN_CONFIG } from '@rxdi/graphql';
import {
  GRAPHQL_PUB_SUB_CONFIG,
  GRAPHQL_PUB_SUB_DI_CONFIG,
  PubSubOptions
} from '../config.tokens';

@Service()
export class SubscriptionService implements PluginInterface {
  public wsServer: SubscriptionServer;
  constructor(
    @Inject(HAPI_SERVER) private server: Server,
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
    @Inject(GRAPHQL_PUB_SUB_CONFIG) private pubConfig: GRAPHQL_PUB_SUB_DI_CONFIG
  ) { }

  OnInit() {
    console.log('Subscription');
    this.register();
  }

  async register() {
    const currentC: any = {
      execute,
      subscribe,
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
      }
    };
    if (this.pubConfig.authentication) {
      const auth: PubSubOptions = Container.get(this.pubConfig.authentication);
      Object.assign(currentC, auth);
      if (auth.onSubConnection) {
        currentC.onConnect = auth.onSubConnection.bind(auth);
      }
      if (auth.onSubOperation) {
        currentC.onOperation = auth.onSubOperation.bind(auth);
      }
      if (auth.onSubOperationComplete) {
        currentC.onOperationComplete = auth.onSubOperationComplete.bind(auth);
      }
      if (auth.onSubDisconnect) {
        currentC.onDisconnect = auth.onSubDisconnect.bind(auth);
      }
    }
    this.wsServer = new SubscriptionServer(currentC, {
      server: this.server.listener,
      path: '/subscriptions',
      ...this.pubConfig.subscriptionServerOptions,
    });

  }
}
