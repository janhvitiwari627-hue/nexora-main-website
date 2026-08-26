import React from 'react';
import { ShieldCheck, Phone, MessageCircle, Send, Award, FileCheck2, Star } from 'lucide-react';
import { TrendingProduct } from '../types';

interface TrendingProductsProps {
  products: TrendingProduct[];
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  onOpenEnquiry: (product: TrendingProduct) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
  onNavigateToPLP?: () => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({
  products,
  isLoggedIn,
  onOpenAuth,
  onOpenEnquiry,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigateToPLP
}) => {
  return (
    <section id="products" className="py-14 bg-[#fdf8f8]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#b90064] animate-pulse"></span>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#b90064]">MARKETPLACE TRENDS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1c1b1b] tracking-tight mb-4">
              High In-Demand Products
            </h2>
            <p className="text-[15px] text-[#594047] leading-relaxed">
              Discover the most queried formulations and equipment currently trending across the Indian beauty manufacturing landscape.
            </p>
          </div>
          <div className="shrink-0">
            {onNavigateToPLP && (
              <button
                onClick={onNavigateToPLP}
                className="bg-white border-2 border-[#b90064]/10 text-[#b90064] text-[13px] font-black px-6 py-3.5 rounded-xl hover:bg-[#b90064] hover:text-white transition-all shadow-sm flex items-center gap-2 group"
              >
                <span>View Full Catalog</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )}
          </div>
        </div>

        {/* Trending Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-[#e8e8e8] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 group"
            >
              {/* Product Image */}
              <div className="relative h-64 w-full bg-[#f0edec] overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Category Pill */}
                <div className="absolute top-4 left-4 glass-panel text-[#1c1b1b] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                  {prod.category}
                </div>

                {/* Verification Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  {prod.isGstVerified && (
                    <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 flex items-center gap-1">
                      <FileCheck2 className="w-3 h-3 text-[#0050d6]" />
                      <span className="text-[9px] font-black uppercase text-[#0050d6]">GST</span>
                    </div>
                  )}
                  {prod.isIsoCertified && (
                    <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#b90064]" />
                      <span className="text-[9px] font-black uppercase text-[#b90064]">ISO</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-[#b90064] uppercase tracking-widest">{prod.supplierName}</span>
                    <span className="text-[10px] font-bold text-[#8c7077]">{prod.supplierLocation}</span>
                  </div>

                  <h3 className="text-[18px] font-black text-[#1c1b1b] leading-tight mb-4 group-hover:text-[#b90064] transition-colors">
                    {prod.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-[#f0edec] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8c7077] block uppercase font-black tracking-widest mb-1">Bulk Pricing</span>
                      <span className="text-[18px] font-black text-[#1c1b1b]">{prod.priceRange}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8c7077] block uppercase font-black tracking-widest mb-1">Min Order</span>
                      <span className="text-[14px] font-black text-[#b90064]">{prod.moq}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenEnquiry(prod)}
                      className="flex-1 bg-[#1c1b1b] text-white text-[12px] font-black py-4 rounded-xl shadow-lg hover:bg-[#b90064] transition-all uppercase tracking-widest"
                    >
                      {isLoggedIn ? 'Send Enquiry' : 'Login for Quote'}
                    </button>
                    <button
                      onClick={() => {
                        if (isLoggedIn) onCallSupplier(prod.supplierName);
                        else onOpenAuth();
                      }}
                      className="w-12 h-12 bg-[#fdf8f8] border border-[#e8e8e8] text-[#1c1b1b] rounded-xl flex items-center justify-center hover:border-[#b90064] hover:text-[#b90064] transition-all"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onWhatsAppSupplier(prod.supplierName)}
                      className="w-12 h-12 bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] rounded-xl flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
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
