# Router module for client side rxdi application

### [Starter application](https://github.com/rxdi/starter-client-lit-html)

#### Install
```bash
npm i @rxdi/router
```


#### Define routes with forRoot these will be evaluated lazy

```typescript
import { Module } from '@rxdi/core';
import { RouterModule } from '@rxdi/router';
import { DOCUMENTS } from './@introspection/documents';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { Components } from './shared/components';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

@Module({
  components: [
    HomeComponent,
    FooterComponent,
    NavbarComponent
  ],
  imports: [
    RouterModule.forRoot<Components>([
      {
        path: '/',
        component: 'home-component'
      },
      {
        path: '/about',
        component: 'about-component',
        action: () => import('./about/about.component')
      },
      {
        path: '/about/image-:size(\\d+)px',
        component: 'about-component',
        action: () => import('./about/about.component')
      },
      {
        path: '(.*)',
        component: 'not-found-component',
        action: () => import('./not-found/not-found.component')
      }
      //   { path: '/users/:user', component: 'x-user-profile' },
    ], { log: true })
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

```


#### Import `<router-outlet></router-outlet>` inside `AppComponent`

```typescript
import { html, Component } from '@rxdi/lit-html';

/**
 * @customElement app-component
 */
@Component({
  selector: 'app-component',
  template(this: AppComponent) {
    return html`
      <router-outlet></router-outlet>
    `,
  },
  container: document.body
})
export class AppComponent extends HTMLElement {}

```


#### Adding `header` and `footer` inside `router-outlet` is simple using `<slot></slot>` element

```html
<router-outlet>
  <navbar-component slot="header"></navbar-component>
  <footer-component slot="footer"></footer-component>
</router-outlet>
```

Header and footer can be added also outside of router `shadowDOM`

```html
<navbar-component></navbar-component>
<router-outlet></router-outlet>
<footer-component></footer-component>
```


#### Getting Route parameters using Typescript Decorator

> {path: '/profile/:name', component: 'x-user-profile'},

```typescript


import { Component, LitElement } from '@rxdi/lit-html';
/**
 * @customElement x-user-profile
 */
@Component({
  selector: 'x-user-profile'
})
export class UserProfile extends LitElement {

  @RouteParams()
  params: { name: string }

  render() {
    return html`${this.params.name}`;
  }
}
```



#### Router Guards

Defining Guard

 ```typescript
import { Injectable } from '@rxdi/core';
import { Observable } from 'rxjs';
import {
  CanActivateContext,
  CanActivateCommands,
  CanActivateResolver,
  CanActivateRedirect
} from '@rxdi/router';

@Injectable()
export class LoggedInGuard implements CanActivateResolver {
  OnInit() {}
   canActivate(
    context: CanActivateContext,
    commands: CanActivateCommands
  ):
    | CanActivateRedirect
    | boolean
    | Promise<boolean>
    | Observable<boolean>
    | void {
    // return false | true;
    // return new Promise((r) => r(true | false));
    // return new Observable((o) => {
    //     o.next(false | true);
    //     o.complete();
    // });
    // throw new Error('error');
  }
}
```

#### Using guard


#### Importing module

Guards can be defined inside `RouterModule`
When particular route resolver is triggered you will stop in this `Guard` before component is resolved

```typescript
RouterModule.forRoot<Components>([
  {
    path: '/',
    component: 'home-component'
  },
  {
    path: '/about',
    component: 'about-component',
    children: () => import('./about/about.module'),
    canActivate: LoggedInGuard
  },
])
```
Njoy!


#### Hooks

```typescript
import { html, Component, async, LitElement } from '@rxdi/lit-html';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { OnBeforeEnter, OnAfterEnter, OnAfterLeave, OnBeforeLeave } from '@rxdi/router';

@Component({
  selector: 'about-component',
  template(this: AboutComponent) {
    return html`
    <header>
      <h1>About</h1>
    </header>
    <p>
    <img src="https://www.w3schools.com/html/pic_trulli.jpg" alt="Italian Trulli">
    </p>
    `;
  }
})
export class AboutComponent extends LitElement implements OnBeforeEnter, OnAfterEnter, OnAfterLeave, OnBeforeLeave {
  onBeforeEnter() {
    this;
    debugger;
  }
  onAfterEnter() {
    this;
    debugger;
  }
  onBeforeLeave() {
    this;
    debugger;
  }
  onAfterLeave() {
    this;
    debugger;
  }
  OnInit() {
    debugger;
    console.log('About component init');
  }

  OnDestroy() {
    debugger;
    console.log('About component destroyed');
  }

}

```

#### Snapshot changes

You can subscribe to route changes using `onSnapshotChange`. This is useful for reactive updates based on the current route state.

```typescript
import { Component, html, LitElement, OnUpdateFirst } from '@rxdi/lit-html';
import { OnDestroy } from '@rxdi/lit-html';
import { Router } from '@rxdi/router';
import { Subject, takeUntil } from 'rxjs';

/**
 * @customElement app-component
 */
@Component({
  selector: 'app-component',
  template(this: AboutComponent) {
    return html``;
  },
})
export class AboutComponent extends LitElement implements OnUpdateFirst, OnDestroy {
  @Router()
  private router: Router;

  destroy$ = new Subject();

  OnUpdateFirst() {
    this.router
      .onSnapshotChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((e) => {
        console.log(e);
      });
  }

  OnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
```

#### Child Routing with Slots

The router supports advanced child routing where the parent component acts as a layout container. By using the standard Web Component `<slot></slot>` mechanism, the parent component can wrap child routes with common UI elements (headers, sidebars, etc.).

**Define the Module with Child Routes:**

```typescript
import { Module } from '@rxdi/core';
import { RouterModule } from '@rxdi/router';
import { ProjectContainerComponent } from './project-container.component';
import { DetailsComponent } from './details.component';
import { SettingsComponent } from './settings.component';

@Module({
  imports: [
    RouterModule.forChild([
      {
        path: '/:projectId',
        component: ProjectContainerComponent, // This component contains the <slot>
        children: [
          {
            path: '/',
            component: DetailsComponent, // Rendered inside ProjectContainerComponent's slot
          },
          {
            path: '/settings',
            component: SettingsComponent, // Rendered inside ProjectContainerComponent's slot
          }
        ],
      },
    ]),
  ],
})
export class ProjectsModule {}
```

**Parent Component Implementation (`ProjectContainerComponent`):**

The parent component simply includes a `<slot>` elements in its template. The router will automatically inject the matched child component into this slot.

```typescript
import { Component } from '@rhtml/component';
import { html, LitElement } from '@rxdi/lit-html';

@Component({
  selector: 'project-container-component',
  template: () => html`
    <div style="height: 100%; display: flex; flex-direction: column;">
      <header>Project Header (Visible on all child routes)</header>
      
      <!-- The active child route component will be rendered here -->
      <slot></slot>
      
      <footer>Project Footer</footer>
    </div>
  `,
})
export class ProjectContainerComponent extends LitElement {}
```