import { Container } from '@rxdi/core';
import { PubSubService } from '../../services/pub-sub.service';
import { IQueueNameConfig } from '@rxdi/rabbitmq-pubsub';


export const AMQPSubscribe =
  <T = any>({
    queue,
    config,
  }: {
    queue: string;
    config: Partial<IQueueNameConfig>;
  }) =>
  (target: T, memberName: string) => {
    const OnInit =
      (target as any).OnInit ||
      function () {
        /*  */
      };
    Object.defineProperty(target, 'OnInit', {
      value: async function (...args: unknown[]) {
        const amqpService = Container.get(PubSubService);

        await amqpService.sub.subscribe(
          queue,
          (msg) => (target as any)[memberName].call(this, msg),
          config,
        );
        return OnInit.apply(this, args);
      },
      configurable: true,
      writable: true,
    });
  };
