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

export function InputErrorTemplate(input: HTMLInputElement | AbstractInput) {
  // Check 'touched' to show errors only after interaction
  // Check 'validity.valid' silently to avoid side effects
  if (input && input.touched && !input.validity.valid) {
    return html`
      <div style="color:red; font-size: 13px;">${input.validationMessage}</div>
    `;
  }
  return '';
}
```

> **Note:** Using `!input.validity.valid` is preferred over `!input.checkValidity()` inside templates because `checkValidity()` fires an `invalid` event which can cause recursive validation loops.
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

#### Nested Forms (FormArray)

You can create nested forms using `FormArray` and `FormGroup`.

```typescript
import { FormArray, FormGroup } from '@rxdi/forms';

const form = new FormGroup({
  users: new FormArray([
    new FormGroup({
      name: 'User 1',
      email: 'user1@gmail.com'
    })
  ])
});
```

Template usage:

```html
${this.form.get('users').controls.map((group, index) => html`
  <div>
    <input
      name="users[${index}].name"
      .value=${group.value.name}
    />
    <input
      name="users[${index}].email"
      .value=${group.value.email}
    />
    <button @click=${() => this.removeUser(index)}>Remove</button>
  </div>
`)}
<button @click=${() => this.addUser()}>Add User</button>
```

Adding items dynamically:

```typescript
addUser() {
  (this.form.get('users') as FormArray).push(
    new FormGroup({ name: '', email: '' })
  );
}

removeUser(index: number) {
  (this.form.get('users') as FormArray).removeAt(index);
}
```

#### Type Safety & Decorator Checking

The `@Form` decorator now proactively checks that the decorated property is strongly typed as `FormGroup`.

```typescript
export class MyComponent {
  @Form({ name: 'my-form' })
  form: FormGroup; // Must be typed as FormGroup!
}
```

If you incorrectly type it (e.g., `form: string`), the library will throw a helpful error at runtime (requires `emitDecoratorMetadata: true` in `tsconfig`).

Validators are also type-safe using the `ValidatorFn` type:

```typescript
import { ValidatorFn, AbstractInput, InputErrorMessage } from '@rxdi/forms';

const myValidator: ValidatorFn = async (element: AbstractInput) => {
  // ... validation logic
};
```

#### Complete Component Example

Here is a complete, copy-pasteable example of a component using `@rxdi/forms` with best practices for validation and type safety.

```typescript
import { Component, html, LitElement } from '@rxdi/lit-html';
import { Form, FormGroup, AbstractInput } from '@rxdi/forms';

/**
 * Helper to display errors safely.
 * Checks 'touched' (user interacted) and 'validity.valid' (silent check).
 */
function ErrorTemplate(input: AbstractInput) {
  if (input && input.touched && !input.validity.valid) {
    return html`<div class="error">${input.validationMessage}</div>`;
  }
  return html``;
}

@Component({
  selector: 'user-profile-form',
  template(this: UserProfileForm) {
    return html`
      <form
        name="user-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          console.log('Form Value:', this.form.value);
        }}
      >
        <!-- Email Field -->
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            required
            .value=${this.form.value.email}
            @blur=${() => this.requestUpdate()} 
          />
          <!-- 
            @blur triggers a re-render so 'touched' state is reflected.
            The library handles 'touched' internally on blur, but we need 
            to request an update to show the error message immediately.
          -->
          ${ErrorTemplate(this.form.get('email'))}
        </div>

        <!-- Password Field -->
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            required
            minlength="6"
            .value=${this.form.value.password}
            @blur=${() => this.requestUpdate()}
          />
          ${ErrorTemplate(this.form.get('password'))}
        </div>

        <button type="submit" ?disabled=${this.form.invalid}>
          Save Profile
        </button>
      </form>
    `;
  },
})
export class UserProfileForm extends LitElement {
  @Form({
    name: 'user-form', // Must match <form name="...">
    strategy: 'change', // Validate on change/blur
  })
  form = new FormGroup({
    email: '',
    password: '',
  });
}
```

### Key Takeaways for Templates

1.  **Name Matching**: The `<form name="X">` attribute must match the `@Form({ name: 'X' })` name.
2.  **Input Binding**: Use `.value=${this.form.value.fieldName}` to bind data. The library updates the model on user input automatically.
3.  **Error Display**: Use a helper like `ErrorTemplate` that checks `.touched` and `.validity.valid`.
    *   **Wait until touched**: `if (input.touched)` prevents errors from showing on load.
    *   **Silent Check**: `!input.validity.valid` prevents side effects (looping).
4.  **Re-rendering**: Since validation often updates on `blur`, ensure your component re-renders to show the error state (e.g., via `@blur=${() => this.requestUpdate()}` or generic event handlers).

#### Complete Nested Form Example (FormArray)

This example demonstrates managing a dynamic list of items (e.g., Team Members) using `FormArray`.

```typescript
import { Component, html, LitElement } from '@rxdi/lit-html';
import { Form, FormGroup, FormArray, AbstractInput } from '@rxdi/forms';

function ErrorTemplate(input: AbstractInput) {
  if (input && input.touched && !input.validity.valid) {
    return html`<div class="error">${input.validationMessage}</div>`;
  }
  return html``;
}

@Component({
  selector: 'team-form',
  template(this: TeamForm) {
    return html`
      <form @submit=${(e) => e.preventDefault()}>
        
        <!-- Main Form Field -->
        <div>
          <label>Team Name</label>
          <input
            name="teamName"
            required
            .value=${this.form.value.teamName}
            @blur=${() => this.requestUpdate()}
          />
          ${ErrorTemplate(this.form.get('teamName'))}
        </div>

        <h3>Members</h3>
        
        <!-- FormArray Iteration -->
        ${this.members.controls.map((control, index) => html`
          <div class="member-row">
            
            <!-- Nested Field: Name -->
            <!-- Notice the name syntax: arrayName[index].fieldName -->
            <div class="field">
              <input
                placeholder="Member Name"
                name="members[${index}].name" 
                required
                .value=${control.value.name}
                @blur=${() => this.requestUpdate()}
              />
              <!-- Access nested control using .get() on the group -->
              ${ErrorTemplate(control.get('name'))}
            </div>

            <!-- Nested Field: Role -->
            <div class="field">
              <input
                placeholder="Role"
                name="members[${index}].role"
                required
                .value=${control.value.role}
                @blur=${() => this.requestUpdate()}
              />
              ${ErrorTemplate(control.get('role'))}
            </div>

            <button type="button" @click=${() => this.removeMember(index)}>
              Remove
            </button>
          </div>
        `)}

        <button type="button" @click=${() => this.addMember()}>
          Add Member
        </button>

        <button type="submit" ?disabled=${this.form.invalid}>
          Submit Team
        </button>
      </form>
    `;
  },
})
export class TeamForm extends LitElement {
  @Form({
    name: 'team-form',
    strategy: 'change',
  })
  form = new FormGroup({
    teamName: '',
    members: new FormArray<{ name: string; role: string }>([]),
  });

  // Helper to cast the control to FormArray for better typing
  get members() {
    return this.form.get('members') as FormArray;
  }

  addMember() {
    this.members.push(
      new FormGroup({
        name: '',
        role: '',
      })
    );
  }

  removeMember(index: number) {
    this.members.removeAt(index);
  }
}
```