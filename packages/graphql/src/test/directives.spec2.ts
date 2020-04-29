import 'jest';

import { Container, Controller, createTestBed } from '@rxdi/core';
import { PluginInit } from '../plugin-init';
import {
  startServer,
  stopServer,
  getGraphqlSchema
} from './helpers/core-module';
import {
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLObjectType
} from 'graphql';
import { switchMapTo } from 'rxjs/operators';
import { Type, Query } from '../decorators';

const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: {
      type: GraphQLInt,
      resolve: () => {
        return 2;
      }
    }
  })
});

@Controller()
class UserQueriesController {
  @Type(UserType)
  @Query({
    id: {
      type: new GraphQLNonNull(GraphQLInt)
    }
  })
  findUser(root, { id }, context) {
    return { id: id };
  }
}

describe('Global Server Tests', () => {
  let pluginInit: PluginInit;
  let schema: GraphQLSchema;

  beforeEach(async () => {
    await createTestBed({ controllers: [UserQueriesController] })
      .pipe(switchMapTo(startServer()))
      .toPromise();
    pluginInit = Container.get(PluginInit);
    schema = await getGraphqlSchema().toPromise();
  });

  afterEach(async () => await stopServer());

  it('Should create query to test resolvers', async done => {
    const res = await pluginInit.sendRequest<{ findUser: { id: number } }>({
      query: `query findUser($id: Int!) { findUser(id: $id) { id } }`,
      variables: { id: 1 }
    });
    expect(res.data.findUser.id).toBe(2);
    done();
  });

  it('Should check for plugin init query', async done => {
    const res = await pluginInit.sendRequest<{ status: { status: string } }>({
      query: `query { status { status } }`,
      variables: { id: 1 }
    });
    expect(res.data.status.status).toBe('200');
    done();
  });

  it('Should check if findUser type has id and resolver defined', async done => {
    expect(
      schema
        .getQueryType()
        .getFields()
        .findUser.type['getFields']().id.resolve
    ).toBeDefined();
    expect(schema.getQueryType().getFields().findUser).toBeDefined();
    done();
  });

  afterAll(async () => await stopServer());
});
