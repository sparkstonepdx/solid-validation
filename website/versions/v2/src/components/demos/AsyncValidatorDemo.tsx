import { useForm, type Validator } from '@sparkstone/solid-validation';

type Fields = { username: string };

const taken = ['ada', 'grace', 'alan'];

const minLength =
  (min: number): Validator<HTMLInputElement> =>
  el =>
    el.value.length < min && `Use at least ${min} characters`;

/** Stands in for a network call, latency included. */
const isAvailable: Validator<HTMLInputElement> = async el => {
  const value = el.value.toLowerCase();
  await new Promise(resolve => setTimeout(resolve, 600));
  return taken.includes(value) && `${el.value} is already taken`;
};

export default function AsyncValidatorDemo() {
  const { formSubmit, validate, errors, isSubmitting, isSubmitted } = useForm<Fields>();

  return (
    <form ref={formSubmit(() => {})}>
      <p>
        <small>
          Try <code>ada</code>, <code>grace</code> or <code>alan</code>. The availability check
          waits 600ms, and length is checked first so the slow call only runs when it has to.
        </small>
      </p>

      <label for='d-username'>Username</label>
      <input
        id='d-username'
        type='text'
        name='username'
        required
        ref={validate(() => [minLength(3), isAvailable])}
      />
      <small class='docs-error'>{errors.username}</small>

      <footer>
        <button type='submit' class='btn btn-primary' disabled={isSubmitting()}>
          {isSubmitting() ? 'Checking' : 'Claim username'}
        </button>
        {isSubmitted() && <ins>Available</ins>}
      </footer>
    </form>
  );
}
