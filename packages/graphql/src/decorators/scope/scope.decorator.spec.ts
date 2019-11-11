import { Scope, Query } from '../index';
import { Container, Controller } from '@rxdi/core';

describe('Decorators: @Scope', () => {
  it('Should decorate findUser to have scope ADMIN type', done => {
    @Controller()
    class TestController {
      @Scope('ADMIN')
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): { scope: string } } = <any>(
      Container.get(TestController)
    );
    expect(query.findUser().scope[0]).toBe('ADMIN');
    done();
  });
});
