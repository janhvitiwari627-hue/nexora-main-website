export const MAIN_WEBSITE_HOME_URL = "https://nexora-main-website.vercel.app/";

/**
 * Canonical, session-safe way out of every Nexora surface.
 *
 * This is deliberately a normal absolute link: it never reads browser
 * history and never calls an auth/logout API, so direct routes and restored
 * Supabase sessions behave exactly like any other cross-page navigation.
 */
export function BackToMainWebsiteButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={MAIN_WEBSITE_HOME_URL}
      aria-label="Back to Main Website"
      title="Back to Main Website"
      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#e0bec6]/60 bg-[#fde7f3] px-3 text-[11px] font-bold text-[#8e004b] shadow-sm transition-all hover:bg-[#ffd9e2] active:scale-95 ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] shrink-0"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      <span className="whitespace-nowrap">Back to Main Website</span>
    </a>
  );
}
