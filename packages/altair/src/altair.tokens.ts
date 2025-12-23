import { InjectionToken } from '@rxdi/core';
import { RenderOptions } from 'altair-static';

export const AltairConfig = new InjectionToken('altair-module-config');

export type AltairConfig = RenderOptions;

export const DefaultAltairConfig = {
 baseURL: 'http://localhost:9000/altair/',
 endpointURL: 'http://localhost:9000/graphql',
 subscriptionsEndpoint: 'http://localhost:9000/subscriptions',
 initialQuery: `{ status { status } }`,
};
