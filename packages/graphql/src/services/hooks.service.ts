import { errorUnauthorized } from './error.service';
import { Service, Inject, Container, BootstrapLogger } from '@rxdi/core';
import { GRAPHQL_PLUGIN_CONFIG, RESOLVER_HOOK } from '../config.tokens';
import { BootstrapService } from './bootstrap.service';
import {
  GraphQLObjectType,
  GraphQLField,
  GraphQLResolveInfo,
  GraphQLFieldConfig
} from 'graphql';
import { GenericGapiResolversType } from '../decorators/query/query.decorator';
import { EffectService } from './effect.service';
import { CanActivateResolver } from '../decorators/guard/guard.interface';
import { Observable, of, from } from 'rxjs';
import { InterceptResolver } from '../decorators/intercept/intercept.interface';
import { ensureDirSync, writeFileSync } from 'fs-extra';

@Service()
export class HookService {
  @Inject(() => BootstrapService) private bootstrap: BootstrapService;
  methodBasedEffects = [];

  constructor(
    @Inject(GRAPHQL_PLUGIN_CONFIG) private config: GRAPHQL_PLUGIN_CONFIG,
    private effectService: EffectService,
    private logger: BootstrapLogger
  ) {}

  AttachHooks(graphQLFields: GraphQLObjectType[]) {
    graphQLFields.forEach(type => {
      if (!type) {
        return;
      }
      const resolvers = type.getFields();
      Object.keys(resolvers).forEach(resolver =>
        this.applyMeta(resolvers[resolver])
      );
    });
    this.writeEffectTypes();
  }

  writeEffectTypes(effects?: Array<string>): void {
    if (!this.config.writeEffects) {
      return;
    }
    const types = `
/* tslint:disable */
function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
export const EffectTypes = strEnum(${JSON.stringify(
      effects || this.methodBasedEffects
    )
      .replace(/'/g, `'`)
      .replace(/,/g, ',\n')});
export type EffectTypes = keyof typeof EffectTypes;
`;
    try {
      const folder =
        process.env.INTROSPECTION_FOLDER || `./src/app/core/api-introspection/`;
      ensureDirSync(folder);
      writeFileSync(folder + 'EffectTypes.ts', types, 'utf8');
    } catch (e) {
      console.error(e, 'Effects are not saved to directory');
    }
  }

  applyMeta(resolver: GraphQLField<any, any>) {
    const rxdiResolver = this.bootstrap.getResolverByName(resolver.name);
    if (rxdiResolver) {
      resolver.resolve = rxdiResolver.resolve;
      resolver.subscribe = rxdiResolver.subscribe;
      resolver['target'] = rxdiResolver['target'];
      resolver['method_name'] = rxdiResolver['method_name'];
      resolver['method_type'] = rxdiResolver['method_type'];
      resolver['interceptor'] = rxdiResolver['interceptor'];
      resolver['effect'] = rxdiResolver['effect'];
      resolver['guards'] = rxdiResolver['guards'];
      resolver['scope'] = rxdiResolver['scope'] || [
        process.env.APP_DEFAULT_SCOPE || 'ADMIN'
      ];
      this.applyTypeFields(resolver, rxdiResolver);
      this.applyMetaToResolver(<any>resolver);
      this.AddHooks(resolver);
    }
  }

  applyTypeFields<T, K>(
    resolver: GraphQLField<T, K>,
    rxdiResolver: GraphQLFieldConfig<T, K>
  ) {
    if (rxdiResolver['type']['getFields']) {
      const typeFields = rxdiResolver['type']['getFields']();
      const typeRes = resolver['type']['getFields']();
      Object.keys(typeFields).forEach(f => {
        if (typeFields[f].resolve) {
          typeRes[f].resolve = typeFields[f].resolve;
        }
      });
    }
  }

  async applyGuards(desc: GenericGapiResolversType, a) {
    const args = a;
    await Promise.all(
      desc.guards.map(async guard => {
        const currentGuard = Container.get<CanActivateResolver>(guard);
        await this.validateGuard(
          currentGuard.canActivate.bind(currentGuard)(args[2], args[1], desc)
        );
      })
    );
  }

  async validateGuard(res: Function) {
    if (res.constructor === Boolean) {
      if (!res) {
        this.logger.error(`Guard activated!`);
        throw new Error('unauthorized');
      }
    } else if (res.constructor === Promise) {
      await this.validateGuard(await res);
    } else if (res.constructor === Observable) {
      await this.validateGuard(await res['toPromise']());
    }
  }

  applyMetaToResolver(resolver: GenericGapiResolversType) {
    const events = this.effectService;
    const self = this;
    const effectName = resolver.effect ? resolver.effect : resolver.method_name;
    this.methodBasedEffects.push(effectName);
    const originalResolve = resolver.resolve.bind(resolver.target);

    if (resolver.subscribe) {
      const originalSubscribe = resolver.subscribe;
      resolver.subscribe = function subscribe(...args: any[]) {
        return originalSubscribe.bind(resolver.target)(
          resolver.target,
          ...args
        );
      };
    }
    resolver.resolve = async function resolve(...args: any[]) {
      let result: any;
      try {
        if (
          !resolver.public &&
          resolver.guards &&
          resolver.guards.length &&
          !self.config.disableGlobalGuards
        ) {
          await self.applyGuards(resolver, args);
        }
        let val = originalResolve.apply(resolver.target, args);
        if (!val && !process.env.STRICT_RETURN_TYPE) {
          val = {};
        }
        if (!val && process.env.STRICT_RETURN_TYPE) {
          throw new Error(
            `Return type of graph: ${
              resolver.method_name
            } is undefined or null \n To remove strict return type check remove environment variable STRICT_RETURN_TYPE=true`
          );
        }

        if (
          val.constructor === Object ||
          val.constructor === Array ||
          val.constructor === String ||
          val.constructor === Number
        ) {
          val = of(val);
        }

        let observable = from(val);
        if (resolver.interceptor) {
          observable = await Container.get<InterceptResolver>(
            resolver.interceptor
          ).intercept(observable, args[2], args[1], resolver);
        }

        if (observable.constructor === Object) {
          result = observable;
        } else {
          result = await observable.toPromise();
        }
        if (
          events.map.has(resolver.method_name) ||
          events.map.has(resolver.effect)
        ) {
          events.getLayer<Array<any>>(effectName).putItem({
            key: effectName,
            data: [result, ...args].filter(i => i && i !== 'undefined')
          });
        }
      } catch (error) {
        result = error;
        console.error({
          method_type: resolver.method_type,
          method_name: resolver.method_name,
          hasInterceptor: !!resolver.interceptor,
          args,
          error
        });
      }

      return result;
    };
  }

  canAccess<K extends { user: { type: string } }>(
    resolverScope: string[],
    context: K
  ) {
    return context &&
      context.user &&
      resolverScope.filter(scope => scope === context.user.type).length
      ? true
      : errorUnauthorized();
  }

  AuthenticationHooks<T, K>(resolver: GraphQLField<T, K>, context: K) {
    this.canAccess<any>(resolver['scope'], context);
  }

  ResolverHooks<T, K>(
    resolver: GraphQLField<T, K>,
    root: T,
    args: { [key: string]: any },
    context: K,
    info: GraphQLResolveInfo
  ) {
    if (!resolver['public']) {
      this.AuthenticationHooks(resolver, context);
    }
  }

  AddHooks<T, K>(resolver: GraphQLField<T, K>) {
    const resolve = resolver.resolve;
    const self = this;
    if (this.config.authentication) {
      console.log(
        'Should be depreceted in the next minor release consider using RESOLVER_HOOK token'
      );
      resolver.resolve = function(root, args, context, info, ...a) {
        self.ResolverHooks(resolver, root, args, context, info);
        return resolve(root, args, context, info, ...a);
      };
    } else {
      let resolverHook: (resolver: GraphQLField<any, any>) => void;
      try {
        resolverHook = Container.get(RESOLVER_HOOK);
      } catch (e) {}
      if (resolverHook) {
        resolverHook(resolver);
      }
    }
  }
}
