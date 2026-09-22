import { useLocation } from '@solidjs/router';
import { For } from 'solid-js';

const sections = [
  {
    title: 'Start here',
    links: [
      { href: '/v2', label: 'Overview' },
      { href: '/v2/quick-start', label: 'Quick start' },
      { href: '/v2/migrating', label: 'Migrating from v1' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { href: '/v2/guides/validators', label: 'Writing validators' },
      { href: '/v2/guides/server-errors', label: 'Server-side errors' },
      { href: '/v2/guides/outside-forms', label: 'Outside a form' },
      { href: '/v2/guides/child-components', label: 'Child components' },
      { href: '/v2/guides/pocketbase', label: 'PocketBase' },
    ],
  },
  {
    title: 'API',
    links: [
      { href: '/v2/api/use-form', label: 'useForm' },
      { href: '/v2/api/types', label: 'Types' },
    ],
  },
  { title: 'Help', links: [{ href: '/v2/troubleshooting', label: 'Troubleshooting' }] },
];

export default function Sidebar(props: { open: boolean }) {
  // Pages serves under the repo name, so every href carries the base. The
  // crawler follows them, which is why its output nests under that prefix.
  const base = import.meta.env.BASE_URL;
  const to = (href: string) => `${base}${href.replace(/^\//, '')}`;
  const location = useLocation();
  const isCurrent = (href: string) =>
    location.pathname.replace(/\/$/, '') === to(href).replace(/\/$/, '');

  return (
    <aside id='site-sidebar' class='site-sidebar' data-open={props.open}>
      <nav aria-label='Documentation'>
      <For each={sections}>
        {section => (
          <>
            <p class='sidebar-group'>{section.title}</p>
            <ul>
              <For each={section.links}>
                {link => (
                  <li>
                    <a href={to(link.href)} aria-current={isCurrent(link.href) ? 'page' : undefined}>
                      {link.label}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </>
        )}
      </For>
      </nav>
    </aside>
  );
}
