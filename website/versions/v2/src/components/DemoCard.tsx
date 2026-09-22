import type { ParentProps } from 'solid-js';

/** The live-example card from the @sparkstone/css docs: a bordered frame around a padded surface. */
export default function DemoCard(props: ParentProps) {
  return (
    <div class='demo'>
      <div class='demo-surface'>{props.children}</div>
    </div>
  );
}
