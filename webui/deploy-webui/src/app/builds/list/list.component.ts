import { Component, OnInit } from '@angular/core';
import { BuilderService } from '../../core/services/builder/builder.service';
import { Observable } from 'rxjs';
import { IHistoryListType } from '../../core/api-introspection';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  builds: Observable<IHistoryListType>;
  data: any[] = [];
  constructor(
    private buildService: BuilderService
  ) { }

  ngOnInit() {
    this.builds = this.buildService.getBuildHistory();
    for (let index = 1; index <= 1500; index++) {
      this.data.push({index: index, name: 'element-' + index});
    }
  }

}
