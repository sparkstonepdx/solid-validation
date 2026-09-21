import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { createSignal } from 'solid-js';
import { useForm, type Validator } from '../src/main';
import { asyncValidator, blur, registered, typeInto, waitFor } from './helpers';

type Fields = { field: string };

function Field(props: { validators: Validator<HTMLInputElement>[] }) {
  const { validate, errors } = useForm<Fields>();
  return (
    <>
      <input type='text' name='field' ref={validate(() => props.validators)} data-testid='field' />
      <span data-testid='error'>{errors.field}</span>
    </>
  );
}

describe('custom validators', () => {
  it('uses the message returned by a sync validator', async () => {
    render(() => <Field validators={[() => 'Nope']} />);
    await registered();

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Nope'));
  });

  it('awaits an async validator before reporting', async () => {
    const slow = asyncValidator('Taken', 20);
    render(() => <Field validators={[slow]} />);
    await registered();

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Taken'));
    expect(slow).toHaveBeenCalledTimes(1);
  });

  it('stops at the first failing validator', async () => {
    const first = vi.fn(() => 'First');
    const second = vi.fn(() => 'Second');

    render(() => <Field validators={[first, second]} />);
    await registered();

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('First'));
    expect(second).not.toHaveBeenCalled();
  });

  it('skips falsy entries so conditional validation works', async () => {
    const enabled = false;
    const conditional = vi.fn(() => 'Should not run');
    const real = vi.fn(() => undefined);

    render(() => <Field validators={[enabled && conditional, real]} />);
    await registered();

    await blur(screen.getByTestId('field'));
    await waitFor(() => expect(real).toHaveBeenCalledTimes(1));
    expect(conditional).not.toHaveBeenCalled();
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();
  });

  it('receives the element itself', async () => {
    const spy = vi.fn(() => undefined);
    render(() => <Field validators={[spy]} />);
    await registered();

    const field = screen.getByTestId('field') as HTMLInputElement;
    await typeInto(field, 'hello');
    await blur(field);

    await waitFor(() => expect(spy).toHaveBeenCalledWith(field));
  });

  it('mirrors the message onto setCustomValidity', async () => {
    render(() => <Field validators={[() => 'Bad value']} />);
    await registered();

    const field = screen.getByTestId('field') as HTMLInputElement;
    await blur(field);

    await waitFor(() => expect(field.validationMessage).toBe('Bad value'));
    expect(field.checkValidity()).toBe(false);
  });

  it('resets a stale custom validity before revalidating', async () => {
    let fail = true;
    render(() => <Field validators={[() => fail && 'Bad value']} />);
    await registered();

    const field = screen.getByTestId('field') as HTMLInputElement;
    await blur(field);
    await waitFor(() => expect(field.validationMessage).toBe('Bad value'));

    fail = false;
    await typeInto(field, 'better');
    await blur(field);

    await waitFor(() => expect(field.validationMessage).toBe(''));
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();
  });
});

describe('native constraints', () => {
  function RequiredField(props: { validators?: Validator<HTMLInputElement>[] }) {
    const { validate, errors } = useForm<Fields>();
    return (
      <>
        <input
          type='email'
          name='field'
          required
          ref={validate(() => props.validators ?? [])}
          data-testid='field'
        />
        <span data-testid='error'>{errors.field}</span>
      </>
    );
  }

  // No await: the validator loop is skipped entirely when the browser already
  // has a message, so this path never yields.
  it('takes precedence over custom validators, synchronously', async () => {
    const custom = vi.fn(() => 'Custom message');
    render(() => <RequiredField validators={[custom]} />);
    await registered();

    await blur(screen.getByTestId('field'));

    expect(custom).not.toHaveBeenCalled();
    expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();
  });

  it('hands off to custom validators once native constraints pass', async () => {
    const custom = vi.fn(() => 'Custom message');
    render(() => <RequiredField validators={[custom]} />);
    await registered();

    const field = screen.getByTestId('field') as HTMLInputElement;
    await typeInto(field, 'ada@example.com');
    await blur(field);

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Custom message'));
    expect(custom).toHaveBeenCalledTimes(1);
  });
});

describe('validator accessor', () => {
  // The accessor exists so the array can depend on reactive state. These pin
  // down when it is read: if only at registration, a condition inside it is
  // frozen at mount and flipping the signal changes nothing.
  function Conditional(props: { on: () => boolean }) {
    const { validate, errors } = useForm<Fields>();
    const alwaysFails: Validator<HTMLInputElement> = () => 'Conditional rule failed';
    return (
      <>
        <input
          type='text'
          name='field'
          ref={validate(() => [props.on() && alwaysFails])}
          data-testid='field'
        />
        <span data-testid='error'>{errors.field}</span>
      </>
    );
  }

  it('applies a rule that is switched on after the field mounts', async () => {
    const [on, setOn] = createSignal(false);
    render(() => <Conditional on={on} />);
    await registered();

    await blur(screen.getByTestId('field'));
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();

    // Signal writes are batched in Solid 2 as well, so let this one flush
    // before the blur reads it.
    setOn(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    await blur(screen.getByTestId('field'));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Conditional rule failed'),
    );
  });

  it('stops applying a rule that is switched off after the field mounts', async () => {
    const [on, setOn] = createSignal(true);
    render(() => <Conditional on={on} />);
    await registered();

    await blur(screen.getByTestId('field'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Conditional rule failed'),
    );

    setOn(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    await typeInto(screen.getByTestId('field') as HTMLInputElement, 'x');
    await blur(screen.getByTestId('field'));

    await waitFor(() => expect(screen.getByTestId('error')).toBeEmptyDOMElement());
  });
});
