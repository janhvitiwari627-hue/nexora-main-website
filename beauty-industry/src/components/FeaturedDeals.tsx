import React from 'react';
import { ShieldCheck, Phone, MessageCircle, Send, Clock, Tag } from 'lucide-react';
import { DealProduct } from '../types';

interface FeaturedDealsProps {
  deals: DealProduct[];
  onOpenEnquiry: (product: DealProduct) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const FeaturedDeals: React.FC<FeaturedDealsProps> = ({
  deals,
  onOpenEnquiry,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  return (
    <section className="py-14 bg-white border-t border-[#e8e8e8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#b90064]">BULK SOURCING DISCOUNTS</span>
              <span className="text-[10px] font-bold bg-[#fde7f3] text-[#b90064] px-2 py-0.5 rounded-full">TIERED SAVINGS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1b1b] mt-1 tracking-tight">
              Featured B2B Deals
            </h2>
          </div>
          <p className="text-[13px] text-[#594047]">
            Factory-direct contracts with volume price breaks and sample guarantees.
          </p>
        </div>

        {/* Featured Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="bg-[#fcf9f8] rounded-2xl border border-[#e8e8e8] overflow-hidden flex flex-col justify-between card-hover-fx"
            >
              {/* Image & Discount Badge */}
              <div className="relative h-48 w-full bg-[#f0edec] overflow-hidden">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Discount Badge */}
                <div className="absolute top-3 left-3 bg-[#b90064] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{deal.discountPercentage}% OFF</span>
                </div>

                {/* Bulk Tier Pill */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#1c1b1b] text-[11px] font-bold px-2.5 py-1 rounded-md border border-[#e8e8e8] shadow-2xs">
                  {deal.bulkTierLabel}
                </div>

                {/* Estimated Delivery Ribbon */}
                <div className="absolute bottom-2 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#ffd9e2]" />
                  <span>{deal.estimatedDelivery}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  
                  {/* Supplier & Verification */}
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-semibold text-[#594047] flex items-center gap-1">
                      {deal.supplierName}
                      {deal.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                      )}
                    </span>
                    <span className="text-[#8c7077]">{deal.supplierLocation}</span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-[15px] font-bold text-[#1c1b1b] line-clamp-2 leading-snug mb-3">
                    {deal.title}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {deal.tags.map((t) => (
                      <span key={t} className="text-[10px] font-medium bg-white border border-[#e8e8e8] text-[#594047] px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Pricing Tiers & MOQs */}
                <div className="pt-3 border-t border-[#e8e8e8] space-y-3">
                  
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#8c7077] line-through mr-1.5">{deal.originalPrice}</span>
                      <span className="text-[18px] font-extrabold text-[#b90064]">{deal.dealPrice}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#8c7077] block">MOQ Requirement</span>
                      <span className="text-[12px] font-bold text-[#1c1b1b]">{deal.moq}</span>
                    </div>
                  </div>

                  {/* B2B Action Buttons Row: Enquiry (Primary), Call, WhatsApp */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    
                    {/* Primary Send Enquiry Button (3 cols) */}
                    <button
                      onClick={() => onOpenEnquiry(deal)}
                      className="col-span-3 bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold py-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Get Best Price</span>
                    </button>

                    {/* Direct Call Button (1 col) */}
                    <button
                      onClick={() => onCallSupplier(deal.supplierName)}
                      title="Call Supplier"
                      className="col-span-1 bg-white hover:bg-[#f7f2f2] border border-[#e8e8e8] text-[#594047] hover:text-[#1c1b1b] rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    {/* WhatsApp Button (1 col) */}
                    <button
                      onClick={() => onWhatsAppSupplier(deal.supplierName)}
                      title="Chat on WhatsApp"
                      className="col-span-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors flex items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
