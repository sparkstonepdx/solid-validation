import { useForm, type Validator } from '@sparkstone/solid-validation';

type Fields = { password: string; confirm: string };

export default function CrossFieldDemo() {
  const { formSubmit, validate, getFieldValue, errors, isSubmitting, isSubmitted } =
    useForm<Fields>();

  const minLength =
    (min: number): Validator<HTMLInputElement> =>
    el =>
      el.value.length < min && `Use at least ${min} characters`;

  // Reads the other field through the form rather than a signal, so the rule
  // lives with the field it belongs to.
  const mustMatch: Validator<HTMLInputElement> = el =>
    el.value !== getFieldValue('password') && 'Passwords do not match';

  return (
    <form ref={formSubmit(() => {})}>
      <p>
        <small>Fill in both, then change the first one and blur the second.</small>
      </p>

      <label for='d-password'>Password</label>
      <input
        id='d-password'
        type='password'
        name='password'
        required
        ref={validate(() => [minLength(8)])}
      />
      <small class='docs-error'>{errors.password}</small>

      <label for='d-confirm'>Confirm password</label>
      <input
        id='d-confirm'
        type='password'
        name='confirm'
        required
        ref={validate(() => [mustMatch])}
      />
      <small class='docs-error'>{errors.confirm}</small>

      <footer>
        <button type='submit' class='btn btn-primary' disabled={isSubmitting()}>
          Set password
        </button>
        {isSubmitted() && <ins>Saved</ins>}
      </footer>
    </form>
  );
}
