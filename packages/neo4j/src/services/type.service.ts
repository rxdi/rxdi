import { Injectable } from '@rxdi/core';
import { GraphQLObjectType } from 'graphql';
import { NEO4J_MODULE_CONFIG } from '../injection.tokens';
import { exclude, mapToString } from '../helpers';

@Injectable()
export class TypeService {
  private defaultExcludedTypes = ['Subscription', 'StatusQueryType'];
  private _registeredTypesMap: Map<string, GraphQLObjectType> = new Map();
  private _registeredTypes: GraphQLObjectType[] = [];

  get types() {
    return this._registeredTypes;
  }

  getType(type: GraphQLObjectType) {
    return this._registeredTypesMap.get(type.name);
  }

  private addType(type: GraphQLObjectType) {
    this._registeredTypesMap.set(type.name, type);
    this._registeredTypes.push(type);
  }

  addTypes(types: GraphQLObjectType[] = []) {
    types.forEach(type => this.addType(type));
    return this._registeredTypes;
  }

  extendExcludedTypes(c: NEO4J_MODULE_CONFIG) {
    c.excludedTypes = c.excludedTypes || {};
    c.excludedTypes.query = c.excludedTypes.query || { exclude: [] };
    c.excludedTypes.mutation = c.excludedTypes.mutation || { exclude: [] };
    c.excludedTypes = {
      ...exclude(c, 'mutation', this.defaultExcludedTypes),
      ...exclude(c, 'query', this.defaultExcludedTypes)
    };
    c.excludedTypes.mutation.exclude = mapToString(
      c.excludedTypes.mutation.exclude
    );
    c.excludedTypes.mutation.exclude = mapToString(
      c.excludedTypes.mutation.exclude
    );
    return c;
  }
}
