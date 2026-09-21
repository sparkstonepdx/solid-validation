import { createSignal, createStore, StoreSetter } from 'solid-js';

type Falsy = false | 0 | '' | null | undefined | void;
type MaybePromise<T> = T | Promise<T>;

export type OnFormSubmitResult<T> = MaybePromise<Falsy | Partial<T>>;

type ValidatorResponse = MaybePromise<string | Falsy>;

export type Validator<Element> = Falsy | ((el: Element) => ValidatorResponse);

type ValidatedElement = HTMLElement & { name: string };

type OnFormSubmit<ErrorFields extends Object, Payload> = (
  el: Payload,
) => OnFormSubmitResult<ErrorFields>;

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      formSubmit: OnFormSubmit<any, HTMLFormElement>;
      validate: boolean | Validator<any>[];
    }
  }
}

function checkValid<ErrorFields extends Object>(
  { element, validators = [] }: { element: HTMLInputElement; validators: Validator<unknown>[] },
  setErrors: StoreSetter<Partial<ErrorFields>>,
  errorClass?: string,
) {
  return async () => {
    element.setCustomValidity?.('');
    element.checkValidity?.();

    let message = element.validationMessage;
    if (!message) {
      for (const validator of validators) {
        if (!validator) continue;
        const text = await validator(element);
        if (text) {
          message = text;
          element.setCustomValidity?.(text);
          break;
        }
      }
    }
    if (message) {
      errorClass && element.classList.toggle(errorClass, true);
      element.setAttribute('aria-invalid', 'true');
      setErrors(draft => {
        let name = element.name ?? element.dataset.name;
        draft[name] = message;
      });
    }
    return message;
  };
}

export function useForm<ErrorFields extends Object>({ errorClass = '' } = {}) {
  const [errors, setErrors] = createStore<Partial<ErrorFields>>({});
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [isSubmitted, setIsSubmitted] = createSignal(false);
  const fields: Partial<Record<keyof ErrorFields, { element: HTMLInputElement; validators: any }>> =
    {};

  const validate =
    <Element extends ValidatedElement>(accessor: () => Falsy | Validator<Element>[] = () => {}) =>
    (ref: Element) => {
      queueMicrotask(() => {
        let name = ref.name ?? ref.dataset.name;
        let config;
        fields[name] = config = {
          element: ref,
          get validators() {
            const accessorValue = accessor();
            return Array.isArray(accessorValue) ? accessorValue : [];
          },
        };
        ref.onblur = () => {
          setIsSubmitted(false);
          return checkValid(config, setErrors, errorClass)();
        };
        ref.oninput = () => {
          setIsSubmitted(false);
          setErrors(draft => {
            delete draft[name];
          });
          ref.setAttribute('aria-invalid', 'false');
          errorClass && ref.classList.toggle(errorClass, false);
        };
      });
    };

  /**
   * Validate a field based on name
   * returns true if the field is valid
   **/
  async function validateField(fieldName: keyof ErrorFields): Promise<boolean> {
    const field = fields[fieldName];
    if (!field) return false;
    let error = await checkValid(field, setErrors, errorClass)();
    if (field.element.validationMessage || error) {
      field.element.focus();
      field.element.scrollIntoView({ behavior: 'smooth' });
    }
    return !error;
  }

  function getFieldValue(fieldName: keyof ErrorFields) {
    const field = fields[fieldName];
    return field?.element.value;
  }

  async function submit<Payload>(callback: OnFormSubmit<ErrorFields, Payload>, ref?: Payload) {
    let errored = false;

    for (const k in fields) {
      const field = fields[k];
      if (!field) continue;
      let error = await checkValid(field, setErrors, errorClass)();
      if (!errored && (field.element.validationMessage || error)) {
        field.element.focus();
        field.element.scrollIntoView({ behavior: 'smooth' });
        if (document.contains(field.element)) {
          errored = true;
        } else {
          delete fields[k];
        }
      }
    }
    if (errored) return false;
    setIsSubmitting(true);
    let callbackResult = await callback(ref);
    if (callbackResult instanceof Object) {
      errored = true;
      for (const name in callbackResult) {
        if (!(name in fields)) continue;
        fields[name]!.element.setAttribute('aria-invalid', 'true');
      }
      setErrors(draft => {
        Object.assign(draft, callbackResult);
      });
    } else {
      clearErrors();
      setIsSubmitted(true);
    }
    setIsSubmitting(false);
    return !errored;
  }

  function clearErrors() {
    for (const key in fields) {
      const element = fields[key]?.element;
      if (!element) continue;
      element.setAttribute('aria-invalid', 'false');
      errorClass && element.classList.toggle(errorClass, false);
      element.setCustomValidity?.('');
    }

    setErrors(draft => {
      for (const field in draft) {
        delete draft[field];
      }
    });
  }

  const formSubmit =
    (callback: OnFormSubmit<ErrorFields, HTMLFormElement> = () => {}) =>
    (ref: HTMLFormElement) => {
      setIsSubmitted(false);

      ref.setAttribute('novalidate', '');

      ref.onsubmit = async e => {
        e.preventDefault();

        await submit(callback, ref);
      };

      ref.onreset = () => {
        clearErrors();
      };
    };

  return {
    validate,
    formSubmit,
    submit,
    errors,
    isSubmitting,
    isSubmitted,
    validateField,
    getFieldValue,
  };
}
