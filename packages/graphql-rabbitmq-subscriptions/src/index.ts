export { AmqpPubSub } from './amqp-pubsub';
import { FilterFn, ResolverFn, withFilter as withFilterOriginal } from 'graphql-subscriptions';

export function withFilter<T>(
 this: T,
 asyncIteratorFn: ResolverFn<any, any, any>,
 filterFn: FilterFn<any, any, any>,
) {
 return withFilterOriginal(asyncIteratorFn, filterFn);
}
