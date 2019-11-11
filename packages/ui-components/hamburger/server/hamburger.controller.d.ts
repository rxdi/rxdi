import { PubSubService } from '@rxdi/graphql-pubsub';
import { IHamburgerStatisticsType } from '../../introspection';
export declare class HamburgerController {
    private pubsub;
    private payload;
    constructor(pubsub: PubSubService);
    clickHamburgerButton(): IHamburgerStatisticsType;
    subscribeToStatistics(payload: IHamburgerStatisticsType): IHamburgerStatisticsType;
}
