import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NamespaceRoutingModule } from './namespace-routing.module';
import { ListComponent } from './list/list.component';
import { DetailsComponent } from './details/details.component';
import { MatListModule } from '@angular/material/list';
import { CovalentVirtualScrollModule } from '@covalent/core/virtual-scroll';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  imports: [
    CommonModule,
    NamespaceRoutingModule,
    MatListModule,
    CovalentVirtualScrollModule,
    MatIconModule,
    MatCardModule
  ],
  declarations: [ListComponent, DetailsComponent]
})
export class NamespaceModule { }
