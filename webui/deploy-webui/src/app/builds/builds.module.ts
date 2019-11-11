import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { BuildsRoutingModule } from './builds-routing.module';
import { ListComponent } from './list/list.component';
import { DetailsComponent } from './details/details.component';
import { CovalentVirtualScrollModule  } from '@covalent/core/virtual-scroll';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    MatListModule,
    BuildsRoutingModule,
    CovalentVirtualScrollModule,
    MatIconModule
  ],
  declarations: [ListComponent, DetailsComponent]
})
export class BuildsModule { }
