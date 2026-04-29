import 'jest';

import { Container, Controller, createTestBed } from '@rxdi/core';
import { HAPI_SERVER } from '@rxdi/hapi';
import { GraphQLSchema, GraphQLNonNull, GraphQLInt, GraphQLObjectType } from 'graphql';
import { switchMapTo } from 'rxjs/operators';
import { sendRequest } from '@rxdi/graphql';
import { getGraphqlSchema, startServer, Type, Query } from '@rxdi/graphql';
import { Server } from '@hapi/hapi';

const UserType = new GraphQLObjectType({
 name: 'UserType',
 fields: () => ({
  id: {
   type: GraphQLInt,
   resolve: () => {
    return 2;
   },
  },
 }),
});

@Controller()
class UserQueriesController {
 @Type(UserType)
 @Query({
  id: {
   type: new GraphQLNonNull(GraphQLInt),
  },
 })
 findUser(root, { id }, context) {
  return { id: id };
 }
}

describe('Global Server Tests', () => {
 let schema: GraphQLSchema;

 beforeEach(async () => {
  await createTestBed({ controllers: [UserQueriesController] })
   .pipe(switchMapTo(startServer()))
   .toPromise();
  schema = await getGraphqlSchema().toPromise();
 });

 afterAll(async () => {
  const server = Container.get<Server>(HAPI_SERVER);
  if (server && server['phase'] !== 'stopping' && server['phase'] !== 'stopped') {
   await new Promise((resolve) => setTimeout(resolve, 100));
   await server.stop();
  }
 });

 it('Should create query to test resolvers', async () => {
  const res = await sendRequest<{ findUser: { id: number } }>({
   query: `query findUser($id: Int!) { findUser(id: $id) { id } }`,
   variables: { id: 1 },
  });
  expect(res.data.findUser.id).toBe(2);
 });

 it('Should check for plugin init query', async () => {
  const res = await sendRequest<{ status: { status: string } }>({
   query: `query { status { status } }`,
   variables: { id: 1 },
  });
  expect(res.data.status.status).toBe('200');
 });

 it('Should check if findUser type has id and resolver defined', async () => {
  expect(
   schema.getQueryType().getFields().findUser.type['getFields']().id.resolve,
  ).toBeDefined();
  expect(schema.getQueryType().getFields().findUser).toBeDefined();
 });
});
