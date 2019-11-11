import { Component, OnInit, OnDestroy } from '@angular/core';
import { FileService } from '../../core/services/file/file.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Subscription } from 'apollo-client/util/Observable';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy {

  folderForm = this.formBuilder.group({
    path: this.fileService.defaultFolder
  });

  subscription: Subscription;

  constructor(
    private fileService: FileService,
    private formBuilder: FormBuilder
  ) {
  }

  ngOnInit() {
    this.subscription = this.fileService.currentFolder.subscribe(dir => this.folderForm.setValue({ path: dir || '.' }));
  }

  openNewFolder() {
    this.fileService.openNewFolder(this.folderForm.value.path);
  }

  back() {
    this.fileService.back();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
