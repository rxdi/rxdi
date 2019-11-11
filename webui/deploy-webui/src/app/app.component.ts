import { Component, AfterViewInit, ChangeDetectorRef, AfterViewChecked, ElementRef } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { ServerService } from './core/services/server/server.service';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { BackService } from './core/services/back.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, AfterViewChecked {
  title = 'deploy-webui';
  lastRoute: string;
  lastPosition = 0;
  constructor(
      private router: Router,
      private location: Location,
      public backService: BackService,
      private cdRef: ChangeDetectorRef,
      private element: ElementRef
  ) {}

  goTo(link: string) {
    this.backService.hideArrow();
    this.router.navigate([link]);
  }

  back() {
    this.location.back();
    this.backService.hideArrow();
  }
  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }
  ngAfterViewInit() {
    this.router.events
      .subscribe(events => {
        window.scrollTo(0, 0);
        if (events instanceof NavigationStart && events.url !== this.lastRoute) {
          this.lastRoute = this.router.url;

          // if using a div as a scroll area (note this component has to be the div, otherwise you need to
          // select a child e.g. this.element.nativeElement.firstChild.scrollTop :
          this.lastPosition = this.element.nativeElement.scrollTop || 0;
          // Scroll to top because it's a new route.
          this.element.nativeElement.scrollTop = 0;
          // if using window :
          this.lastPosition = window.pageYOffset;
          // Scroll to top because it's a new route.
          setTimeout(() => window.scrollTo(0, 0), 50);
          console.log('Navigating to a new route, and are saving position : ', this.lastPosition);
        }
        if (events instanceof NavigationEnd && events.url === this.lastRoute) {
          this.element.nativeElement.firstChild.scrollTop = this.lastPosition;
          console.log('Went back and now are navigating to : ', this.lastPosition);
          setTimeout(() => window.scrollTo(0, this.lastPosition), 700);
        }
      });
  }
}
