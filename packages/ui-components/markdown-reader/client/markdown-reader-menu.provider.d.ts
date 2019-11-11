import { BehaviorSubject } from 'rxjs';
import { TocInterface } from './toc/toc.interface';
export declare class MarkdownParserMenuProvider {
    menu: BehaviorSubject<TocInterface[]>;
    activeId: number;
    private readonly scrollTopOffset;
    setItems(items: TocInterface[]): void;
    clearMenu(): void;
    addItem(item: TocInterface): void;
    lookupHeadings(contentReference: ShadowRoot): void;
    findCurrentHeading(headings: any): number;
    navigateToAnchor(elementRef: HTMLElement): void;
}
