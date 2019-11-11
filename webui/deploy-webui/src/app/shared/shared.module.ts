import { NgModule } from '@angular/core';
import { ListFoldersComponent } from './components/list-folders/list-folders.component';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { SafeHtml } from './pipes/safe-html.pipe';

const COMPONENTS = [
    ListFoldersComponent,
    SafeHtml
];

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        MatListModule
    ],
    declarations: [
        ...COMPONENTS,
    ],
    exports: [COMPONENTS]
})
export class SharedModule {}
