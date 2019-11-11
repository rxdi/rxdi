import './prism';
export declare class MarkdownParserService {
    private renderer;
    private cache;
    constructor();
    highlightElements(tags: NodeListOf<HTMLElement>[]): any;
    flushCache(): void;
    readAndCompile(text: string): string;
    fetchMarkdown(link: string): Promise<string>;
    fetchDefinitions(link: string): Promise<string>;
    private crypto;
    private escapeBrackets;
    private appendEmptyLine;
    private replaceFilename;
    private parseSwitcher;
    private insertText;
    private initParser;
}
