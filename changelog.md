# Changelog

All notable changes to `@sparkstone/solid-validation` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]

Targets Solid 2. **Projects on Solid 1 should stay on 1.x**: this release will
not run there, and 1.6.1 remains supported for Solid 1. The v1 documentation
stays published alongside the v2 docs.

The [migration guide](https://sparkstonepdx.github.io/solid-validation/v2/migrating/)
covers each change below with before and after code.

### Changed
- **Directives are replaced by ref factories.** Solid 2 has no `use:`
  directives. `use:validate` becomes `ref={validate()}` and
  `use:formSubmit={onSubmit}` becomes `ref={formSubmit(onSubmit)}`.
- **`validate` takes an accessor** returning the validator array:
  `ref={validate(() => [minLength(3)])}`.
- **`submit()` returns `Promise<boolean>`**: `true` when the submission went
  through, `false` when validation refused or the callback returned errors. It
  returned `void` before, so a caller could not tell whether it ran.
- **Cleared errors delete their key** instead of setting it to `undefined`, so
  `Object.keys(errors)` lists only fields that are currently failing.
- **Errors arrive on the next flush.** Solid 2 batches store writes, so an error
  is no longer in the store in the same tick as the event that caused it.
  Rendering is unaffected; imperative reads and tests should wait.
- Peer dependencies are now `solid-js` and `@solidjs/web`, both `^2.0.0-rc.9`.

### Added
- **Conditional validators.** The accessor passed to `validate` is read every
  time the field is checked, so a rule can depend on reactive state:
  `ref={validate(() => [needsMatch() && mustMatch])}`. In 1.x the array was
  fixed at mount.

### Removed
- **`validateRef`.** It existed because a directive could not be passed as a
  prop. `validate` returns an ordinary ref callback, so it covers that case:
  `ref={props.validate(() => [...])}`.

---

## [1.6.1]

### Changed
- Repository moved to the Sparkstone organisation; `repository`, `bugs` and `homepage` now point at `github.com/sparkstonepdx/solid-validation`. No code changes.

---

## [1.6.0] - 2026-09-17
### Fixed
- `clearErrors` now clears each field's error state, not just the store: a form reset or a successful submit previously left every field marked `aria-invalid="true"`, still carrying `errorClass`, and still failing `checkValidity()` from a stale custom validity message
- onBlur validation now actually works
- added test coverage and documentation in preparation for solidv2 migration

---

## [1.5.2] - 2026-06-04
- `submit` payload is now optional since it is only expected to be used by `formSubmit`
- enhanced documentation 

## [1.5.1] - 2026-05-06

### Fixed
- `isSubmitting` now remains true until after `isSubmitted` has been updated ([371820c](https://github.com/sparkstonepdx/solid-validation/commit/371820c))

---

## [1.5.0] - 2025-06-09

### Added
- Validation can now be used without a `<form>` element by calling the `submit()` function directly
- `use:validate` can now be applied to any HTML element, not just inputs — non-input elements must provide a `data-name` attribute for error tracking

### Changed
- When validation fails, the failing element is now scrolled into view (in addition to focused), to support elements that don't natively support `.focus()`

---

## [1.4.0] - 2025-02-21

### Added
- `Validator` type is now exported from the package

### Changed
- Falsy values (e.g. `false`, `null`, `undefined`) are now allowed as entries in the validators array passed to `validate` and `validateRef`, enabling patterns like `condition && myValidator`

### Fixed
- Added safety guards around `parsePocketbaseError` to handle edge cases more gracefully

---

## [1.3.0] - 2025-02-21

### Fixed
- Custom validators used with `validate` or `validateRef` now work correctly on elements that don't support `validationMessage` and `setCustomValidity` in the DOM

---

## [1.2.0] - 2025-02-20

### Added
- `validateField(fieldName)` — validate an individual field by name for special use cases
- `getFieldValue(fieldName)` — retrieve the current value of an individual field

---

## [1.0.0] - 2025-02-13

### Added
- Initial release of `@sparkstone/solid-validation`
- `useForm()` composable providing a validation context for Solid.js
- `use:validate` directive for registering form inputs with optional custom validator functions
- `use:formSubmit` directive for handling form submission with integrated validation
- `errors` reactive store exposing validation error messages keyed by field name
- `isSubmitting()` and `isSubmitted()` reactive signals
- PocketBase integration via `@sparkstone/solid-validation/pocketbase`
  - `prepareFormDataForPocketbase(formData, form)` — ensures unchecked checkboxes are included in submissions
  - `parsePocketbaseError(error, rootErrorKey?)` — maps PocketBase API errors to field-level messages
- TypeScript types exposed in package exports
