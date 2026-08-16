import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const MAIN_WEBSITE_HOME_URL = 'https://nexora-main-website.vercel.app/';

/** Absolute navigation only: no history traversal and no auth side effects. */
export const BackToMainWebsiteButton: React.FC = () => (
  <a
    href={MAIN_WEBSITE_HOME_URL}
    aria-label="Back to Main Website"
    title="Back to Main Website"
    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#E0BEC6]/60 bg-[#FDE7F3] px-3 text-[11px] font-bold text-[#8E004B] shadow-sm transition-all hover:bg-[#FFD9E2] active:scale-95"
  >
    <ArrowLeft aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
    <span className="whitespace-nowrap">Back to Main Website</span>
  </a>
);
