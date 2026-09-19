import { useForm } from '@sparkstone/solid-validation';
import { Show } from 'solid-js';

type Fields = { email: string; form: string };

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ServerErrorDemo() {
  const { formSubmit, validate, errors, isSubmitting, isSubmitted } = useForm<Fields>();

  async function onSubmit(form: HTMLFormElement) {
    await wait(500);
    const email = String(new FormData(form).get('email') ?? '');
    if (email.endsWith('@example.com')) return { email: 'That domain is not accepted' };
    if (email.startsWith('down')) return { form: 'The signup service is unavailable.' };
  }

  return (
    <form ref={formSubmit(onSubmit)}>
      <p>
        <small>
          Everything passes locally, then the server disagrees. Anything at{' '}
          <code>@example.com</code> comes back as a field error; an address starting with{' '}
          <code>down</code> comes back as a form-level one.
        </small>
      </p>

      <Show when={errors.form}>
        <div role='alert' class='alert alert-error'>
          {errors.form}
        </div>
      </Show>

      <label for='d-server-email'>Email</label>
      <input id='d-server-email' type='email' name='email' required ref={validate()} />
      <small class='docs-error'>{errors.email}</small>

      <footer>
        <button type='submit' class='btn btn-primary' disabled={isSubmitting()}>
          {isSubmitting() ? 'Signing up' : 'Sign up'}
        </button>
        {isSubmitted() && <ins>Account created</ins>}
      </footer>
    </form>
  );
}
