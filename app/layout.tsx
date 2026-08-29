import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora Jaipur - Premium Beauty Tech",
  description: "Discover Jaipur's verified salons, premium beauty services, and seamless bookings on Nexora.",
  other: {
    "codex-preview": "development",
    // Default (dark). ThemeToggle + the head script below keep this in sync
    // with the active theme; color-scheme itself is CSS-driven per theme.
    "theme-color": "#0a0a0f",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

/**
 * No-FOUC theme bootstrap — MUST run before first paint.
 * Default is dark (per product decision); a saved "nexora-theme-v2" value in
 * localStorage wins. (The key was bumped from "nexora-theme" once so every
 * browser that had accidentally stored "light" during the preview resets to
 * the dark default.) Runs before the stylesheet link so the very first
 * paint already uses the right theme.
 */
const themeBootstrapScript = `(function(){try{var s=localStorage.getItem("nexora-theme-v2");var d=s?s==="dark":true;var c=document.documentElement.classList;d?c.add("dark"):c.remove("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"#0a0a0f":"#fffdfc");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* ✅ Default dark mode — keep any comment OUTSIDE the html tag line:
       an inline comment right after the opening tag creates a whitespace
       text node as <html>'s first child, which React flags as a hydration
       error ("whitespace text nodes cannot be a child of <html>").
       The `dark` class is toggled by app/components/premium/ThemeToggle. */
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout: this <head> link is the single font load for every route (next/font is deliberately not used in this vinext/Vite build). */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
