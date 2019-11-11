import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { importQuery } from '../../api-introspection/graphql.helpers';
import { map } from 'rxjs/operators';
import { IQuery } from '../../api-introspection';
import { BehaviorSubject } from 'rxjs';

export const LIST_FILES_QUERY = importQuery('list-files.query.graphql');
export const READ_FILE_QUERY = importQuery('read-file.query.graphql');
export const SAVE_FILE_QUERY = importQuery('save-file.query.graphql');

@Injectable()
export class FileService {
    defaultFolder = '.';
    currentFolder: BehaviorSubject<string> = new BehaviorSubject(this.defaultFolder);
    previewsFolder: string[] = [];
    mainFolder: string = this.defaultFolder;
    constructor(
        private apollo: Apollo
    ) { }

    listFiles(folder: string) {
        return this.apollo.query<IQuery>({
            query: LIST_FILES_QUERY,
            variables: { folder }
        }).pipe(
            map(res => res.data.listFiles)
        );
    }

    readFile(folder: string) {
        return this.apollo.query<IQuery>({
            query: READ_FILE_QUERY,
            variables: { folder }
        }).pipe(
            map(res => res.data.readFile)
        );
    }

    saveFile(folder: string, content: string) {
        return this.apollo.query<IQuery>({
            query: SAVE_FILE_QUERY,
            variables: { folder, content }
        }).pipe(
            map(res => res.data.saveFile)
        );
    }

    changeFolder(folder: string) {
        this.previewsFolder.push(this.currentFolder.getValue());
        this.currentFolder.next(folder);
    }

    openNewFolder(folder: string) {
        this.previewsFolder = [];
        this.mainFolder = folder;
        this.currentFolder.next(folder);
    }

    back() {
        this.currentFolder.next(this.previewsFolder.pop());
    }

    default() {
        this.currentFolder.next(this.mainFolder);
        this.previewsFolder = [];
    }

}
