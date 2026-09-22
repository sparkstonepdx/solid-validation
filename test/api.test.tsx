import { render, screen } from '@solidjs/testing-library';
import { Show, createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { useForm } from '../src/main';
import { minLength, press, registered, typeInto, waitFor } from './helpers';

type Fields = { username: string; email: string; customField: string };

describe('validateField', () => {
  it('returns false and reports the error for an invalid field', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    function Form() {
      api = useForm<Fields>();
      const { validate, errors } = api;
      return (
        <>
          <input name='username' required ref={validate()} data-testid='username' />
          <span data-testid='error'>{errors.username}</span>
        </>
      );
    }
    render(() => <Form />);
    await registered();

    expect(await api.validateField('username')).toBe(false);
    expect(screen.getByTestId('error')).not.toBeEmptyDOMElement();
    expect(document.activeElement).toBe(screen.getByTestId('username'));
  });

  it('returns true for a valid field', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    function Form() {
      api = useForm<Fields>();
      const { validate } = api;
      return <input name='username' required ref={validate()} data-testid='username' />;
    }
    render(() => <Form />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    expect(await api.validateField('username')).toBe(true);
  });

  it('returns false for a field that was never registered', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => {
      api = useForm<Fields>();
      return <span />;
    });
    await registered();

    expect(await api.validateField('username')).toBe(false);
  });
});

describe('getFieldValue', () => {
  it('reads the live value of a registered field', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    function Form() {
      api = useForm<Fields>();
      const { validate } = api;
      return <input name='username' ref={validate()} data-testid='username' />;
    }
    render(() => <Form />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    expect(api.getFieldValue('username')).toBe('ada');
  });

  it('returns undefined for an unknown field', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => {
      api = useForm<Fields>();
      return <span />;
    });
    await registered();

    expect(api.getFieldValue('username')).toBeUndefined();
  });
});

describe('validate', () => {
  it('registers a child-owned field through a ref prop', async () => {
    function EmailField(props: { validate: ReturnType<typeof useForm<Fields>>['validate'] }) {
      return (
        <input
          type='email'
          name='email'
          required
          ref={props.validate(() => [minLength(6)])}
          data-testid='email'
        />
      );
    }

    const callback = vi.fn();

    function Parent() {
      const { validate, errors, submit } = useForm<Fields>();
      return (
        <>
          <EmailField validate={validate} />
          <span data-testid='error'>{errors.email}</span>
          <button data-testid='go' onClick={() => submit(callback)}>
            Go
          </button>
        </>
      );
    }

    render(() => <Parent />);
    await registered();

    await typeInto(screen.getByTestId('email') as HTMLInputElement, 'a@b.co');
    await press(screen.getByTestId('go'));

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();
  });

  it('applies the validators passed to it', async () => {
    function Parent() {
      const { validate, errors, submit } = useForm<Fields>();
      return (
        <>
          <input name='email' ref={validate(() => [minLength(6)])} data-testid='email' />
          <span data-testid='error'>{errors.email}</span>
          <button data-testid='go' onClick={() => submit(() => {})}>
            Go
          </button>
        </>
      );
    }

    render(() => <Parent />);
    await registered();

    await typeInto(screen.getByTestId('email') as HTMLInputElement, 'abc');
    await press(screen.getByTestId('go'));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Must be at least 6 characters'),
    );
  });
});

describe('submit result', () => {
  function Form(props: { ready: (api: ReturnType<typeof useForm<Fields>>) => void }) {
    const api = useForm<Fields>();
    props.ready(api);
    const { validate } = api;
    return <input name='username' required ref={validate()} data-testid='username' />;
  }

  it('reports false when validation blocks the submit', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => <Form ready={a => (api = a)} />);
    await registered();

    expect(await api.submit(() => {})).toBe(false);
  });

  it('reports true when the callback returns nothing', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => <Form ready={a => (api = a)} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    expect(await api.submit(() => {})).toBe(true);
  });

  it('reports false when the callback returns errors', async () => {
    let api!: ReturnType<typeof useForm<Fields>>;
    render(() => <Form ready={a => (api = a)} />);
    await registered();

    await typeInto(screen.getByTestId('username') as HTMLInputElement, 'ada');
    expect(await api.submit(() => ({ username: 'Already taken' }))).toBe(false);
  });
});

describe('submit without a form', () => {
  it('validates a non-input element keyed by data-name', async () => {
    const callback = vi.fn();

    function Widget() {
      const { validate, errors, submit } = useForm<Fields>();
      return (
        <>
          <div ref={validate(() => [() => 'Pick at least one'])} data-name='customField' />
          <span data-testid='error'>{errors.customField}</span>
          <button data-testid='go' onClick={() => submit(callback)}>
            Go
          </button>
        </>
      );
    }

    render(() => <Widget />);
    await registered();

    await press(screen.getByTestId('go'));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Pick at least one'),
    );
    expect(callback).not.toHaveBeenCalled();
  });

  it('forwards the payload to the callback', async () => {
    const callback = vi.fn();

    function Widget() {
      const { submit } = useForm<Fields>();
      return (
        <button data-testid='go' onClick={() => submit(callback, { id: 7 })}>
          Go
        </button>
      );
    }

    render(() => <Widget />);
    await registered();

    await press(screen.getByTestId('go'));

    await waitFor(() => expect(callback).toHaveBeenCalledWith({ id: 7 }));
  });

  it('drops fields that have been unmounted rather than blocking submit', async () => {
    const callback = vi.fn();
    const [visible, setVisible] = createSignal(true);

    function Widget() {
      const { validate, submit } = useForm<Fields>();
      return (
        <>
          <Show when={visible()}>
            <input name='username' required ref={validate()} data-testid='username' />
          </Show>
          <button data-testid='go' onClick={() => submit(callback)}>
            Go
          </button>
        </>
      );
    }

    render(() => <Widget />);
    await registered();

    setVisible(false);
    await press(screen.getByTestId('go'));

    await waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
  });
});
