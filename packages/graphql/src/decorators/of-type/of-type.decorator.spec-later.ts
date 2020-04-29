import { Service, Container } from '@rxdi/core';
import { OfType } from './of-type.decorator';
import { GapiObjectType } from '../object-type';
import { GraphQLScalarType, GraphQLInt } from 'graphql';

function strEnum<T extends string>(o: Array<T>): { [K in T]: K } {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

const GapiEffects = strEnum(['findUser']);

type GapiEffects = keyof typeof GapiEffects;

@Service()
class UserEffectsService {
  @OfType<GapiEffects>(GapiEffects.findUser)
  findUser(args, context, info) {
    console.log(args, context);
  }
}

@GapiObjectType()
class UserType {
  readonly id: number | GraphQLScalarType = GraphQLInt;
  name: string;
}

class TestingMutation {
  resolve: <T>(root, payload, context) => T;
  args: { [key: string]: { type: any } };
  method_type: string;
  method_name: string;
  type: UserType;
  scope: Array<string>;
}

Container.get(UserEffectsService);

describe('Decorators: @OfType', () => {
  it('Should emit effect based on resolved resolver', done => {
    // const mutation: TestingMutation = <any>Container.get(ClassTestProvider).mutation(null, {id: null}, null);

    done();
  });
});
