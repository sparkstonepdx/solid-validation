import { Select } from '@kobalte/core/select';
import { Show, createEffect, createSignal } from 'solid-js';
import versions from '../../../../versions.json';

type Version = { id: string; label: string; path: string; prerelease?: boolean };

const here = 'v2';
const compiled = versions.versions as Version[];

/**
 * Each version is a standalone site, so switching is a full page navigation.
 * The list comes from versions.json at the docs root, which every version
 * reads, so adding a version is a one-file change.
 */
export default function VersionSwitcher() {
  // Starts as the list this build was compiled with, then re-reads the
  // published manifest so a version released later still appears here without
  // rebuilding this site.
  const [all, setAll] = createSignal<Version[]>(compiled);
  const current = () => all().find(v => v.id === here) ?? all()[0];
  const [mounted, setMounted] = createSignal(false);

  // Kobalte does not hydrate cleanly, so it renders only after mount behind a
  // matching placeholder. Not guarded by isServer: a reactive node that exists
  // on one side only desynchronises the hydration key namespace.
  createEffect(
    () => undefined,
    () => {
      setMounted(true);
      fetch(`${versions.root}versions.json`)
        .then(response => (response.ok ? response.json() : null))
        .then(data => data?.versions?.length && setAll(data.versions))
        .catch(() => {});
    },
  );

  return (
    <Show
      when={mounted()}
      fallback={
        <span class='version-trigger'>
          {current().label}
          <span class='version-chevron' aria-hidden='true'>▾</span>
        </span>
      }>
      <Select<Version>
        options={all()}
        optionValue='id'
        optionTextValue='label'
        value={current()}
        onChange={next => {
          if (!next || next.id === here) return;
          window.location.href = next.path;
        }}
        itemComponent={props => (
          <Select.Item item={props.item} class='menu-item'>
            <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
          </Select.Item>
        )}>
        <Select.Trigger class='version-trigger' aria-label='Documentation version'>
          <Select.Value<Version>>{state => state.selectedOption().label}</Select.Value>
          <Select.Icon class='version-chevron'>▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content class='dropdown-content'>
            <Select.Listbox class='menu' />
          </Select.Content>
        </Select.Portal>
      </Select>
    </Show>
  );
}
