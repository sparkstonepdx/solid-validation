import { announceRoutes } from '@solidjs/prerender';
import { Title } from '@solidjs/meta';
import { Errored, Loading, createSignal } from 'solid-js';
import Sidebar from './components/Sidebar';
import VersionSwitcher from './components/VersionSwitcher';
import { Router } from './router';
import './styles/app.scss';

export default function App() {
  // Tells the build which static pages exist, so a page nothing links to is
  // still rendered. A no-op in the browser.
  announceRoutes(Router);

  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  return (
    <Router>
      {props => (
        <>
          <Title>solid-validation</Title>
          <header class='site-header'>
            <button
              type='button'
              id='sidebar-toggle'
              aria-expanded={sidebarOpen()}
              aria-controls='site-sidebar'
              onClick={() => setSidebarOpen(open => !open)}>
              Menu
            </button>
            <a href={import.meta.env.BASE_URL} class='semantic'>
              <strong>solid-validation</strong>
            </a>
            <nav class='flex site-links' aria-label='Site'>
              <VersionSwitcher />
              <a href='https://www.npmjs.com/package/@sparkstone/solid-validation'>npm</a>
              <a href='https://github.com/sparkstonepdx/solid-validation'>GitHub</a>
            </nav>
          </header>
          <div class='site-body'>
            <Sidebar open={sidebarOpen()} />
            <main class='site-main'>
              <Errored
                fallback={(error, reset) => (
                  <div role='alert' class='alert alert-error'>
                    <h1>Something broke on this page</h1>
                    <p>{String(error())}</p>
                    <button type='button' onClick={reset}>
                      Try again
                    </button>
                  </div>
                )}>
                <Loading fallback={<p>Loading…</p>}>{props.children}</Loading>
              </Errored>
              <footer class='site-footer'>
                <small>
                  <a href='https://www.npmjs.com/package/@sparkstone/solid-validation'>npm</a> ·{' '}
                  <a href='https://github.com/sparkstonepdx/solid-validation'>GitHub</a> · MIT
                </small>
              </footer>
            </main>
          </div>
        </>
      )}
    </Router>
  );
}
