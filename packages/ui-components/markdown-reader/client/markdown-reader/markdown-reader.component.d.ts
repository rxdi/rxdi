import { OnUpdate, LitElement } from '@rxdi/lit-html';
/**
 * @customElement markdown-reader
 */
export declare class MarkdownReaderComponent extends LitElement implements OnUpdate {
    private html;
    disableTocComponent: boolean;
    link: string;
    namespace: string;
    repo: string;
    filePath: string;
    markdownReaderJSON: string;
    private mdParser;
    private mdParserMenu;
    private responsive;
    private tags;
    private widthHeight;
    OnInit(): void;
    OnUpdate(): Promise<void>;
    private getRouteParams;
    fetch(namespace?: string, repo?: string, filePath?: string): Promise<void>;
}
