import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import gql from 'graphql-tag';

@Injectable()
export class LoggerService {
    stream: BehaviorSubject<string[]> = new BehaviorSubject([]);
    constructor(
        private apollo: Apollo
    ) {
        this.apollo.subscribe({
            query: gql`
                subscription subscribeToUserMessagesBasic {
                subscribeToUserMessagesBasic {
                    message
                }
            }
        `
        })
        .pipe(
            map((res) => res.data.subscribeToUserMessagesBasic)
        )
        .subscribe(s => {
            this.stream.next([...this.stream.getValue(), s]);
        });
    }

    clearLog() {
        this.stream.next([]);
    }
}
