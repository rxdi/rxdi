import { Type, GapiObjectType, Query } from '../index';
import { GraphQLInt, GraphQLScalarType } from 'graphql';
import { Controller, Container } from '@rxdi/core';

@GapiObjectType()
export class UserType {
  id: number | GraphQLScalarType = GraphQLInt;
}

describe('Decorators: @Type', () => {
  it('Should set resoler type to UserType ', done => {
    @Controller()
    class TestController {
      @Type(UserType)
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): { type: { name: string } } } = <any>(
      Container.get(TestController)
    );
    expect(query.findUser().type.name).toBe('UserType');
    done();
  });
});
