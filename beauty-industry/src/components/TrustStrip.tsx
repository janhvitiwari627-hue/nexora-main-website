import React from 'react';
import { ShieldCheck, Sparkles, MessageSquare, FileSpreadsheet } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Verified Suppliers',
      desc: 'GST, ISO & facility audited beauty manufacturers & distributors.'
    },
    {
      icon: Sparkles,
      title: '100% B2B Beauty Only',
      desc: 'Specialized exclusively for salon owners, brands, dermatologists & retailers.'
    },
    {
      icon: MessageSquare,
      title: 'Direct Enquiries',
      desc: 'Connect directly with certified production managers without middlemen.'
    },
    {
      icon: FileSpreadsheet,
      title: 'RFQ & Structured Quotes',
      desc: 'Post volume requirements and compare competitive price breakdowns.'
    }
  ];

  return (
    <section className="py-6 border-y border-[#e8e8e8] bg-white">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[#1c1b1b]">{pillar.title}</h3>
                  <p className="text-[12px] text-[#594047] leading-relaxed mt-0.5">{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
