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
````

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
    tags: new FormArray<{ value: string }>(
      [],
      (value) => new FormGroup({ value: value.value || value }) // Factory handles population automatically
    ),
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

### Typed Subscriptions & Virtual Inputs

You can subscribe to `valueChanges` on individual inputs, even if they aren't in the DOM yet!

```typescript
// Works even if 'email' input is inside an *ngIf or not yet rendered
this.form.get('email').valueChanges.subscribe(value => {
  console.log('Email changed:', value); // 'value' is strongly typed!
});
```

This is powered by "Virtual Inputs" which mock the input interface if the model key exists but the DOM element is missing.

### Working with Value Changes

The `valueChanges` observable is powerful for creating interactive forms.

#### 1. Debounced Search

```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

this.form.get('search').valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged()
).subscribe(term => {
  this.searchService.search(term);
});
```

#### 2. Dependant Fields (Cascading Dropdowns)

Reset or modify dependent fields when a parent field changes.

```typescript
this.form.get('country').valueChanges.subscribe(country => {
  // Reset state when country changes
  this.form.get('state').value = '';
  
  // Update state options dynamically based on country
  this.loadStatesFor(country);
});
```

#### 3. Dynamic Disabling

Disable controls based on the value of others.

```typescript
this.form.get('subscribeNewsletter').valueChanges.subscribe(shouldSubscribe => {
   const emailControl = this.form.get('newsletterEmail');
   if (shouldSubscribe) {
     emailControl.disabled = false;
   } else {
     emailControl.disabled = true;
     emailControl.value = ''; // Optional: clear value
   }
});
```

### Generic Typed AbstractInput

`AbstractInput` is now generic, propagating types through the form.

```typescript
const emailInput: AbstractInput<string> = this.form.get('email');
// emailInput.value is string
```

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

By default (`multi: false`), inputs with the same `name` attribute behave like radio buttons (single selection). To allow multiple selections (array of values), set `multi: true` in the form options.

**Scenario:** A list of permissions where multiple can be selected.

```typescript
@Form({
  name: 'permissions-form',
  multi: true // Enable multi-value binding for SAME-NAME inputs
})
form = new FormGroup({
  roles: [] // Will be an array of values ['admin', 'viewer']
});
```

```html
<label> <input name="roles" type="checkbox" value="admin" /> Admin </label>
<label> <input name="roles" type="checkbox" value="editor" /> Editor </label>
<label> <input name="roles" type="checkbox" value="viewer" /> Viewer </label>
```

### 2. Single Selection Checkbox (Default Behavior)

If you want multiple checkboxes to act like a radio button (only one valid at a time) but with uncheck capability, simply use the default `multi: false`.

```typescript
@Form({
  name: 'settings-form',
  // multi: false // Default behavior
})
form = new FormGroup({
  mode: '' // Will be a single string 'dark' or 'light'
});
```

```html
<label> <input name="mode" type="checkbox" value="dark" /> Dark </label>
<label> <input name="mode" type="checkbox" value="light" /> Light </label>
```

### 3. Per-Field Multi-Select Override

You can mix single-select and multi-select groups in the same form by keeping the global `multi: false` (default) and adding the `multiple` attribute to specific inputs.

```typescript
@Form({
  name: 'mixed-form',
  multi: false // Default (Single Select)
})
form = new FormGroup({
  mode: '',     // Single value
  tags: []      // Array of values
});
```

```html
<!-- Single Select (Radio behavior) -->
<input name="mode" type="checkbox" value="A" />
<input name="mode" type="checkbox" value="B" />

<!-- Multi Select (Array behavior) via 'multiple' attribute -->
<input name="tags" type="checkbox" value="news" multiple />
<input name="tags" type="checkbox" value="tech" multiple />
```

### 4. Framework-Agnostic Usage (Vanilla JS)

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
