import { PubSubService } from '@rxdi/graphql-pubsub';
import { IHamburgerStatisticsType } from '../../introspection';
export declare class HamburgerControllerEffect {
    private pubsub;
    constructor(pubsub: PubSubService);
    clickHamburgerButtonAction(result: IHamburgerStatisticsType): void;
}
