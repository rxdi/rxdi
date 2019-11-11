import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoldersRoutingModule } from './folders-routing.module';
import { ListComponent } from './list/list.component';
import { DetailsComponent } from './details/details.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MonacoEditorModule, COMPLETION_PROVIDERS } from 'ngx-monaco';
import { CovalentCodeEditorModule } from '@covalent/code-editor';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FoldersRoutingModule,
    MatListModule,
    MatIconModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MonacoEditorModule.forRoot(),
    CovalentCodeEditorModule
  ],
  declarations: [ListComponent, DetailsComponent]
})
export class FoldersModule { }
