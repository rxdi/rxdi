import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MainViewComponent } from './main-view/main-view.component';

@NgModule({
  imports: [
    RouterModule.forRoot(<Routes>[
      { path: '', redirectTo: 'folders', pathMatch: 'full' },
      { path: 'folders', loadChildren: './folders/folders.module#FoldersModule' },
      { path: 'builds', loadChildren: './builds/builds.module#BuildsModule' },
      { path: 'namespace', loadChildren: './namespace/namespace.module#NamespaceModule' },
    ], { useHash: true })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
