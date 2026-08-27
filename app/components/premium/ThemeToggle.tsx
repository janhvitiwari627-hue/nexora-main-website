'use client';

import { useEffect, useState } from 'react';

/**
 * Dark/light theme switch for the premium homepage.
 *
 * The entire dark theme in globals.css is scoped under `html.dark`; this
 * toggle flips that class. Preference persists in localStorage under
 * "nexora-theme-v2" ("dark" | "light") — the no-FOUC head script in
 * app/layout.tsx applies it before first paint, so this component only
 * needs to sync its icon after mount.
 *
 * The mobile browser chrome colour (meta[name=theme-color]) follows the
 * active theme too.
 */
export default function ThemeToggle() {
  // SSR renders <html className="dark"> — start matched to avoid a
  // hydration mismatch, then sync with the real DOM state after mount.
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('nexora-theme-v2', next ? 'dark' : 'light');
    } catch {
      /* Storage unavailable (private mode) — theme still applies for this visit. */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next ? '#0a0a0f' : '#fffdfc');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Light theme mein switch karein' : 'Dark theme mein switch karein'}
      aria-pressed={dark}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        /* Sun — click for light mode */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon — click for dark mode */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
