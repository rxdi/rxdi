# Reactive forms binding for LitHtml

#### Install
```bash
npm i @rxdi/forms
```



#### Using it inside component

##### Important!

> Define `<form>` element with `name` `<form name"my-form"></form>`

> Put `my-form` inside @Form({ name: 'my-form' }) decorator since this will be our form selector


```typescript
import { html, Component } from '@rxdi/lit-html';
import { FormGroup, Form } from '@rxdi/forms';
import { BaseComponent } from '../shared/base.component';

/**
 * @customElement login-component
 */
@Component({
  selector: 'login-component',
  template(this: LoginComponent) {
    return html`
      <form name="my-form" @submit=${this.onSubmit}>
        <input
          style="margin-bottom: 20px;"
          name="email"
          type="email"
          value=${this.form.value.email}
          placeholder="Email address"
          required
          autofocus
        />
        <input
          type="password"
          value=${this.form.value.password}
          name="password"
          placeholder="Password"
          required=""
        />
        <div>
          <label>
            <input name="rememberMe" type="checkbox" /> Remember me
          </label>
        </div>
        <button type="submit">
          Sign in
        </button>
      </form>
    `;
  }
})
export class LoginComponent extends BaseComponent {
  @Form({
    strategy: 'change',
    name: 'my-form'
  })
  private form = new FormGroup({
    password: '',
    email: '',
    rememberMe: ''
  });

  OnInit() {
    this.form.valueChanges.subscribe(values => {
      values; // password, email, rememberMe
    });
    this.form.getValue('password');
    this.form.setValue('email', 'blabla');
  }

  onSubmit(event: Event) {
    this.form.values;
  }
}

```



#### Error handling and validators

```typescript
import { html, Component } from '@rxdi/lit-html';
import { FormGroup, Form } from '@rxdi/forms';
import { BaseComponent } from '../shared/base.component';

/**
 * @customElement login-component
 */
@Component({
  selector: 'login-component',
  template(this: LoginComponent) {
    return html`
      <form name="my-form" @submit=${this.onSubmit}>
        <input
          style="margin-bottom: 20px;"
          name="email"
          type="email"
          placeholder="Email address"
          required
          autofocus
        />
        ${this.form.hasError('email', 'blabla') ? html`${this.form.getError('email', 'blabla')}` : ''}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required=""
        />
        <div>
          <label>
            <input name="rememberMe" type="checkbox" /> Remember me
          </label>
        </div>
        <button type="submit">
          Sign in
        </button>
      </form>
    `;
  }
})
export class LoginComponent extends BaseComponent {
  @Form({
    strategy: 'change',
    name: 'my-form'
  })
  private form = new FormGroup({
    password: '',
    email: ['', [this.validateEmail]],
    rememberMe: ''
  });

  OnUpdate() {
    this.form.getValue('password');
    this.form.setValue('email', 'blabla');

    this.form.get('password'); // returns HTMLIntputElement
    this.form.hasError('email', 'blabla')
  }

  onSubmit(event: Event) {
    this.form.values;
  }

  validateEmail(element: HTMLInputElement) {
    if (element.value === 'restrictedEmail@gmail.com') {
      return { key: 'blabla', message: 'Please specify different email'};
    }
  }
}

```



#### Group multiple inputs with single check intaraction

> By default all inputs with same attribute `name` are binded together,

```typescript
  @Form({
    strategy: 'change',
    name: 'my-form'
  })
  private form = new FormGroup({
    condition: ''
  });
```

```html
<label>
  <input
    name="condition"
    type="checkbox"
    value='none'
  />
  None
</label>

<label>
  <input
    name="condition"
    type="checkbox"
    value='checked'
  />
  Checked
</label>

<label>
  <input
    name="condition"
    type="checkbox"
    value='not-checked'
  />
  Not checked
</label>
```


#### Group multiple inputs with multi check intaraction


> To remove binding we can set `multi: false` when defining our form

```typescript
  @Form({
    strategy: 'change',
    name: 'my-form',
    multi: false
  })
  private form = new FormGroup({
    condition: ''
  });
```



#### Native browser errors

By default this library uses native error messages provided by HTML5 form validation API


You can create your error template as follow:

```typescript
import { html } from '@rxdi/lit-html';

export function InputErrorTemplate(input: HTMLInputElement) {
  if (input && !input.checkValidity()) {
    return html`
      <div>${input.validationMessage}</div>
    `;
  }
  return '';
}
```


Usage

```html
<form>
  <input
    name="email"
    type="email"
    value=${this.form.value.email}
    class="form-control"
    placeholder="Email address"
    required
    autofocus
  />
  ${InputErrorTemplate(this.form.get('email'))}
</form>
```




##### Native HTML with JS

```typescript

import { FormGroup } from '@rxdi/forms';

export function EmailValidator(element: HTMLInputElement) {
  const regex = /^([a-zA-Z0-9_\.\-]+)@([a-zA-Z0-9_\.\-]+)\.([a-zA-Z]{2,5})$/;
  if (!regex.test(element.value)) {
    element.classList.add('is-invalid');
    return {
      key: 'email-validator',
      message: 'Email is not valid'
    };
  }
  element.classList.remove('is-invalid');
}

const form = new FormGroup({
  email: ['', [EmailValidator]],
  password: '',
});

form
  .setParentElement(document.body)
  .setOptions({ name: 'my-form' })
  .prepareValues()
  .setFormElement(form.querySelectForm(document.body))
  .setInputs(form.mapEventToInputs(form.querySelectorAllInputs()));

```

```html
<form name="my-form">
  <input
    name="email"
    type="email"
    placeholder="Email address"
    required
    autofocus
  />
  <input
    name="password"
    type="password"
    required
  />
</form>
<script src="./main.ts"></script>
```