import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const MAIN_WEBSITE_HOME_URL = 'https://nexora-main-website.vercel.app/';

/** Absolute navigation only: no history traversal and no auth side effects. */
export const BackToMainWebsiteButton: React.FC = () => (
  <a
    href={MAIN_WEBSITE_HOME_URL}
    aria-label="Back to Main Website"
    title="Back to Main Website"
    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#e0bec6]/60 bg-[#fde7f3] px-3 text-[11px] font-bold text-[#8e004b] shadow-sm transition-all hover:bg-[#ffd9e2] active:scale-95"
  >
    <ArrowLeft aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
    <span className="whitespace-nowrap">Back to Main Website</span>
  </a>
);

export const GlobalAppHeader: React.FC = () => (
  <header className="nexora-global-app-header" aria-label="Global navigation">
    <BackToMainWebsiteButton />
  </header>
);
