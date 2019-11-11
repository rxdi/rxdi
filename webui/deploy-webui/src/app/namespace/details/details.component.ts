import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { INamespacetype } from '../../core/api-introspection';
import { NamespaceService } from '../../core/services/namespace/namespace.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {
  id: string;
  namespace: Observable<INamespacetype>;
  constructor(
    private route: ActivatedRoute,
    private namespaceService: NamespaceService
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.namespace = this.namespaceService.getNamespaceById(this.id);
  }

}
