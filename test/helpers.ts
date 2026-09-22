import { fireEvent, waitFor } from '@solidjs/testing-library';
import { vi } from 'vitest';

/**
 * Timing rules for this suite. Read before adding a test.
 *
 * There are exactly two places a wait is justified:
 *
 * 1. Registration. `validate` defers into a `queueMicrotask`, so a field is not
 *    in the registry during the tick it rendered in. One turn is always enough
 *    and always necessary. Use `registered()`.
 *
 * 2. Anything that runs a custom validator. `checkValid` awaits every validator
 *    in turn, so the number of microtasks scales with how far down the array the
 *    failure sits: one validator takes one turn, three take two. Never count
 *    them. Use `waitFor`, which polls until the assertion holds.
 *
 * Under Solid 1 the rest was synchronous: a native-constraint failure on blur,
 * error clearing on input, and clearing on form reset all landed in the same
 * tick as the event, and were asserted with no await as canaries.
 *
 * Solid 2 defers store writes. Those canaries fired on the port, which is what
 * they were for. Nothing observable is synchronous any more, so every assertion
 * that follows an action goes through waitFor.
 *
 * The actions below are deliberately synchronous and return nothing. Awaiting
 * one would smuggle in a microtask and hide the thing the test is checking.
 */

/** One microtask turn. The registration deferral, and nothing else. */
export const microtask = () => new Promise<void>(resolve => queueMicrotask(resolve));

/** Wait for `validate` to have registered the fields rendered so far. */
export const registered = () => microtask();

export { waitFor };

/**
 * Solid 2 batches store writes, so no assertion can follow an action in the
 * same tick. Each action dispatches its event and then lets the scheduler
 * drain, which is why they are awaited at every call site.
 */
const settle = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export async function blur(el: HTMLElement) {
  fireEvent.blur(el);
  await settle();
}

export async function typeInto(el: HTMLInputElement, value: string) {
  fireEvent.input(el, { target: { value } });
  await settle();
}

export async function submitForm(form: HTMLFormElement) {
  fireEvent.submit(form);
  await settle();
}

export async function press(el: HTMLElement) {
  fireEvent.click(el);
  await settle();
}

export const text = (el: HTMLElement) => el.textContent ?? '';

/** Passes when the value is at least `min` characters. */
export function minLength(min: number) {
  return (el: HTMLInputElement) => el.value.length < min && `Must be at least ${min} characters`;
}

/** Always passes. Pads a validator array to push the failure further down it. */
export const passes = () => undefined;

/** Resolves after a real delay, so async ordering is actually exercised. */
export function asyncValidator(message: string | undefined, delayMs = 0) {
  return vi.fn(async (_el: HTMLElement) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return message;
  });
}

/** A promise plus the handle to settle it, for pinning a callback open mid-submit. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
