import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarNavigation from './components/SidebarNavigation.jsx';
import { useAuth } from './hooks/useAuth.js';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import { Landing } from './pages/Home.jsx';

// App shell: persistent sidebar (drawer on small screens) + routed page in <Outlet />.
export default function App() {
  const { isLoading, isAuthenticated, error } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  if (isLoading) return <LoadingSpinner label="Starting Text-to-Learn" className="min-h-screen justify-center" />;

  if (!isAuthenticated)
    return (
      <main className="min-h-screen">
        {error && <ErrorMessage error={error} title="Login failed" className="mx-auto mt-6 max-w-3xl" />}
        <Landing />
      </main>
    );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17.5rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-pen-soft" aria-label="Open navigation" aria-expanded={open} aria-controls="sidebar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="font-display font-extrabold">Text-to-Learn</span>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-[17.5rem] border-r border-line bg-sheet transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarNavigation onNavigate={() => setOpen(false)} />
      </aside>

      <main id="main" className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
