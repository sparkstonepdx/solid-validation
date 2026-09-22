import { SegmentedControl } from '@kobalte/core/segmented-control';
import { useForm } from '@sparkstone/solid-validation';
import { For, createSignal } from 'solid-js';

type Fields = { plan: string };

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const plans = ['Hobby', 'Studio', 'Agency'];

/**
 * A control that is not a form field at all: the group is registered with
 * data-name and checked by submit(), which is called from a click handler
 * rather than a form's submit event.
 */
export default function ImperativeSubmitDemo() {
  const [plan, setPlan] = createSignal('');
  const { validate, submit, errors, isSubmitting, isSubmitted } = useForm<Fields>();

  const planChosen = () => !plan() && 'Choose a plan to continue';

  return (
    <div>
      <p>
        <small>
          Press Continue with nothing chosen and it refuses. Pick a plan and it runs for 400ms.
        </small>
      </p>

      <fieldset ref={validate(() => [planChosen])} data-name='plan'>
        <legend>Plan</legend>
        <SegmentedControl class='segmented' value={plan()} onChange={setPlan}>
          <SegmentedControl.Indicator class='segmented-indicator' />
          <For each={plans}>
            {option => (
              <SegmentedControl.Item value={option} class='segmented-item'>
                <SegmentedControl.ItemInput />
                <SegmentedControl.ItemLabel>{option}</SegmentedControl.ItemLabel>
              </SegmentedControl.Item>
            )}
          </For>
        </SegmentedControl>
      </fieldset>
      <small class='docs-error'>{errors.plan}</small>

      <footer>
        <button
          type='button'
          class='btn btn-primary'
          disabled={isSubmitting()}
          onClick={() => submit(() => wait(400))}>
          {isSubmitting() ? 'Continuing' : 'Continue'}
        </button>
        {isSubmitted() && <ins>Subscribed to {plan()}</ins>}
      </footer>
    </div>
  );
}
