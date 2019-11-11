import { Module } from '@rxdi/core';
import { GraphqlModule } from '@rxdi/graphql-client';
import { AppComponent } from './app.component';
import { HamburgerComponent } from '../../../src/hamburger/client/hamburger.component';
import { RouterModule } from '@rxdi/router';
import { HamburgerViewComponent } from './hamburger/hamburger.component';
import { MarkdownReaderModule, MarkdownReaderComponent } from '../../../src/markdown-reader/client/index';
import '../../../src/loading-screen/client/loading-screen.component';

import { RegularMarkdownComponent } from './markdown-reader/markdown-regular.component';
import { ResponsiveViewComponent } from './responsive/responsive.component';

@Module({
  components: [HamburgerComponent, RegularMarkdownComponent],
  imports: [
    MarkdownReaderModule,
    GraphqlModule.forRoot(
      {
        uri: 'http://localhost:9000/graphql',
        pubsub: ''
      },
      {}
    ),
    RouterModule.forRoot(
      [
        {
          path: '/ui-components/',
          component: HamburgerViewComponent
        },
        {
          path: '/ui-components/markdown-reader/link',
          component: RegularMarkdownComponent
        },
        {
          path: '/ui-components/markdown-reader/:namespace/:repo/:filePath',
          component: MarkdownReaderComponent
        },
        {
          path: '/ui-components/responsive',
          component: ResponsiveViewComponent
        },
      ],
      { log: true, baseUrl: '/ui-components' }
    )
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
