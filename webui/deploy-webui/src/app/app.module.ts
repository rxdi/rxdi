import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { GraphQLModule } from './graphql.module';
import { HttpClientModule } from '@angular/common/http';
import { NewPostGQL } from './test';
import { CoreModule } from './core/core.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AppRoutingModule } from './app-routing.module';
import { MainViewComponent } from './main-view/main-view.component';
import { CovalentLayoutModule } from '@covalent/core/layout';
import { CovalentStepsModule  } from '@covalent/core/steps';
import { CovalentSearchModule  } from '@covalent/core/search';
import { CovalentMenuModule  } from '@covalent/core/menu';
import { CovalentNotificationsModule  } from '@covalent/core/notifications';
import { CovalentLoadingModule } from '@covalent/core/loading';

/* any other core modules */
// (optional) Additional Covalent Modules imports
import { CovalentHttpModule } from '@covalent/http';
import { CovalentHighlightModule } from '@covalent/highlight';
import { CovalentMarkdownModule } from '@covalent/markdown';
import { CovalentDynamicFormsModule } from '@covalent/dynamic-forms';
import { COMPLETION_PROVIDERS } from 'ngx-monaco';
import { TravisCompletionProvider } from './folders/folders.monaco.provider';

export const COVALENT = [
  CovalentLayoutModule,
  CovalentStepsModule,
  CovalentSearchModule,
  CovalentMenuModule,
  MatMenuModule,
  CovalentLoadingModule,
  CovalentNotificationsModule,
  MatDividerModule,
  MatListModule,
  // (optional) Additional Covalent Modules imports
  CovalentHttpModule.forRoot(),
  CovalentHighlightModule,
  CovalentMarkdownModule,
  CovalentDynamicFormsModule,
];

@NgModule({
  declarations: [
    AppComponent,
    MainViewComponent
  ],
  imports: [
    ...COVALENT,
    BrowserModule,
    GraphQLModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule
  ],
  providers: [
    NewPostGQL,
    {
      provide: 'EventSource',
      useValue: window['serverSource']
    },
    {
      provide: 'ServerConfig',
      useFactory: () => {
        let config;
        try {
          config = JSON.parse(localStorage.getItem('config'));
        } catch (e) {
          localStorage.clear();
          window.location.reload();
        }
        return config;
      }
    },
    { provide: COMPLETION_PROVIDERS, useClass: TravisCompletionProvider, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
