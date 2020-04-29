import {
  Query,
  CanActivateResolver,
  ResolverContext,
  GenericGapiResolversType,
  InterceptResolver
} from '../index';
import { Container, Controller, Service } from '@rxdi/core';
import { Interceptor } from './intercept.decorator';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

describe('Decorators: @Interceptor', () => {
  it('Should decorate findUser to have interceptor', done => {
    @Service()
    class LoggerInterceptor implements InterceptResolver {
      intercept(
        chainable$: Observable<any>,
        payload,
        context,
        descriptor: GenericGapiResolversType
      ) {
        console.log('Before...');
        const now = Date.now();
        return chainable$.pipe(
          tap(() => console.log(`After... ${Date.now() - now}ms`))
        );
      }
    }
    @Controller()
    class TestController {
      @Interceptor(LoggerInterceptor)
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): GenericGapiResolversType } = <any>(
      Container.get(TestController)
    );
    const currentGuard = Container.get<InterceptResolver>(
      query.findUser().interceptor
    );
    expect(query.findUser().interceptor['metadata']['moduleHash']).toBe(
      LoggerInterceptor['metadata']['moduleHash']
    );
    expect(currentGuard.intercept).toBeDefined();
    expect(
      currentGuard.intercept(of(true), {}, {}, query.findUser())
    ).toBeInstanceOf(Observable);
    done();
  });

  it('Should decorate findUser to have interceptor and will correctly pass payload and context arguments', done => {
    @Service()
    class LoggerInterceptor implements InterceptResolver {
      intercept(
        chainable$: Observable<any>,
        payload,
        context,
        descriptor: GenericGapiResolversType
      ) {
        console.log('Before...');
        const now = Date.now();
        return chainable$.pipe(map(res => ({ payload, context })));
      }
    }
    @Controller()
    class TestController {
      @Interceptor(LoggerInterceptor)
      @Query()
      findUser() {
        return 1;
      }
    }
    const query: { findUser(): GenericGapiResolversType } = <any>(
      Container.get(TestController)
    );
    const currentGuard = Container.get<InterceptResolver>(
      query.findUser().interceptor
    );
    expect(query.findUser().interceptor['metadata']['moduleHash']).toBe(
      LoggerInterceptor['metadata']['moduleHash']
    );
    expect(currentGuard.intercept).toBeDefined();
    expect(
      currentGuard.intercept(of(true), {}, {}, query.findUser())
    ).toBeInstanceOf(Observable);
    const observable: any = currentGuard.intercept(
      of(true),
      1,
      2,
      query.findUser()
    );
    observable.subscribe(res => {
      expect(res).toEqual({ payload: 1, context: 2 });
      done();
    });
  });
});
