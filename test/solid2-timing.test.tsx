import { render, screen } from '@solidjs/testing-library';
import { Show, createEffect, createSignal, flush } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { useForm, type Validator } from '../src/main';
import {
  blur,
  deferred,
  microtask,
  passes,
  press,
  registered,
  submitForm,
  typeInto,
  waitFor,
} from './helpers';

/**
 * Scheduling, ownership and async-ordering contracts, aimed at the Solid 2 port.
 *
 * The library's own deferral is a single `queueMicrotask` in `validate`. Every
 * other wait in this suite comes from Solid's scheduler or from a validator's
 * own promise. These tests separate the two so a port can tell which one moved.
 */

type Fields = Record<string, string>;

describe('registration deferral', () => {
  it('needs exactly one microtask, no more', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => {
      api = useForm<Fields>();
      const { validate } = api;
      return <input name='a' required ref={validate()} data-testid='a' />;
    });

    expect(api.getFieldValue('a')).toBeUndefined();

    await microtask();

    // One turn is enough: the field is live and a native failure lands
    // synchronously from here.
    expect(api.getFieldValue('a')).toBe('');
    await blur(screen.getByTestId('a'));
    expect(screen.getByTestId('a')).toHaveAttribute('aria-invalid', 'true');
  });

  it('registers a field that mounts long after the form did', async () => {
    const [visible, setVisible] = createSignal(false);

    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <Show when={visible()}>
            <input name='late' required ref={validate()} data-testid='late' />
          </Show>
          <span data-testid='error'>{errors.late}</span>
        </>
      );
    });
    await registered();

    setVisible(true);
    await registered();

    await blur(screen.getByTestId('late'));
    expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();
  });

  it('re-registers a fresh element when a field unmounts and mounts again', async () => {
    const [visible, setVisible] = createSignal(true);

    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <Show when={visible()}>
            <input name='toggle' required ref={validate()} data-testid='toggle' />
          </Show>
          <span data-testid='error'>{errors.toggle}</span>
        </>
      );
    });
    await registered();

    const first = screen.getByTestId('toggle');
    setVisible(false);
    flush();
    setVisible(true);
    await registered();

    const second = screen.getByTestId('toggle');
    expect(second).not.toBe(first);

    await blur(second);
    expect(second).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();
  });

  it('keeps only the last registration when two fields share a name', async () => {
    render(() => {
      const { validate, errors, submit } = useForm<Fields>();
      return (
        <>
          <input name='dup' required ref={validate()} data-testid='first' />
          <input name='dup' required ref={validate()} data-testid='second' />
          <span data-testid='error'>{errors.dup}</span>
          <button data-testid='go' onClick={() => submit(() => {})}>
            Go
          </button>
        </>
      );
    });
    await registered();

    await press(screen.getByTestId('go'));

    // Both write to the same store key, but only the survivor of the registry
    // is checked on submit, and it is the one that gets focused.
    await waitFor(() => expect(screen.getByTestId('error')).not.toBeEmptyDOMElement());
    expect(document.activeElement).toBe(screen.getByTestId('second'));
    expect(screen.getByTestId('first')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

describe('validator depth', () => {
  // The number of microtasks scales with how far down the array the failure
  // sits, because every entry is awaited in turn. Any test that counts turns is
  // wrong today and will be differently wrong after the port.
  function pad(count: number): Validator<HTMLInputElement>[] {
    return [...Array.from({ length: count }, () => passes), () => 'Failed'];
  }

  for (const depth of [0, 3, 8]) {
    it(`surfaces a failure sitting behind ${depth} passing validators`, async () => {
      render(() => {
        const { validate, errors } = useForm<Fields>();
        return (
          <>
            <input name='f' ref={validate(() => pad(depth))} data-testid='f' />
            <span data-testid='error'>{errors.f}</span>
          </>
        );
      });
      await registered();

      await blur(screen.getByTestId('f'));
      await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Failed'));
    });
  }
});

describe('ownership and disposal', () => {
  it('works with no reactive owner at all', async () => {
    const { validate, submit, errors } = useForm<Fields>();
    const callback = vi.fn();

    const input = document.createElement('input');
    input.name = 'loose';
    input.required = true;
    document.body.append(input);
    validate()(input);
    await registered();

    await submit(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(errors.loose).toBeTruthy();

    input.value = 'filled';
    await submit(callback);
    expect(callback).toHaveBeenCalledTimes(1);

    input.remove();
  });

  it('survives a blur that arrives after the component unmounted', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input name='a' required ref={validate()} data-testid='a' />
          <span>{errors.a}</span>
        </>
      );
    });
    await registered();

    const field = screen.getByTestId('a') as HTMLInputElement & { onblur: any };
    unmount();

    // Invoked directly rather than through fireEvent so a rejection is caught
    // here instead of surfacing as an unhandled rejection.
    await expect(field.onblur(new FocusEvent('blur'))).resolves.toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
  });

  it('survives a submit callback that settles after the component unmounted', async () => {
    const pending = deferred();
    let api!: ReturnType<typeof useForm<Fields>>;

    const { unmount } = render(() => {
      api = useForm<Fields>();
      const { validate, errors, isSubmitted } = api;
      return (
        <>
          <input name='a' ref={validate()} data-testid='a' />
          <span>{errors.a}</span>
          <span>{isSubmitted() ? 'yes' : 'no'}</span>
        </>
      );
    });
    await registered();

    const running = api.submit(() => pending.promise);
    unmount();
    pending.resolve();

    await expect(running).resolves.toBe(true);
  });
});

describe('async ordering', () => {
  it('writes a stale error when a slow validator resolves after the user has typed', async () => {
    // The input handler clears an error only if one is already present. A
    // validator still in flight has not written yet, so its result lands after
    // the user has already moved on. Recorded as current behaviour, not as
    // something the tests endorse.
    const slow: Validator<HTMLInputElement> = async el => {
      const seen = el.value;
      await new Promise(resolve => setTimeout(resolve, 30));
      return seen.length < 5 ? 'Too short' : undefined;
    };

    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input name='f' ref={validate(() => [slow])} data-testid='f' />
          <span data-testid='error'>{errors.f}</span>
        </>
      );
    });
    await registered();

    const field = screen.getByTestId('f') as HTMLInputElement;
    await typeInto(field, 'abc');
    await blur(field);

    await typeInto(field, 'long enough now');
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Too short'));
    expect(field.value).toBe('long enough now');
  });

  it('settles on the later result when two blurs overlap', async () => {
    let call = 0;
    const staggered: Validator<HTMLInputElement> = async () => {
      const n = ++call;
      await new Promise(resolve => setTimeout(resolve, n === 1 ? 60 : 10));
      return `Result ${n}`;
    };

    render(() => {
      const { validate, errors } = useForm<Fields>();
      return (
        <>
          <input name='f' ref={validate(() => [staggered])} data-testid='f' />
          <span data-testid='error'>{errors.f}</span>
        </>
      );
    });
    await registered();

    const field = screen.getByTestId('f');
    await blur(field);
    await blur(field);

    // The second check finishes first, then the first overwrites it. Whichever
    // way a new scheduler orders these, the store must not be left empty.
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Result 1'));
    expect(call).toBe(2);
  });

  it('propagates a rejecting validator out of validateField', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => {
      api = useForm<Fields>();
      const { validate } = api;
      return (
        <input
          name='f'
          ref={validate(() => [
            () => {
              throw new Error('validator exploded');
            },
          ])}
          data-testid='f'
        />
      );
    });
    await registered();

    await expect(api.validateField('f')).rejects.toThrow('validator exploded');
  });
});

describe('submission signals', () => {
  it('flips isSubmitted before releasing isSubmitting', async () => {
    // Regression guard for 1.5.1. An observer must never see a settled form
    // reporting neither submitting nor submitted.
    const seen: Array<[boolean, boolean]> = [];
    const pending = deferred();

    render(() => {
      const { formSubmit, validate, isSubmitting, isSubmitted } = useForm<Fields>();
      createEffect(
        () => [isSubmitting(), isSubmitted()] as [boolean, boolean],
        pair => {
          seen.push(pair);
        },
      );
      return (
        <form ref={formSubmit(() => pending.promise)} data-testid='form'>
          <input name='a' ref={validate()} data-testid='a' />
        </form>
      );
    });
    await registered();

    await submitForm(screen.getByTestId('form') as HTMLFormElement);
    await waitFor(() => expect(seen).toContainEqual([true, false]));

    pending.resolve();
    await waitFor(() => expect(seen.at(-1)).toEqual([false, true]));

    const startedSubmitting = seen.findIndex(([submitting]) => submitting);
    const afterStart = seen.slice(startedSubmitting);
    expect(afterStart).not.toContainEqual([false, false]);
  });

  it('never sets isSubmitting when validation blocks the submit', async () => {
    const seen: boolean[] = [];

    render(() => {
      const { formSubmit, validate, isSubmitting } = useForm<Fields>();
      createEffect(
        () => isSubmitting(),
        value => {
          seen.push(value);
        },
      );
      return (
        <form ref={formSubmit(() => {})} data-testid='form'>
          <input name='a' required ref={validate()} data-testid='a' />
        </form>
      );
    });
    await registered();

    await submitForm(screen.getByTestId('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByTestId('a')).toHaveAttribute('aria-invalid', 'true'));

    expect(seen).toEqual([false]);
  });

  it('handles two submits started before the first one settles', async () => {
    const first = deferred();
    const second = deferred();
    const queue = [first, second];
    const callback = vi.fn(() => queue.shift()!.promise);
    let api!: ReturnType<typeof useForm<Fields>>;

    render(() => {
      api = useForm<Fields>();
      const { validate } = api;
      return <input name='a' ref={validate()} data-testid='a' />;
    });
    await registered();

    const a = api.submit(callback);
    const b = api.submit(callback);

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(2));
    first.resolve();
    second.resolve();

    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
  });
});
