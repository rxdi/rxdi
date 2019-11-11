import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { BuilderService } from '../../core/services/builder/builder.service';
import { FileService } from '../../core/services/file/file.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'subscriptions-transport-ws';
import { IFileRawType, IMutation } from '../../core/api-introspection';
import { skip, tap, map } from 'rxjs/operators';
import { MonacoFile } from 'ngx-monaco';
import { LoggerService } from '../../core/services/logger/logger.service';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit, OnDestroy, AfterViewInit {
  file: string;
  path: string;
  subscription: Subscription;
  form = this.formBuilder.group({
    namespace: ['', Validators.required],
    commit: ['', Validators.required]
  });
  defaultFileType = 'typescript';
  rawFile: Observable<IFileRawType>;
  fileMonaco: MonacoFile = {
    uri: 'index.js',
    language: this.defaultFileType,
    content: `console.log('hello world');`
  };
  loading = true;
  isImage: boolean;
  disabled = false;
  newFile: string;
  ipfsLink: string;
  extension: string;
  fileChange = new Subject<MonacoFile>();
  stream: Observable<any>;
  @ViewChild('next') scroll: ElementRef;
  model;
  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private buildService: BuilderService,
    private formBuilder: FormBuilder,
    private fileService: FileService,
    public serverLogger: LoggerService,
    private apollo: Apollo
  ) { }

  ngOnInit() {

    this.file = this.route.snapshot.paramMap.get('file');
    this.extension = this.file.split('.').pop();
    this.isImage = this.extension === 'jpg' || this.extension === 'jpeg' || this.extension === 'png';
    if (this.extension === 'json') {
      this.defaultFileType = 'json';
    }
    if (this.extension === 'yml') {
      this.defaultFileType = this.extension;
    }
    this.subscription = this.route.queryParams
      .subscribe(params => {
        this.path = params['path'];
        if (this.path) {
          this.fileService.readFile(this.path)
            .subscribe(stream => {
              if (stream.package) {
                stream.package = JSON.parse(stream.package);
                this.form.patchValue({
                  namespace: stream.package['name']
                });
              }
              this.model = stream.file;
              this.fileMonaco.content = stream.file;
              this.loading = false;
            });
        } else {
          this.loading = false;
        }
      });

  }

  ngAfterViewInit() {
    this.stream = this.serverLogger.stream
      .pipe(
        skip(1),
        tap(() => this.scroll.nativeElement.scrollIntoView({ behavior: 'smooth' }))
      );
  }

  onFileChange(file: MonacoFile) {
    this.fileService.saveFile(this.path, this.model).subscribe(stream => console.log('Content saved'));
  }

  save() {

  }

  back() {
    this.location.back();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.serverLogger.clearLog();
  }

  isJsOrTs() {
    const extension = this.file.split('.').pop();
    return extension === 'js' || extension === 'ts';
  }

  deploy() {
    const folder = this.path.replace(this.file, '');
    this.disabled = true;
    this.buildService
      .build(folder, this.file, this.form.value.commit, this.form.value.namespace, `${folder}build`)
      .subscribe(
        () => this.disabled = false,
        () => this.disabled = false
      );
  }

  build() {

  }

  uploadFile() {
    this.disabled = true;
    const folder = this.path.replace(this.file, '');
    return this.apollo.mutate<IMutation>({
      mutation: gql`
        mutation uploadImage($folder:String!, $file:String!) {
          uploadImage(folder:$folder, file:$file) {
            link
          }
        }
      `,
      variables: {
        folder,
        file: this.file
      }
    })
    .pipe(
      map(res => res.data.uploadImage.link)
    )
    .subscribe(
      (res) => {
        this.ipfsLink = res;
        this.disabled = false;
      },
      () => this.disabled = false
    );
  }

}
