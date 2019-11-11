import { HamburgerTypes } from './hamburger.type';
import { BaseComponent } from './base.component';
import { Observable } from 'rxjs';
import { IHamburgerStatisticsType } from '../../introspection';
/**
 * @customElement hamburger-component
 */
export declare class HamburgerComponent extends BaseComponent {
    active: boolean;
    type: HamburgerTypes;
    enableBackendStatistics?: boolean;
    private clickHamburgerButton;
    sendClickStatistics(): Observable<IHamburgerStatisticsType>;
}
