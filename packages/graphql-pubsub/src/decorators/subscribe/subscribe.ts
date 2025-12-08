import { ResolverFn, FilterFn } from 'graphql-subscriptions';


/**
 * @Subscribe annotation
 * @param asyncIteratorFunction accepts ResolverFn or AsyncIterator<T>
 * 
 * Can be imported from "graphql-subscriptions" package as function "withFilter"
 *
 ```typescript 

import { PubSubService } from '@rxdi/graphql-pubsub';
import { withFilter } from 'graphql-subscriptions'

@Controller<GraphQLControllerOptions>()
export class ChatController {
  constructor(
    private pubsub: PubSubService,
  ) {}

  @Subscribe(
    withFilter(
      (self: ChatController) => self.pubsub.asyncIterator('MySubscriptionChannel'),
      async (
        message: IChatMessage,
        {id}: {id: string},
        context: GraphqlContext,
      ) => {
        // If you want to notify subscribed clients return true
        // usefull when you want to check if this user has rights to access this pubsub queue
        // Check something with payload arguments provided as id 
        // This id can be defined in @Subscription({ id: { type:... }})
        return true 
      }
    )
  )
  @Subscription({
    id: {
      type: new GraphQLNonNull(GraphQLString)
    } 
  })
  async mySubscription(payload: any) {
    return message;
  }

  publisher() {
    this.pubsub.publish('MySubscriptionChannel', { id: 'my-id' });
  }
}
```
 */
export function Subscribe<T>(asyncIteratorFunction: ResolverFn | AsyncIterator<T>): Function {
    const subscribe = {subscribe: asyncIteratorFunction};
    return (t: any, propKey: string, desc: TypedPropertyDescriptor<any>) => {
        const descriptor = desc;
        const originalMethod = descriptor.value;
        const propertyKey = propKey;
        const self = t;
        descriptor.value = function (...args: any[]) {
            const returnValue = originalMethod.apply(args);
            Object.assign(returnValue, subscribe);
            return returnValue;
        };
        self.constructor._descriptors = self.constructor._descriptors || new Map();
        self.constructor._descriptors.set(propertyKey, descriptor);
        return descriptor;
    };
  }