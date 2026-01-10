# Reactive Forms for LitHtml (Enhanced)

A lightweight, strongly-typed, reactive forms library for LitHtml applications.

## Features

- **Strict Typing**: Full TypeScript support with `UnwrapValue` and `NestedKeyOf` for deep property inference.
- **Nested Forms**: Support for deep `FormGroup` nesting and `FormArray`.
- **Automatic Binding**: Bind component models directly to forms with `@Form({ model: 'myModel' })`.
- **Reactive**: based on `rxjs` `BehaviorSubject` for value streams.
- **Recursive Updates**: `patchValue` updates deep structures recursively.

## Installation

```bash
npm i @rxdi/forms
```

## Basic Usage

### 1. Define Model & Component

```typescript
import { html, Component, LitElement } from '@rxdi/lit-html';
import { Form, FormGroup } from '@rxdi/forms';

interface UserParams {
  firstName: string;
  address: {
    city: string;
    street: string;
  };
}

@Component({
  selector: 'user-profile',
  template(this: UserProfile) {
    return html`
      <form name="user-form" @submit=${this.onSubmit}>
        <!-- Deep Binding with Dot Notation -->
        <input
          name="firstName"
          .value=${this.form.value.firstName}
          @blur=${() => this.requestUpdate()}
        />

        <!-- Nested Group Binding -->
        <input
          name="address.city"
          .value=${this.form.value.address.city}
          @blur=${() => this.requestUpdate()}
        />

        <button type="submit">Save</button>
      </form>
    `;
  },
})
export class UserProfile extends LitElement {
  // Model to bind
  @property({ type: Object })
  user: UserParams = {
    firstName: 'John',
    address: { city: 'New York', street: '5th Ave' },
  };

  @Form({
    name: 'user-form',
    strategy: 'change',
    model: 'user', // Automatic Model Binding!
  })
  form = new FormGroup({
    firstName: '',
    address: new FormGroup({
      city: '',
      street: '',
    }),
  });

  onSubmit(e: Event) {
    e.preventDefault();
    console.log(this.form.value);
    // Output: { firstName: 'John', address: { city: 'New York', street: '5th Ave' } }
  }
}
```

## New Features

### Automatic Model Binding

Use the `model` property in the `@Form` decorator to automatically populate the form from a component property.

```typescript
@Form({
  name: 'my-form',
  model: 'myData' // matches this.myData
})
form = new FormGroup({ ... });
```

The library reads `this.myData` during initialization and calls `form.patchValue(this.myData)`.

### Nested FormGroups & FormArray

You can nest `FormGroup`s arbitrarily deep.

```typescript
form = new FormGroup({
  meta: new FormGroup({
    id: 1,
    flags: new FormGroup({
      isActive: true,
      isAdmin: false,
    }),
  }),
  tags: new FormArray([new FormGroup({ label: 'red' })]),
});
```

**Template Binding:**
Use dot notation for nested controls:

```html
<input name="meta.flags.isActive" type="checkbox" />
```

### Type Safety & Autosuggestion

The library now extensively uses advanced TypeScript features:

- **`form.value`**: Returns the unwrapped pure object type (e.g., `{ meta: { flags: { isActive: boolean } } }`).
- **`form.get('path.to.prop')`**: Provides autocomplete for deep paths and infers return types!
  - `form.get('key')` returns exact control type (e.g. `FormArray`) without casting.

```typescript
// TypeScript knows this is valid:
this.form.get('meta.flags.isActive');

// And this is invalid:
this.form.get('meta.flags.wrongProp'); // Error!
```

### Recursive PatchValue

Update multiple fields deeply at once:

````typescript
this.form.patchValue({
  meta: {
    flags: {
      isActive: false
    }
  }
});
// Only updates 'isActive', leaves other fields untouched.
### Dynamic Array Inputs (FormArray)

For lists of primitive values, use `FormArray` with an `itemFactory` and automatic model binding. This removes the need for manual population.

#### Full Working Example

```typescript
import { Component, html, LitElement, property } from '@rxdi/lit-html';
import { Form, FormGroup, FormArray } from '@rxdi/forms';


@Component({
  selector: 'tags-component',
  template(this: TagsComponent) {
    return html`
      <form @submit=${(e) => e.preventDefault()}>
        <h3>Tags</h3>

        <!-- List Tags -->
        ${this.form.get('tags').controls.map(
          (control, index) => html`
            <div class="tag-row">
              <input name="tags[${index}].value" .value=${control.value.value} @blur=${() => this.requestUpdate()} />
              <button type="button" @click=${() => this.removeTag(index)}>Remove</button>
            </div>
          `
        )}

        <button type="button" @click=${() => this.addTag()}>Add Tag</button>
        <button type="button" @click=${() => this.onSubmit()}>Submit</button>
      </form>
    `;
  },
})
export class TagsComponent extends LitElement {
  // Model automatically binds to 'tags' in form
  @property({ type: Array })
  tags = ['news', 'tech'];

  @Form({
    name: 'tags-form',
    model: 'tags', // Triggers form.patchValue(this.tags) on INIT
  })
  form = new FormGroup({
    tags: new FormArray<{ value: string }>([], {
      name: 'tags',
      // Factory describes how to create new controls from model data
      itemFactory: (value) => new FormGroup({ value: value.value || value }),
    }),
  });

  addTag() {
    this.form.get('tags').push(new FormGroup({ value: '' }));
  }

  removeTag(index: number) {
    this.form.get('tags').removeAt(index);
  }

  onSubmit() {
    const dirtyTags = this.form.value.tags;
    console.log(dirtyTags.map((t) => t.value));
  }
}

````

## API Reference

### Validators

Validators are async functions returning `InputErrorMessage` or `void`.

```typescript
export function CustomValidator(element: AbstractInput) {
  if (element.value === 'invalid') {
    return { key: 'customError', message: 'Value is invalid' };
  }
}

// Usage
new FormGroup({
  field: ['', [CustomValidator]],
});
```

### Error Display Information

Use the `touched` and `validity.valid` properties for clean UI.

```typescript
function ErrorTemplate(input: AbstractInput) {
  if (input?.touched && !input.validity.valid) {
    return html`<div class="error">${input.validationMessage}</div>`;
  }
  return html``;
}
```

## Advanced Usage

### 1. Grouping Multiple Inputs (Checkbox Groups)

By default, inputs with the same `name` attribute are treated as a single value (last write wins). However, for checkboxes, you often want an array of values.

**Scenario:** A list of permissions where multiple can be selected.

```typescript
@Form({
  name: 'permissions-form',
  multi: true // Enable multi-value binding for same-name inputs
})
form = new FormGroup({
  roles: [] // Will be an array of values
});
```

```html
<label> <input name="roles" type="checkbox" value="admin" /> Admin </label>
<label> <input name="roles" type="checkbox" value="editor" /> Editor </label>
<label> <input name="roles" type="checkbox" value="viewer" /> Viewer </label>
```

If the user checks "Admin" and "Viewer", `form.value.roles` will be `['admin', 'viewer']`.

### 2. Single Selection Checkbox (Radio Behavior with Checkboxes)

If you want multiple checkboxes to act like a radio button (only one valid at a time) but with uncheck capability:

```typescript
@Form({
  name: 'settings-form',
  multi: false // Default behavior
})
form = new FormGroup({
  mode: ''
});
```

```html
<label> <input name="mode" type="checkbox" value="dark" /> Dark </label>
<label> <input name="mode" type="checkbox" value="light" /> Light </label>
```

Checking "Dark" unchecks "Light" automatically.

### 3. Framework-Agnostic Usage (Vanilla JS)

You can use this library without Decorators or LitHtml, with any UI library or vanilla HTML.

```typescript
import { FormGroup } from '@rxdi/forms';

const form = new FormGroup({
  email: '',
  password: '',
});

// manually attach to DOM
const formElement = document.querySelector('form');
form
  .setParentElement(document.body)
  .setOptions({ name: 'my-form' })
  .setFormElement(formElement)
  .prepareValues()
  .setInputs(form.mapEventToInputs(form.querySelectorAllInputs()));

// Listen to changes
form.valueChanges.subscribe((val) => console.log(val));
```

### 4. Custom Error Handling Strategies

By default, verification happens on `change` or `blur`. You can control this via `strategy`.

```typescript
@Form({
  name: 'login',
  strategy: 'input' // Validate on every keystroke
})
```

You can also manually check error states (e.g. for async validation):

```typescript
async validateEmail(element: HTMLInputElement) {
  const exists = await checkServer(element.value);
  if (exists) {
    return { key: 'emailExists', message: 'Email already taken' };
  }
}

// In Template
${this.form.hasError('email', 'emailExists')
  ? html`<div class="error">Email taken!</div>`
  : ''}
```
