import { Scope, Type, GapiObjectType, Query } from '../index';
import {
  GraphQLInt,
  GraphQLScalarType,
  GraphQLNonNull,
  GraphQLObjectType
} from 'graphql';
import {
  Container,
  Service,
  Controller,
  Module,
  ModuleWithServices
} from '@rxdi/core';
import { HapiModule, HapiConfigModel } from '@rxdi/hapi';
import { BootstrapService } from '../../services/bootstrap.service';
import { GraphQLModule } from '../../index';
import { GRAPHQL_PLUGIN_CONFIG } from '../../config.tokens';
import { HookService, ApolloService } from '../../services';
import { of } from 'rxjs';

@GapiObjectType()
class UserType {
  readonly id: number | GraphQLScalarType = GraphQLInt;
  name: string;
}

@Service()
class TestInjectable {
  pesho: string = 'pesho';
}

@Controller()
class ClassTestProvider {
  constructor(private injecatble: TestInjectable) {}
  @Scope('ADMIN')
  @Type(UserType)
  @Query({
    id: {
      type: new GraphQLNonNull(GraphQLInt)
    }
  })
  findUser(root, { id }, context) {
    return { id: 1 };
  }
  @Scope('ADMIN')
  @Type(UserType)
  @Query({
    id: {
      type: new GraphQLNonNull(GraphQLInt)
    }
  })
  testInjection() {
    return of(this.injecatble.pesho);
  }
}

class TestingQuery {
  resolve: <T>(root, payload, context) => T;
  args: { [key: string]: { type: any } };
  method_type: string;
  method_name: string;
  target: ClassTestProvider;
  type: UserType;
  scope: Array<string>;
}

interface CoreModuleConfig {
  server?: HapiConfigModel;
  graphql?: GRAPHQL_PLUGIN_CONFIG;
}

const DEFAULT_CONFIG = {
  server: {
    hapi: {
      port: 9000
    }
  },
  graphql: {
    path: '/graphql',
    openBrowser: false,
    writeEffects: false,
    graphiql: false,
    graphiQlPlayground: false,
    graphiQlPath: '/graphiql',
    watcherPort: '',
    graphiqlOptions: {
      endpointURL: '/graphql',
      subscriptionsEndpoint: `${
        process.env.GRAPHIQL_WS_SSH ? 'wss' : 'ws'
      }://${process.env.GRAPHIQL_WS_PATH || 'localhost'}${
        process.env.DEPLOY_PLATFORM === 'heroku'
          ? ''
          : `:${process.env.API_PORT || process.env.PORT || 9000}`
      }/subscriptions`,
      websocketConnectionParams: {
        token: process.env.GRAPHIQL_TOKEN
      }
    },
    graphqlOptions: {
      schema: null
    }
  }
};

@Module({
  imports: [
    HapiModule.forRoot(DEFAULT_CONFIG.server),
    GraphQLModule.forRoot(DEFAULT_CONFIG.graphql)
  ]
})
export class CoreModule {}

beforeAll(done => {
  Container.get(CoreModule);
  done();
});

describe('Decorators: @Query', () => {
  it('Should decorate target descriptor with appropriate values', done => {
    const query: TestingQuery = <any>(
      Container.get(ClassTestProvider).findUser(null, { id: null }, null)
    );
    expect(JSON.stringify(query.args.id.type)).toBe(
      JSON.stringify(new GraphQLNonNull(GraphQLInt))
    );
    expect(query.method_name).toBe('findUser');
    expect(query.method_type).toBe('query');
    expect(query.type.name).toBe('UserType');
    expect(query.scope[0]).toBe('ADMIN');
    const returnResult: { id: number } = query.resolve(null, {}, null);
    expect(returnResult.id).toBe(1);
    done();
  });
  it('Should decorate testInjection to have this from ClassTestProvider', async done => {
    Container.get(ApolloService);
    const queryFields = Container.get(GRAPHQL_PLUGIN_CONFIG)
      .graphqlOptions.schema.getQueryType()
      .getFields();
    const resolver = queryFields.testInjection.resolve.bind(
      queryFields.testInjection['target']
    );
    expect(queryFields.testInjection['method_name']).toBe('testInjection');
    expect(await resolver().toPromise()).toBe('pesho');
    done();
  });
});
