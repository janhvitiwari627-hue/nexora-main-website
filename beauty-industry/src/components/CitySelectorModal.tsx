import React, { useState } from 'react';
import { X, MapPin, Check, Search, Globe, Sparkles, TrendingUp, Award } from 'lucide-react';
import { CITIES } from '../data/mockData';
import { UserProfile } from '../types';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  currentUser?: UserProfile | null;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  currentUser
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter cities based on search
  const filtered = CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  // Get recommendation score & metadata
  const getCityRecommendation = (city: string) => {
    if (city === 'All Locations') {
      return {
        score: -1,
        reason: 'Browse all available markets',
        tag: 'Global',
        demand: 100,
        colorClass: 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100',
        badgeColor: 'bg-slate-200/60 text-slate-800'
      };
    }

    const isUserCity = currentUser?.city && city.toLowerCase() === currentUser.city.toLowerCase();
    
    let baseScore = 50;
    let reason = 'Active Regional Market';
    let tag = 'General';
    let demand = 50;
    let colorClass = 'bg-slate-50/50 hover:bg-slate-50 text-slate-700 border-slate-100';
    let badgeColor = 'bg-slate-100 text-slate-700';

    switch (city) {
      case 'Mumbai':
        baseScore = 98;
        demand = 98;
        tag = 'Cosmetics & Glamour';
        reason = 'Bollywood Hub • Highest Order Volume';
        colorClass = 'bg-[#FFF5FA] hover:bg-[#FFEBF5] text-[#BE185D] border-[#FBCFE8]';
        badgeColor = 'bg-[#FCE7F3] text-[#BE185D]';
        break;
      case 'Delhi':
        baseScore = 95;
        demand = 95;
        tag = 'Bulk Logistics';
        reason = 'National Distribution Center • Direct Highways';
        colorClass = 'bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#1D4ED8] border-[#BFDBFE]';
        badgeColor = 'bg-[#DBEAFE] text-[#1D4ED8]';
        break;
      case 'Jaipur':
        baseScore = 92;
        demand = 92;
        tag = 'Organic Botanicals';
        reason = 'Spas & Natural Formulation Center';
        colorClass = 'bg-[#FFFBEB] hover:bg-[#FFF7D6] text-[#B25E00] border-[#FFE3B3]';
        badgeColor = 'bg-[#FEF3C7] text-[#B25E00]';
        break;
      case 'Bengaluru':
        baseScore = 88;
        demand = 88;
        tag = 'Salon Tech & Tools';
        reason = 'Tech-enabled Premium Salons & Devices';
        colorClass = 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#047857] border-[#A7F3D0]';
        badgeColor = 'bg-[#D1FAE5] text-[#047857]';
        break;
      case 'Pune':
        baseScore = 82;
        demand = 82;
        tag = 'Clinical Skincare';
        reason = 'Dermatology Clinics & Medical Formulation';
        colorClass = 'bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6D28D9] border-[#DDD6FE]';
        badgeColor = 'bg-[#EDE9FE] text-[#6D28D9]';
        break;
      case 'Chennai':
        baseScore = 78;
        demand = 78;
        tag = 'Traditional Wellness';
        reason = 'Herbal Oils & Elite Spa Distribution';
        colorClass = 'bg-[#FFF5F5] hover:bg-[#FFE4E4] text-[#B91C1C] border-[#FCA5A5]';
        badgeColor = 'bg-[#FEE2E2] text-[#B91C1C]';
        break;
      case 'Kolkata':
        baseScore = 75;
        demand = 75;
        tag = 'Bridal Artistry';
        reason = 'High-end Bridal Makeup & Styling Hubs';
        colorClass = 'bg-[#F0FDFA] hover:bg-[#E6FDF9] text-[#0F766E] border-[#99F6E4]';
        badgeColor = 'bg-[#CCFBF1] text-[#0F766E]';
        break;
    }

    // Apply personalized boost if user registered there
    let score = baseScore;
    if (isUserCity) {
      score += 150; // Massively prioritize user's registered location
      reason = '✨ Registered Office Location • Recommended for You';
      colorClass = 'bg-gradient-to-br from-[#FFF0F5] to-white hover:from-[#FFF0F5] hover:to-[#FFE1EE] text-[#B8005A] border-[#FFD1E3] shadow-xs';
      badgeColor = 'bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3]/40 font-bold';
    } else if (selectedCity === city) {
      score += 40; // Boost current selection
    }

    return { score, reason, tag, demand, colorClass, badgeColor };
  };

  // Sort cities (excluding 'All Locations') by recommendation score for empty search mode
  const actualCities = CITIES.filter(c => c !== 'All Locations');
  const recommendedCities = [...actualCities]
    .map(city => ({ name: city, ...getCityRecommendation(city) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Top 3 recommendations

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#EDEDED] relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F0E6EC] bg-gradient-to-r from-[#FFF5F8] to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFF0F5] border border-[#FFD1E3] flex items-center justify-center text-[#B8005A]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E1E1E]">Select Market Region</h3>
              <p className="text-[11px] text-[#737373]">Discover regional supply centers & localized stock</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search region or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 pt-2 overflow-y-auto space-y-5">
          
          {/* Recommended Section (Visible when idle/empty search) */}
          {!search && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B8005A]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B8005A] animate-pulse" />
                  Recommended For You
                </span>
                <span className="text-[10px] text-[#8E8E93] font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#047857]" /> Dynamic Demand Matching
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {recommendedCities.map((rec) => {
                  const isSelected = selectedCity === rec.name;
                  return (
                    <button
                      key={`rec-${rec.name}`}
                      onClick={() => {
                        onSelectCity(rec.name);
                        onClose();
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${rec.colorClass}`}
                    >
                      {/* Decorative background shape */}
                      <div className="absolute right-0 top-0 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="font-bold text-sm tracking-tight">{rec.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rec.badgeColor}`}>
                            {rec.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-extrabold">{rec.demand}% Demand</span>
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#B8005A] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-black/10" />
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] font-medium opacity-90 leading-tight relative z-10 flex items-center gap-1">
                        <Award className="w-3 h-3 shrink-0" /> {rec.reason}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Cities Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#594047] pl-1">
              {!search ? 'All Regional Markets' : `Matching Results (${filtered.length})`}
            </h4>

            <div className="grid grid-cols-1 gap-1.5">
              {filtered.map((city) => {
                const isSelected = selectedCity === city;
                const recData = getCityRecommendation(city);
                return (
                  <button
                    key={city}
                    onClick={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#FFF0F5] text-[#B8005A] border-[#FFD1E3]'
                        : 'hover:bg-[#F5F5F5] text-[#1E1E1E] border-transparent bg-[#FAFAFA]/60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#FFD1E3]/50 text-[#B8005A]' : 'bg-[#EDEDED] text-[#8E8E93]'
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{city}</div>
                        {city !== 'All Locations' && (
                          <div className="text-[10px] text-[#8E8E93] font-medium">
                            {recData.tag} • Demand {recData.demand}%
                          </div>
                        )}
                      </div>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#B8005A]" />}
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-8 bg-[#FAFAFA] rounded-2xl border border-dashed border-[#E5E5E5] space-y-1.5">
                  <p className="text-xs text-[#1E1E1E] font-bold">No markets found</p>
                  <p className="text-[10px] text-[#737373]">Try searching for other major cities or states</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
