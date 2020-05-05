import { LitElement } from '@rxdi/lit-html';
import { IRoute } from 'router-slot';
import 'router-slot';
/**
 * @customElement router-slots
 */
export declare class RouterSlots extends LitElement {
    slots: IRoute[];
    private routerSlot;
    OnUpdate(): void;
}
