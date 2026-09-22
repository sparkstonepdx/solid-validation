import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { useForm } from '../src/main';
import {
  blur,
  deferred,
  minLength,
  press,
  registered,
  submitForm,
  text,
  typeInto,
  waitFor,
} from './helpers';

type Fields = { username: string; message: string; formError: string };

/** A form with two fields, one native-required and one custom-validated. */
function BasicForm(props: {
  onSubmit?: (form: HTMLFormElement) => any;
  errorClass?: string;
  ready?: (api: ReturnType<typeof useForm<Fields>>) => void;
}) {
  const api = useForm<Fields>({ errorClass: props.errorClass });
  const { formSubmit, validate, errors, isSubmitting, isSubmitted } = api;
  props.ready?.(api);

  return (
    <form ref={formSubmit(props.onSubmit ?? (() => {}))} data-testid='form'>
      <input type='text' name='username' required ref={validate()} data-testid='username' />
      <span data-testid='error-username'>{errors.username}</span>

      <input type='text' name='message' ref={validate(() => [minLength(5)])} data-testid='message' />
      <span data-testid='error-message'>{errors.message}</span>

      <span data-testid='error-form'>{errors.formError}</span>

      <button type='submit' disabled={isSubmitting()} data-testid='submit'>
        {isSubmitting() ? 'Saving' : 'Save'}
      </button>
      <button type='reset' data-testid='reset'>
        Reset
      </button>
      <span data-testid='submitted'>{isSubmitted() ? 'yes' : 'no'}</span>
    </form>
  );
}

describe('field registration', () => {
  it('adds novalidate to the form so native UI does not preempt validation', async () => {
    render(() => <BasicForm />);
    await registered();
    expect(screen.getByTestId('form')).toHaveAttribute('novalidate');
  });

  it('registers fields one microtask after render, not during it', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => <BasicForm ready={a => (api = a)} />);

    expect(api.getFieldValue('username')).toBeUndefined();

    await registered();
    expect(api.getFieldValue('username')).toBe('');
  });
});

describe('blur validation', () => {
  // No await: a native constraint failure never reaches a validator, so the
  // whole path is synchronous. If this needs a wait, the scheduler changed.
  it('reports a native constraint failure synchronously on blur', async () => {
    render(() => <BasicForm />);
    await registered();

    await blur(screen.getByTestId('username'));

    expect(screen.getByTestId('error-username')).not.toBeEmptyDOMElement();
    expect(screen.getByTestId('username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports a custom validator failure on blur', async () => {
    render(() => <BasicForm />);
    await registered();

    const message = screen.getByTestId('message') as HTMLInputElement;
    await typeInto(message, 'abc');
    await blur(message);

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Must be at least 5 characters'),
    );
  });

  it('leaves a passing field untouched on blur', async () => {
    render(() => <BasicForm />);
    await registered();

    const message = screen.getByTestId('message') as HTMLInputElement;
    await typeInto(message, 'long enough');
    await blur(message);

    await waitFor(() => expect(message.validationMessage).toBe(''));
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
    expect(message).not.toHaveAttribute('aria-invalid', 'true');
  });
});

describe('clearing errors', () => {
  it('clears the error and aria-invalid synchronously on the next input', async () => {
    render(() => <BasicForm />);
    await registered();

    const username = screen.getByTestId('username') as HTMLInputElement;
    await blur(username);
    expect(screen.getByTestId('error-username')).not.toBeEmptyDOMElement();

    await typeInto(username, 'ada');

    expect(screen.getByTestId('error-username')).toBeEmptyDOMElement();
    expect(username).toHaveAttribute('aria-invalid', 'false');
  });

  it('clears the field error state on reset, not just the store', async () => {
    render(() => <BasicForm errorClass='is-invalid' />);
    await registered();

    const username = screen.getByTestId('username') as HTMLInputElement;
    const message = screen.getByTestId('message') as HTMLInputElement;

    await blur(username);
    await typeInto(message, 'abc');
    await blur(message);
    await waitFor(() => expect(message.validationMessage).toBe('Must be at least 5 characters'));
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(username).toHaveClass('is-invalid');

    await press(screen.getByTestId('reset'));

    expect(username).toHaveAttribute('aria-invalid', 'false');
    expect(username).not.toHaveClass('is-invalid');
    expect(message).toHaveAttribute('aria-invalid', 'false');

    // The custom validity is gone. `username` stays natively invalid because it
    // is required and a reset empties it, which is the browser's own verdict,
    // not stale state from the previous submit.
    expect(message.validationMessage).toBe('');
  });

  it('clears the field error state after a successful submit', async () => {
    render(() => <BasicForm errorClass='is-invalid' onSubmit={() => {}} />);
    await registered();

    const username = screen.getByTestId('username') as HTMLInputElement;
    await blur(username);
    expect(username).toHaveAttribute('aria-invalid', 'true');

    await typeInto(username, 'ada');
    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'long enough');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(screen.getByTestId('submitted')).toHaveTextContent('yes'));
    expect(username).toHaveAttribute('aria-invalid', 'false');
    expect(username).not.toHaveClass('is-invalid');
  });

  it('clears every error synchronously on form reset', async () => {
    render(() => <BasicForm />);
    await registered();

    await blur(screen.getByTestId('username'));
    expect(screen.getByTestId('error-username')).not.toBeEmptyDOMElement();

    await press(screen.getByTestId('reset'));

    expect(screen.getByTestId('error-username')).toBeEmptyDOMElement();
  });
});

describe('errorClass', () => {
  it('adds the class on failure and removes it on input', async () => {
    render(() => <BasicForm errorClass='is-invalid' />);
    await registered();

    const username = screen.getByTestId('username') as HTMLInputElement;
    await blur(username);
    expect(username).toHaveClass('is-invalid');

    await typeInto(username, 'ada');
    expect(username).not.toHaveClass('is-invalid');
  });

  it('adds no class when errorClass is omitted', async () => {
    render(() => <BasicForm />);
    await registered();

    const username = screen.getByTestId('username') as HTMLInputElement;
    await blur(username);
    expect(username.className).toBe('');
  });
});

describe('formSubmit', () => {
  it('does not call the callback while a field is invalid', async () => {
    const onSubmit = vi.fn();
    render(() => <BasicForm onSubmit={onSubmit} />);
    await registered();

    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(screen.getByTestId('error-username')).not.toBeEmptyDOMElement());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('focuses and scrolls to the first failing field', async () => {
    render(() => <BasicForm />);
    await registered();

    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'abc');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    // username registers first, so it wins the focus.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('username')));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('calls the callback with the form element once every field passes', async () => {
    const onSubmit = vi.fn();
    render(() => <BasicForm onSubmit={onSubmit} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'long enough');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toBe(screen.getByTestId('form'));
    expect(screen.getByTestId('submitted')).toHaveTextContent('yes');
  });

  it('maps an object returned from the callback onto field errors', async () => {
    render(() => <BasicForm onSubmit={() => ({ username: 'Already taken' })} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'long enough');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() =>
      expect(screen.getByTestId('error-username')).toHaveTextContent('Already taken'),
    );
    expect(screen.getByTestId('username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('submitted')).toHaveTextContent('no');
  });

  it('surfaces an error key that matches no field', async () => {
    render(() => <BasicForm onSubmit={() => ({ formError: 'Server unavailable' })} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'long enough');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() =>
      expect(screen.getByTestId('error-form')).toHaveTextContent('Server unavailable'),
    );
  });

  it('holds isSubmitting true for the duration of the callback', async () => {
    const pending = deferred();
    render(() => <BasicForm onSubmit={() => pending.promise} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    await typeInto(screen.getByTestId('message') as HTMLInputElement, 'long enough');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(screen.getByTestId('submit')).toBeDisabled());

    pending.resolve();
    await waitFor(() => expect(screen.getByTestId('submit')).not.toBeDisabled());
    expect(text(screen.getByTestId('submitted'))).toBe('yes');
  });

  it('prevents the default form navigation', async () => {
    render(() => <BasicForm />);
    await registered();

    const event = new Event('submit', { bubbles: true, cancelable: true });
    screen.getByTestId('form').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
