import { LitElement } from '@rxdi/lit-html';
/**
 * @customElement toc-component
 */
export declare class TocComponent extends LitElement {
    opened: boolean;
    private menuProvider;
    private menus;
    private clickAnchor;
    private createMenusTemplate;
    private createSingleItem;
}
