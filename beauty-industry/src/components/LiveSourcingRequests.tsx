import React from 'react';
import { Activity, Clock, MapPin, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import { RFQItem } from '../types';

interface LiveSourcingRequestsProps {
  rfqs: RFQItem[];
  onSubmitQuote: (rfq: RFQItem) => void;
  onOpenRFQModal: () => void;
}

export const LiveSourcingRequests: React.FC<LiveSourcingRequestsProps> = ({
  rfqs,
  onSubmitQuote,
  onOpenRFQModal
}) => {
  return (
    <section className="py-12 bg-[#fcf9f8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header with Live Ticker Pulse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#e8e8e8] rounded-full shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e6007e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#b90064]"></span>
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#b90064]">LIVE SOURCING REQUESTS</span>
            </div>
            <span className="text-[13px] text-[#594047] hidden md:inline">Real-time buyer requirements submitted across India</span>
          </div>

          <button
            onClick={onOpenRFQModal}
            className="text-[13px] font-bold text-[#b90064] hover:text-[#8e004b] flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Post a Requirement</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Live Requests Horizontal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white rounded-xl border border-[#e8e8e8] p-5 flex flex-col justify-between card-hover-fx"
            >
              <div>
                {/* Meta header: Location, Verified Buyer & Time */}
                <div className="flex items-center justify-between text-[11px] text-[#8c7077] mb-2.5">
                  <span className="flex items-center gap-1 font-medium text-[#594047]">
                    <MapPin className="w-3 h-3 text-[#b90064]" />
                    {rfq.buyerLocation}
                  </span>
                  <span className="flex items-center gap-1 text-[#8c7077]">
                    <Clock className="w-3 h-3" />
                    {rfq.timeAgo}
                  </span>
                </div>

                {/* RFQ Title & Category */}
                <div className="mb-2">
                  <span className="inline-block text-[10px] font-semibold text-[#0050d6] bg-[#dbe1ff] px-2 py-0.5 rounded-full mb-1.5">
                    {rfq.category}
                  </span>
                  <h3 className="text-[14px] font-bold text-[#1c1b1b] line-clamp-2 leading-snug">
                    {rfq.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[12px] text-[#594047] line-clamp-3 leading-relaxed mb-4">
                  {rfq.description}
                </p>
              </div>

              {/* Bottom Specs & Action */}
              <div className="pt-3 border-t border-[#f0edec] space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#8c7077]">Required Quantity:</span>
                  <span className="font-bold text-[#1c1b1b]">{rfq.quantityRequired}</span>
                </div>

                {rfq.targetPrice && (
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#8c7077]">Target Price:</span>
                    <span className="font-semibold text-[#0050d6]">{rfq.targetPrice}</span>
                  </div>
                )}

                <button
                  onClick={() => onSubmitQuote(rfq)}
                  className="w-full bg-[#fde7f3] hover:bg-[#b90064] text-[#b90064] hover:text-white text-[12px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quote</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
