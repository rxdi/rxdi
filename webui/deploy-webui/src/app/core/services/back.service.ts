import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class BackService {
    isArrowVisible: BehaviorSubject<boolean> = new BehaviorSubject(false);


    showArrow() {
        this.isArrowVisible.next(true);
    }

    hideArrow() {
        this.isArrowVisible.next(false);
    }

    toggleArrow() {
        this.isArrowVisible.next(this.isArrowVisible.getValue());
    }

}
