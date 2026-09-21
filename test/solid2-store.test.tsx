import { render, screen } from '@solidjs/testing-library';
import { For, createEffect, createMemo } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { useForm } from '../src/main';
import { blur, press, registered, submitForm, text, typeInto, waitFor } from './helpers';

/**
 * Contract tests for the `errors` store, aimed squarely at the Solid 2 port.
 *
 * The library writes to the store in three different shapes:
 *
 *   setErrors({ [name]: message })      merge, in checkValid
 *   setErrors({ [name]: undefined })    merge with undefined, in oninput
 *   setErrors(errors => ({ ...all }))   function updater, in clearErrors
 *
 * Solid 2's draft-first setters change what the second and third shapes mean.
 * These tests pin the observable result of each one so the port has something
 * to fail against, rather than discovering it in a consumer's form.
 */

type Fields = Record<string, string>;

describe('key lifecycle', () => {
  function Keys(props: { onSubmit?: () => any }) {
    const { formSubmit, validate, errors } = useForm<Fields>();
    return (
      <form ref={formSubmit(props.onSubmit ?? (() => {}))} data-testid='form'>
        <input name='a' required ref={validate()} data-testid='a' />
        <input name='b' required ref={validate()} data-testid='b' />
        <span data-testid='keys'>{Object.keys(errors).join(',')}</span>
        <span data-testid='count'>{createMemo(() => Object.keys(errors).length)()}</span>
        <span data-testid='has-a'>{'a' in errors ? 'yes' : 'no'}</span>
        <span data-testid='error-a'>{errors.a}</span>
        <button type='reset' data-testid='reset'>
          Reset
        </button>
      </form>
    );
  }

  it('starts with no keys at all', async () => {
    render(() => <Keys />);
    await registered();

    expect(text(screen.getByTestId('keys'))).toBe('');
    expect(text(screen.getByTestId('has-a'))).toBe('no');
  });

  it('adds a key when a field first fails', async () => {
    render(() => <Keys />);
    await registered();

    await blur(screen.getByTestId('a'));

    expect(text(screen.getByTestId('keys'))).toBe('a');
    expect(text(screen.getByTestId('has-a'))).toBe('yes');
  });

  // The current setter writes `undefined`, and Solid 1's store turns that into a
  // delete. A draft-first setter could just as easily leave the key present with
  // an undefined value, which changes Object.keys, `in`, and every consumer
  // iterating the store.
  it('removes the key entirely when the error clears, rather than leaving undefined', async () => {
    render(() => <Keys />);
    await registered();

    const a = screen.getByTestId('a') as HTMLInputElement;
    await blur(a);
    expect(text(screen.getByTestId('keys'))).toBe('a');

    await typeInto(a, 'ada');

    expect(text(screen.getByTestId('keys'))).toBe('');
    expect(text(screen.getByTestId('has-a'))).toBe('no');
    expect(text(screen.getByTestId('count'))).toBe('0');
  });

  it('clears only the field that was typed into', async () => {
    render(() => <Keys />);
    await registered();

    await blur(screen.getByTestId('a'));
    await blur(screen.getByTestId('b'));
    expect(text(screen.getByTestId('keys'))).toBe('a,b');

    await typeInto(screen.getByTestId('a') as HTMLInputElement, 'ada');

    expect(text(screen.getByTestId('keys'))).toBe('b');
  });

  // clearErrors uses the function-updater form, which is the shape that changes
  // most under draft-first setters.
  it('removes every key through the function updater on reset', async () => {
    render(() => <Keys />);
    await registered();

    await blur(screen.getByTestId('a'));
    await blur(screen.getByTestId('b'));

    await press(screen.getByTestId('reset'));

    expect(text(screen.getByTestId('keys'))).toBe('');
    expect(text(screen.getByTestId('count'))).toBe('0');
  });

  it('removes every key on a successful submit', async () => {
    render(() => <Keys />);
    await registered();

    await blur(screen.getByTestId('a'));
    expect(text(screen.getByTestId('keys'))).toBe('a');

    await typeInto(screen.getByTestId('a') as HTMLInputElement, 'ada');
    await typeInto(screen.getByTestId('b') as HTMLInputElement, 'bee');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(text(screen.getByTestId('keys'))).toBe(''));
  });
});

describe('reactivity of keys that do not exist yet', () => {
  // Reading errors.form before anything has ever written it has to subscribe,
  // or a form-level server error will never render. Solid 1 stores track absent
  // keys; this is the single most load-bearing assumption in the library.
  it('renders a key that had never been set at the time of first read', async () => {
    render(() => {
      const { formSubmit, validate, errors } = useForm<Fields>();
      return (
        <form ref={formSubmit(() => ({ form: 'Service unavailable' }))} data-testid='form'>
          <input name='a' ref={validate()} data-testid='a' />
          <span data-testid='error-form'>{errors.form}</span>
        </form>
      );
    });
    await registered();

    expect(screen.getByTestId('error-form')).toBeEmptyDOMElement();

    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() =>
      expect(screen.getByTestId('error-form')).toHaveTextContent('Service unavailable'),
    );
  });

  it('reacts to a new key appearing inside an iteration of the store', async () => {
    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input name='a' required ref={validate()} data-testid='a' />
          <input name='b' required ref={validate()} data-testid='b' />
          <ul data-testid='list'>
            <For each={Object.keys(errors)}>{key => <li>{key}</li>}</For>
          </ul>
        </>
      );
    });
    await registered();

    expect(screen.getByTestId('list').children).toHaveLength(0);

    await blur(screen.getByTestId('a'));
    expect(screen.getByTestId('list').children).toHaveLength(1);

    await blur(screen.getByTestId('b'));
    expect(screen.getByTestId('list').children).toHaveLength(2);
  });
});

describe('write coalescing', () => {
  it('does not notify when a field fails twice with the same message', async () => {
    const runs = vi.fn();

    render(() => {
      const { validate, errors } = useForm<Fields>();
      createEffect(
          () => errors.field,
          () => runs(),
        );
      return <input name='field' ref={validate(() => [() => 'Same message'])} data-testid='field' />;
    });
    await registered();
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(1));

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(2));

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(screen.getByTestId('field')).toHaveAttribute('aria-invalid', 'true'));

    expect(runs).toHaveBeenCalledTimes(2);
  });

  it('notifies once when the message changes', async () => {
    const runs = vi.fn();
    let message = 'First';

    render(() => {
      const { validate, errors } = useForm<Fields>();
      createEffect(
          () => errors.field,
          () => runs(),
        );
      return <input name='field' ref={validate(() => [() => message])} data-testid='field' />;
    });
    await registered();
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(1));

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(2));

    message = 'Second';
    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(runs).toHaveBeenCalledTimes(3));
  });
});

describe('field names that stress the proxy', () => {
  /**
   * Names come straight off the DOM, so nothing stops a form from having a field
   * called `length` or `toString`. Solid 1's store proxy handles most of them,
   * with two divergences recorded below. Both are proxy-implementation details
   * rather than library logic, so both are worth re-running against Solid 2.
   */
  function nameProbe(fieldName: string) {
    let errors!: Record<string, any>;
    render(() => {
      const form = useForm<Fields>();
      errors = form.errors as Record<string, any>;
      const { validate } = form;
      return <input name={fieldName} required ref={validate()} data-testid='field' />;
    });
    return () => errors;
  }

  const ordinary = ['length', 'name', 'value', '0', 'user.email', 'Ünïcødé'];

  for (const fieldName of ordinary) {
    it(`stores, renders and clears an error under "${fieldName}"`, async () => {
      render(() => {
        const { validate, errors } = useForm<Fields>();
        return (
          <>
            <input name={fieldName} required ref={validate()} data-testid='field' />
            <span data-testid='error'>{errors[fieldName]}</span>
          </>
        );
      });
      await registered();

      const field = screen.getByTestId('field') as HTMLInputElement;
      await blur(field);
      expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();

      await typeInto(field, 'value');
      expect(screen.getByTestId('error')).toBeEmptyDOMElement();
    });
  }

  // Divergence 1: these names resolve to an inherited Object.prototype method
  // until something writes over them. The store itself handles them correctly,
  // but the pre-write read is a function, which is why they are asserted against
  // the store rather than through JSX interpolation.
  const shadowed = ['toString', 'hasOwnProperty', 'valueOf'];

  for (const fieldName of shadowed) {
    it(`stores and clears "${fieldName}" even though it shadows a prototype method`, async () => {
      const errors = nameProbe(fieldName);
      await registered();

      expect(typeof errors()[fieldName]).toBe('function');

      await blur(screen.getByTestId('field'));
      expect(typeof errors()[fieldName]).toBe('string');
      expect(Object.keys(errors())).toContain(fieldName);

      await typeInto(screen.getByTestId('field') as HTMLInputElement, 'value');
      expect(Object.keys(errors())).not.toContain(fieldName);
    });
  }

  // Divergence 2: `constructor` is passed straight through to the target, so the
  // write is silently dropped. The field is still marked invalid in the DOM, so
  // the failure mode is an invalid input with no reachable message.
  // Solid 1.9.4 stored this key, 1.9.15 dropped it, and Solid 2 stores it again
  // as an ordinary key. Pinned here so the next change is noticed.
  it('stores an error under "constructor" like any other key', async () => {
    const errors = nameProbe('constructor');
    await registered();

    await blur(screen.getByTestId('field'));

    expect(typeof errors().constructor).toBe('string');
    expect(Object.keys(errors())).toContain('constructor');
    expect(screen.getByTestId('field')).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps a dotted name as one literal key rather than a nested path', async () => {
    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input name='user.email' required ref={validate()} data-testid='field' />
          <span data-testid='keys'>{Object.keys(errors).join(',')}</span>
          <span data-testid='nested'>{(errors as any).user ? 'nested' : 'flat'}</span>
        </>
      );
    });
    await registered();

    await blur(screen.getByTestId('field'));

    expect(text(screen.getByTestId('keys'))).toBe('user.email');
    expect(text(screen.getByTestId('nested'))).toBe('flat');
  });

  it('registers an input with no name under the empty string', async () => {
    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input required ref={validate()} data-name='ignored' data-testid='field' />
          <span data-testid='keys'>{Object.keys(errors).join('|')}</span>
        </>
      );
    });
    await registered();

    await blur(screen.getByTestId('field'));

    // `element.name` is '' rather than undefined, so the `??` fallback to
    // data-name never fires for a real input.
    expect(text(screen.getByTestId('keys'))).toBe('');
    expect(screen.getByTestId('field')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('server errors versus field errors', () => {
  it('overwrites a live field error with the server message for the same key', async () => {
    render(() => {
      const { formSubmit, validate, errors } = useForm<Fields>();
      return (
        <form ref={formSubmit(() => ({ email: 'Already registered' }))} data-testid='form'>
          <input type='email' name='email' required ref={validate()} data-testid='email' />
          <span data-testid='error'>{errors.email}</span>
        </form>
      );
    });
    await registered();

    await typeInto(screen.getByTestId('email') as HTMLInputElement, 'ada@example.com');
    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Already registered'),
    );
  });

  it('treats an empty object from the callback as failure, not success', async () => {
    render(() => {
      const { formSubmit, validate, errors, isSubmitted } = useForm<Fields>();
      return (
        <form ref={formSubmit(() => ({}))} data-testid='form'>
          <input name='a' ref={validate()} data-testid='a' />
          <span data-testid='submitted'>{isSubmitted() ? 'yes' : 'no'}</span>
          <span data-testid='keys'>{Object.keys(errors).join(',')}</span>
        </form>
      );
    });
    await registered();

    await submitForm(screen.getByTestId('form') as HTMLFormElement);

    await waitFor(() => expect(text(screen.getByTestId('submitted'))).toBe('no'));
    expect(text(screen.getByTestId('keys'))).toBe('');
  });
});
