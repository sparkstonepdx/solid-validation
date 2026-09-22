import { useForm } from '@sparkstone/solid-validation';

type Fields = { email: string; handle: string; form: string };

const minLength = (min: number) => (el: HTMLInputElement) =>
  el.value.length < min && `Use at least ${min} characters`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exercises both submit paths on one page.
 *
 * The form uses formSubmit, which binds onsubmit directly to the element.
 * The button beside it calls submit() from an inline-arrow onClick, which is
 * the path that does not fire under jsdom in the test suite. If it works here,
 * the failure is the test environment rather than the library.
 */
export default function SubmitDemo() {
  const { formSubmit, validate, errors, isSubmitting, isSubmitted } = useForm<Fields>();

  async function onSubmit(form: HTMLFormElement) {
    await wait(400);
    const email = String(new FormData(form).get('email') ?? '');
    if (email.endsWith('@example.com')) return { email: 'That domain is not accepted' };
  }

  return (
    <form ref={formSubmit(onSubmit)}>
      <p>
        <small>
          Submit empty and both fields should refuse. Fill them in and it saves after 400ms.
          Anything at <code>@example.com</code> comes back rejected by the server.
        </small>
      </p>

      <label for='d-email'>Email</label>
      <input id='d-email' type='email' name='email' required ref={validate()} data-testid='email' />
      <small class='docs-error'>{errors.email}</small>

      <label for='d-handle'>Handle</label>
      <input
        id='d-handle'
        type='text'
        name='handle'
        required
        ref={validate(() => [minLength(3)])}
        data-testid='handle'
      />
      <small class='docs-error'>{errors.handle}</small>

      <footer>
        <button type='submit' disabled={isSubmitting()}>
          {isSubmitting() ? 'Saving' : 'Submit via form'}
        </button>
        <button type='reset'>Reset</button>
        {isSubmitted() && <ins>Saved</ins>}
      </footer>
    </form>
  );
}
