

import { MarkdownReaderComponent } from './markdown-reader';

export * from './markdown.reader.module';
export * from './markdown-reader-menu.provider';
export * from './markdown-reader.service';
export * from './markdown-reader/index';

declare global {
    interface HTMLElementTagNameMap {
        'markdown-reader': MarkdownReaderComponent;
    }
}
