import 'jest';
import { Container, Injectable, Controller, createTestBed } from '@rxdi/core';
import { startServer, sendRequest } from '../../test/helpers/core-module';
import { HAPI_SERVER } from '@rxdi/hapi';
import { Server } from 'hapi';
import {
  GraphQLNonNull,
  DirectiveLocation,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import {
  GraphQLCustomDirective,
  GraphQLCustomDirectiveInterface
} from './custom-directive';
import { switchMapTo } from 'rxjs/operators';
import { Type, Query } from '../../decorators';

@Injectable()
class AddTextDirective implements GraphQLCustomDirectiveInterface {
  name = 'addText';
  description = 'change the case of a string to uppercase';
  locations = [DirectiveLocation.FIELD];
  args = {
    inside: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the times to duplicate the string'
    },
    outside: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'the times to duplicate the string'
    }
  };
  resolve = async (
    resolve: () => Promise<string>,
    root,
    args: { inside: string; outside: string }
  ) => args.inside + (await resolve()).toUpperCase() + args.outside;
}

const ToUpperCaseDirective = new GraphQLCustomDirective<string>({
  name: 'toUpperCase',
  description: 'change the case of a string to uppercase',
  locations: [DirectiveLocation.FIELD],
  resolve: async resolve => (await resolve()).toUpperCase()
});

const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    name: {
      type: GraphQLString
    }
  })
});

@Controller()
class UserQueriesController {
  @Type(UserType)
  @Query({
    name: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
  findUser(root, { name }, context) {
    return { name: name };
  }
}

describe('Custom Graphql Directives aka Schema Decorators', () => {
  let server: Server;
  beforeAll(async () => {
    await createTestBed({ controllers: [UserQueriesController] })
      .pipe(
        switchMapTo(
          startServer({
            graphql: {
              directives: [ToUpperCaseDirective, AddTextDirective],
              buildAstDefinitions: false // Removed ast definition since directives are lost
            }
          })
        )
      )
      .toPromise();

    server = Container.get<Server>(HAPI_SERVER);
  });

  afterAll(async () => await server.stop());

  it('Should decorete name return property to become UPPERCASE', async done => {
    const res = await sendRequest<{ findUser: { name: number } }>({
      query: `query findUser($name: String!) { findUser(name: $name) { name @toUpperCase } }`,
      variables: { name: 'imetomi' }
    });
    expect(res.data.findUser.name).toBe('IMETOMI');
    done();
  });

  it('Should decorete name return property to have text outside', async done => {
    const res = await sendRequest<{ findUser: { name: number } }>({
      query: `query findUser($name: String!) { findUser(name: $name) { name @addText(inside: "", outside: "test") } }`,
      variables: { name: 'imetomi' }
    });
    console.log(res.data.findUser.name);
    expect(res.data.findUser.name).toBe('IMETOMItest');
    done();
  });

  it('Should decorete name return property to have text inside', async done => {
    const res = await sendRequest<{ findUser: { name: number } }>({
      query: `query findUser($name: String!) { findUser(name: $name) { name @addText(inside: "test", outside: "") } }`,
      variables: { name: 'imetomi' }
    });
    expect(res.data.findUser.name).toBe('testIMETOMI');
    done();
  });

  afterAll(async () => await server.stop());
});
