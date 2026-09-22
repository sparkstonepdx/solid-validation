# @sparkstone/solid-validation

A lightweight and flexible validation library for Solid.js. It provides a simple API to validate form inputs, handle submission state, and manage error messages. It also supports validation outside of forms and inputs.

Full documentation, with live demos: https://sparkstonepdx.github.io/solid-validation/

> **Solid 1?** Install 1.x: `npm install @sparkstone/solid-validation@1`.
> 2.x requires Solid 2. The [v1 docs](https://sparkstonepdx.github.io/solid-validation/v1/) are still published.

## Installation

```sh
npm install @sparkstone/solid-validation
```

or

```sh
pnpm add @sparkstone/solid-validation
```

## Table of Contents

- [Usage](#usage)

  - [Basic Example](#basic-example-form-based)
  - [Non-Form Validation](#validation-outside-of-forms-and-inputs)
  - [Passing Validation to Child Components](#passing-validation-to-child-components)

- [API](#api)

  - [`useForm(options?: { errorClass?: string })`](#useformoptions--errorclass-string-)

    - [`validate`](#validate)
    - [`formSubmit`](#formsubmit)
    - [`submit`](#submit)
    - [`errors`](#errors)
    - [`isSubmitting`](#issubmitting)
    - [`isSubmitted`](#issubmitted)
    - [`validateField`](#validatefield)
    - [`getFieldValue`](#getfieldvalue)

- [Custom Validation](#custom-validation)
- [PocketBase Integration](#pocketbase-integration)

## Usage

### Basic Example (Form Based)

```tsx
import { useForm } from '@sparkstone/solid-validation';

function min5Characters(el: HTMLInputElement) {
  if (el.value.length < 5) {
    return 'must be at least 5 characters long';
  }
}

function MyForm() {
  const { formSubmit, validate, errors, isSubmitting, isSubmitted } = useForm();

  async function onSubmit(form: HTMLFormElement) {
    const formData = new FormData(form);

    try {
      // Submit form data here
    } catch (e) {
      return {
        myCustomFormError: e.message,
      };
    }
  }

  return (
    <form ref={formSubmit(onSubmit)}>
      <input type='text' name='username' placeholder='Enter username' required ref={validate()} />
      <span>{errors.username}</span>

      <input
        type='text'
        name='message'
        placeholder='Enter message'
        required
        ref={validate(() => [min5Characters])}
      />
      <span>{errors.message}</span>

      <span>{errors.myCustomFormError}</span>

      <button type='submit' disabled={isSubmitting()}>
        {isSubmitting() ? 'Submitting...' : 'Submit'}
      </button>

      {isSubmitted() && <p>Form successfully submitted!</p>}
    </form>
  );
}
```

### Validation Outside of Forms and Inputs

You can validate any element, not just form inputs:

```tsx
<div ref={validate(() => [myCustomValidator])} data-name='customField'></div>
```

- When using `ref={validate()}` on non-input elements, you **must** supply a `data-name` attribute for error tracking.
- Validation can be triggered manually using the `submit()` function, even without a form.
- On validation failure, the library will automatically scroll the invalid element into view and focus it if possible.

```tsx
function MyComponent() {
  const { validate, submit, errors } = useForm();

  async function handleClick() {
    await submit(async () => {
      // perform your action here
      // return an object to set field-level errors, or return nothing on success
    });
  }

  return (
    <>
      <div ref={validate(() => [myCustomValidator])} data-name='customField' />
      <span>{errors.customField}</span>
      <button onClick={handleClick}>Validate</button>
    </>
  );
}
```

### Passing Validation to Child Components

`validate` returns an ordinary ref callback, so it can be passed down as a prop like any other value.

Pass `validate` down as a prop and call it in the child with any validators:

```tsx
// ParentForm.tsx
function ParentForm() {
  const { formSubmit, validate, errors } = useForm();

  return (
    <form ref={formSubmit(onSubmit)}>
      <UsernameField validate={validate} />
      <span>{errors.username}</span>
      <button type='submit'>Submit</button>
    </form>
  );
}
```

```tsx
// UsernameField.tsx
import { useForm } from '@sparkstone/solid-validation';

interface UsernameFieldProps {
  validate: ReturnType<typeof useForm>['validate'];
}

function UsernameField(props: UsernameFieldProps) {
  return (
    <input
      type='text'
      name='username'
      required
      ref={props.validate(() => [minLength])}
    />
  );
}
```

The child component owns its own validators — the parent just passes `validate` down without needing to know what rules each field applies.

## API

### `useForm(options?: { errorClass?: string })`

Accepts an optional `errorClass` string which, when provided, is toggled on invalid elements:

```tsx
const { formSubmit, validate } = useForm({ errorClass: 'input-error' });
```

#### Returns:

##### `validate`

`validate(accessor?: () => Validator[]): (ref: HTMLElement) => void`

Returns a ref callback that registers an element for validation, on form inputs and on other elements alike. Validation runs on `blur` and on submit, and an error clears when the field is typed into.

```tsx
<input ref={validate(() => [minLength(3), isEmail])} name='email' />

// native constraints only
<input ref={validate()} name='username' required />
```

The array is read every time the field is checked, so a rule can depend on reactive state and follow it:

```tsx
<input ref={validate(() => [isRequired, needsMatch() && mustMatch])} />
```

##### `formSubmit`

`formSubmit(callback?: OnFormSubmit): (ref: HTMLFormElement) => void`

Handles form submission. Runs all registered validations, focuses and scrolls to the first failing field, and calls the callback only if all fields pass. Automatically adds `novalidate` to the form element and clears errors on form reset.

The callback receives the form element and can return an object to set server-side field errors:

```tsx
async function onSubmit(form: HTMLFormElement) {
  try {
    await api.submit(new FormData(form));
  } catch (e) {
    return { username: 'This username is already taken' };
  }
}
```

If the callback returns nothing (or `void`), all errors are cleared and `isSubmitted` is set to `true`. If it returns an object, those errors are merged into the `errors` store.

##### `submit`

`submit(callback: (payload?: Payload) => Promise<void | ErrorFields>, payload?: Payload): Promise<boolean>`

Triggers validation manually without a form element. Useful for validating arbitrary elements or building custom submission flows. Behaves the same as `formSubmit` — clears errors and sets `isSubmitted` on success, or merges returned errors on failure.

Resolves to `true` when the submission went through, and `false` when validation refused or the callback returned errors. A refused submit is an ordinary outcome, not an exception, so it never rejects.

##### `errors`

`errors: Partial<Record<string, string>>`

Reactive store of current validation error messages, keyed by field name (from `name` attribute or `data-name`).

##### `isSubmitting`

`isSubmitting: () => boolean`

`true` while the submission callback is running.

##### `isSubmitted`

`isSubmitted: () => boolean`

`true` after a successful submission (callback returned `void`). Reset to `false` on the next input event.

##### `validateField`

`validateField(fieldName: string): Promise<boolean>`

Validates a single field by name and returns `true` if valid, `false` if not. Scrolls to and focuses the element if validation fails.

##### `getFieldValue`

`getFieldValue(fieldName: string): string | undefined`

Returns the current value of a registered field's element.

## Custom Validation

Where `Falsy` is `false | 0 | '' | null | undefined | void`.

Validator functions receive an `HTMLElement` and return:

- `Falsy` for valid inputs.
- A `string` error message for invalid inputs.
- A `Promise<string | Falsy>` for async validation.

```tsx
import type { Validator } from '@sparkstone/solid-validation';

const minLength: Validator<HTMLInputElement> = el =>
  el.value.length < 5 && 'Must be at least 5 characters';

async function isUsernameTaken(el: HTMLInputElement) {
  const taken = await api.checkUsername(el.value);
  return taken ? 'Username is already taken' : undefined;
}
```

The `Validator` type is exported from the package and accepts a generic element type for stronger typing.

## PocketBase Integration

For integrating validation with [PocketBase](https://pocketbase.io/), this package includes helper functions. These are shipped as a separate bundle and will not be included in your build unless explicitly imported from `@sparkstone/solid-validation/pocketbase`.

### `prepareFormDataForPocketbase(formData: FormData, form: HTMLFormElement)`

Ensures unchecked checkboxes are properly submitted to PocketBase (which requires an explicit `false` value rather than omission).

```ts
import { prepareFormDataForPocketbase } from '@sparkstone/solid-validation/pocketbase';

async function onSubmit(form: HTMLFormElement) {
  const formData = new FormData(form);
  prepareFormDataForPocketbase(formData, form);
  await pocketbase.collection('users').create(formData);
}
```

### `parsePocketbaseError(error: PocketbaseError, rootErrorKey = 'form')`

Maps a PocketBase API error into a field-keyed error object compatible with `useForm`. Returns the result directly from your `formSubmit` callback to populate field errors:

```tsx
import { parsePocketbaseError } from '@sparkstone/solid-validation/pocketbase';

async function onSubmit(form: HTMLFormElement) {
  const formData = new FormData(form);
  try {
    await pocketbase.collection('users').create(formData);
  } catch (e) {
    return parsePocketbaseError(e);
    // e.g. { email: 'Invalid email address', password: 'Too short' }
  }
}
```

The optional `rootErrorKey` parameter (default `'form'`) sets the key used for the top-level error message when PocketBase returns a non-field-level error.
