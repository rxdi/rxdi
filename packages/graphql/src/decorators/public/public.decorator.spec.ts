import { Query, Public } from '../index';
import { Controller, Container } from '@rxdi/core';

describe('Decorators: @Public', () => {
  it('Should get raw object value ', done => {
    @Controller()
    class TestController {
      @Public()
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): { public: string } } = <any>(
      Container.get(TestController)
    );
    expect(query.findUser().public).toBeTruthy();
    done();
  });
});
