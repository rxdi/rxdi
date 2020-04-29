import { Query } from '../index';
import { Controller, Container } from '@rxdi/core';
import { EffectName } from './effect-name.decorator';

describe('Decorators: @EffectName', () => {
  it('Should get raw object value ', done => {
    @Controller()
    class TestController {
      @EffectName('pesho')
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): { effect: string } } = <any>(
      Container.get(TestController)
    );
    expect(query.findUser().effect).toBeTruthy();
    done();
  });
});
