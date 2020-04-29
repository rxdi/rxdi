import { Query, CanActivateResolver, ResolverContext } from '../index';
import { Container, Controller, Service } from '@rxdi/core';
import { Guard } from './guard.decorator';
import { Observable } from 'rxjs';

@Service()
export class AuthGuard implements CanActivateResolver {
  canActivate(
    context: boolean,
    payload,
    descriptor
  ): boolean | Promise<boolean> | Observable<boolean> {
    return context;
  }
}

describe('Decorators: @Guard', () => {
  it('Should decorate findUser to have guard', done => {
    @Controller()
    class TestController {
      @Guard(AuthGuard)
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): { guards: Function[] } } = <any>(
      Container.get(TestController)
    );
    const currentGuard = Container.get<CanActivateResolver>(
      query.findUser().guards[0]
    );
    expect(query.findUser().guards[0]['metadata']['moduleHash']).toBe(
      AuthGuard['metadata']['moduleHash']
    );
    expect(currentGuard.canActivate).toBeDefined();
    expect(currentGuard.canActivate(false)).toBeFalsy();
    done();
  });
});

describe('Decorators: @Guard', () => {
  it('Should decorate findUser to have guard and to check if conditions', done => {
    @Service()
    class AuthGuard implements CanActivateResolver {
      canActivate(
        context: boolean,
        payload,
        descriptor
      ): boolean | Promise<boolean> | Observable<boolean> {
        if (payload === 'test') {
          return true;
        }
      }
    }
    @Controller()
    class TestController {
      @Guard(AuthGuard)
      @Query()
      findUser() {
        return 1;
      }
    }
    const controller: { findUser(): { guards: Function[] } } = <any>(
      Container.get(TestController)
    );
    const currentGuard = Container.get<CanActivateResolver>(
      controller.findUser().guards[0]
    );
    const descriptor = controller.findUser();
    expect(controller.findUser().guards[0]['metadata']['moduleHash']).toBe(
      AuthGuard['metadata']['moduleHash']
    );
    expect(currentGuard.canActivate).toBeDefined();
    expect(currentGuard.canActivate(null, 'test')).toBeTruthy();
    expect(currentGuard.canActivate(null, 'no-test')).toBeFalsy();
    done();
  });
});
