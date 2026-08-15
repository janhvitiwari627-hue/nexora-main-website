import React, { useState } from 'react';
import { Sparkles, Building2, MapPin, ArrowRight, ShieldCheck, Search } from 'lucide-react';
import { SupplierPartner, Product } from '../types';
import { StarRating } from '../components/StarRating';

interface BrandsViewProps {
  partners: SupplierPartner[];
  products: Product[];
  onSelectPartner: (partner: SupplierPartner) => void;
  onSelectProduct: (product: Product) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({
  partners,
  products,
  onSelectPartner,
  onSelectProduct
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredPartners = partners.filter((p) => {
    if (filterType !== 'all' && p.type.toLowerCase() !== filterType.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchLoc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFF5F8] via-[#FFF0F5] to-white border border-[#FFD6E5] rounded-3xl p-6 sm:p-10 mb-8 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#FFD1E3] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Verified Brand Directory
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
          Luxury Brands & Direct Formulators
        </h1>
        <p className="text-xs sm:text-sm text-[#737373] mt-1.5 max-w-2xl">
          Connect directly with European and North American luxury cosmetics formulators, high-tech hair tool engineers, and organic spa skincare houses.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white border border-[#EAE5DE] rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search brands or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'Wholesaler', 'Manufacturer', 'Distributor'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-[#B8005A] text-white shadow-xs'
                  : 'bg-[#FAFAFA] text-[#525252] border border-[#EAE5DE] hover:border-[#B8005A]'
              }`}
            >
              {type === 'all' ? 'All Types' : `${type}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => {
          const partnerItems = products.filter((p) => p.supplierId === partner.id);
          return (
            <div
              key={partner.id}
              onClick={() => onSelectPartner(partner)}
              className="bg-[#FCFCFA] hover:bg-white border border-[#EAE5DE] hover:border-[#B8005A]/40 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE0EC] border border-[#FFD6E5] text-[#B8005A] flex items-center justify-center font-extrabold text-lg group-hover:scale-105 transition-transform shadow-xs">
                    {partner.initials}
                  </div>

                  {partner.verified ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#B8005A] uppercase tracking-wider bg-[#FFF0F5] border border-[#FFB8D2] px-2.5 py-1 rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8005A] animate-pulse" />
                      NEXORA VERIFIED
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-[#52525B] uppercase tracking-wider bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-1 rounded-full">
                      FREE SUPPLIER
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors">
                  {partner.name}
                </h3>

                {/* Rating */}
                <div className="mt-2 flex items-center">
                  <StarRating rating={partner.rating} reviewsCount={partner.reviewsCount} size="xs" compact={true} />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#737373] mt-2">
                  <span className="flex items-center gap-1 font-semibold text-[#4A4A4A]">
                    <Building2 className="w-3.5 h-3.5 text-[#8E8E93]" />
                    {partner.type}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-[#4A4A4A]">
                    <MapPin className="w-3.5 h-3.5 text-[#B8005A]" />
                    {partner.location}
                  </span>
                </div>

                <p className="text-xs text-[#525252] mt-3 line-clamp-2 leading-relaxed">
                  {partner.description}
                </p>

                {/* Response Rate */}
                <div className="mt-4 pt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md font-semibold">
                    ⚡ {partner.responseRate} response
                  </span>
                  <span className="text-xs text-[#737373]">
                    {partnerItems.length} Products
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {partner.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold text-[#525252] bg-[#F5F2EB] group-hover:bg-[#FFF0F5] group-hover:text-[#B8005A] px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-6 pt-4 border-t border-[#F5F2EB] flex items-center justify-between text-xs font-bold text-[#B8005A]">
                <span>View Full Line Sheet</span>
                <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

