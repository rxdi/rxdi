import { Module } from '@rxdi/core';
import { MarkdownParserService } from './markdown-reader.service';
import { TocComponent } from './toc/toc.component';
import { MarkdownParserMenuProvider } from './markdown-reader-menu.provider';
import { MarkdownReaderComponent } from './markdown-reader/markdown-reader.component';

@Module({
  components: [TocComponent, MarkdownReaderComponent],
  providers: [MarkdownParserService, MarkdownParserMenuProvider]
})
export class MarkdownReaderModule {}
