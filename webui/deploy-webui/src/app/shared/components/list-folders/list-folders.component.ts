import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { FileService } from '../../../core/services/file/file.service';
import { IFileType, IFolderStructureType } from '../../../core/api-introspection';
import { switchMap, filter, switchMapTo ,  skip } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-folders',
  templateUrl: './list-folders.component.html',
  styleUrls: ['./list-folders.component.css']
})
export class ListFoldersComponent implements OnInit, OnDestroy {

  private directory = '.';
  private subscription: Subscription;
  folders: Observable<IFileType>;

  constructor(
    private fileService: FileService,
    private router: Router
  ) { }


  ngOnInit() {
    this.subscription = this.fileService.currentFolder
      .pipe(
        filter(d => {
          this.directory = d;
          return !!d;
        }),
      )
      .subscribe(() => {
        this.folders = this.fileService.listFiles(this.directory);
      });
  }


  // isFileFromCurrentDirectory(file: IFolderStructureType) {
  //   if (this.directory + '/' + file.name === file.path) {
  //     return true;
  //   }
  // }

  goToFileDetails(path: string) {
    this.fileService.changeFolder(path);
  }

  back() {
    this.fileService.back();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openFile(file: IFolderStructureType) {
    this.router.navigate([`/folders/details/${file.name}`], {
      queryParams: {
        path: file.path
      }
    });
  }

}
