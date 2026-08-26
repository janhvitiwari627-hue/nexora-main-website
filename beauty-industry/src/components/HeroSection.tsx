import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface HeroSectionProps {
  onSearch?: (query: string, locationOrCategory: string) => void;
  onTabChange?: (tab: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, onTabChange }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Categories');

  const trendingTags = [
    'Hyaluronic Acid',
    'Glass Packaging',
    'Vegan Formulations',
    'Peptide Serum',
    'GMP Certified',
    'Low MOQ <100'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, category);
    }
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    if (onSearch) {
      onSearch(tag, category);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <section className="relative min-h-[640px] md:min-h-[720px] flex items-center justify-center px-4 md:px-8 mb-12 overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FAF3F5] to-[#FDF8F8]">
      {/* Editorial Background Base & Lighting */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Photorealistic High-End Backdrop */}
        <img
          className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out opacity-90"
          alt="Luxury beauty skincare and cosmetics backdrop"
          src="/src/assets/images/luxury_hero_bg_1786976539255.jpg"
          referrerPolicy="no-referrer"
        />

        {/* Linear Warm-Ivory to Blush-Pink Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FFFDF8]/80 via-[#FAF1F5]/50 to-[#FCEEF3]/75 mix-blend-normal"></div>

        {/* Left Edge Editorial Beauty Asset Highlight */}
        <div className="absolute -left-12 bottom-8 hidden lg:block w-72 h-72 rounded-full bg-[#B90064]/5 blur-3xl pointer-events-none"></div>

        {/* Right Edge Editorial Beauty Asset Highlight */}
        <div className="absolute -right-12 top-12 hidden lg:block w-80 h-80 rounded-full bg-[#E6007E]/5 blur-3xl pointer-events-none"></div>

        {/* Seamless Soft Edge Fades */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FDF8F8] to-transparent"></div>
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FFFDF9]/60 to-transparent"></div>
      </div>

      {/* Left Flanking Beauty Asset (Serum Bottle) - Gracefully positioned only on spacious desktop viewports */}
      <div className="hidden xl:flex absolute left-4 2xl:left-12 top-1/2 -translate-y-1/2 z-10 flex-col items-center pointer-events-none select-none transition-all duration-500">
        <div className="relative group transition-transform duration-700 hover:scale-105">
          {/* Ambient Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#B90064]/10 to-transparent blur-xl"></div>
          
          <div className="relative w-36 2xl:w-48 h-52 2xl:h-64 rounded-2xl overflow-hidden border border-white/80 shadow-lg bg-white/40 backdrop-blur-xs">
            <img
              src="/src/assets/images/hero_left_serum_1786976976626.jpg"
              alt="Luxury cosmetic serum bottle and botanical accent"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Subtle Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#500037]/40 via-transparent to-white/10"></div>
            
            {/* Micro Badge */}
            <div className="absolute bottom-2.5 inset-x-2.5 bg-white/90 backdrop-blur-md rounded-lg py-1 px-2 border border-white/60 shadow-2xs text-center">
              <span className="block text-[9px] 2xl:text-[10px] font-extrabold uppercase tracking-widest text-[#B90064]">
                OEM Formulation
              </span>
              <span className="block text-[10.5px] 2xl:text-[11px] font-semibold text-[#1C1B1B] truncate">
                Bio-Peptide Serums
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Content with Dedicated Radial Glow Backdrop */}
      <div className="relative z-10 w-full max-w-xl md:max-w-2xl lg:max-w-3xl 2xl:max-w-4xl my-4 sm:my-6 md:my-8 px-1">
        {/* Soft Radial Ambient Glow centered precisely behind content and search */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[340px] md:h-[420px] bg-radial from-white via-white/85 to-transparent blur-2xl -z-10 pointer-events-none"></div>

        {/* Hero Glass Panel */}
        <div className="glass-panel rounded-2xl p-5 sm:p-7 md:p-10 2xl:p-12 editorial-shadow text-center border border-white/80 bg-white/80 backdrop-blur-md transition-all duration-300">
          <h1 className="font-serif text-[26px] sm:text-[32px] md:text-[40px] lg:text-[44px] font-bold text-[#500037] mb-3 md:mb-5 mx-auto max-w-2xl leading-[1.2] tracking-tight">
            Source Premium Beauty & Personal Care Manufacturers
          </h1>
          <p className="text-[13.5px] sm:text-[15px] md:text-[16px] text-[#534249] mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
            Connect with verified global suppliers for OEM, private label, and ready-to-ship luxury cosmetics.
          </p>

          {/* Search Container with Focused Glow */}
          <div className="relative w-full">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#B90064]/15 via-[#E6007E]/10 to-[#B90064]/15 blur-sm -z-10 opacity-70"></div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col md:flex-row gap-2 bg-white p-2 rounded-xl border border-[#E8DFE3] shadow-md relative w-full"
            >
              <div className="flex-1 flex items-center px-3 py-2.5 min-h-[44px] border-b md:border-b-0 md:border-r border-[#E8DFE3] relative">
                <Search className="text-[#8D8087] mr-2.5 w-4.5 h-4.5 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, suppliers, or ingredients..."
                  className="w-full bg-transparent border-none focus:ring-0 text-[13.5px] sm:text-[14.5px] text-[#1e1a1d] placeholder-[#8D8087] p-0 outline-none pr-6"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear search"
                    className="p-1 text-[#8D8087] hover:text-[#B90064] transition-colors rounded-full hover:bg-[#FAF1F5] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center px-3 py-2.5 min-h-[44px]">
                <SlidersHorizontal className="text-[#8D8087] mr-2 w-4 h-4 shrink-0" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[13.5px] sm:text-[14px] text-[#534249] cursor-pointer outline-none font-medium pr-6 w-full md:w-auto"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Color Cosmetics">Color Cosmetics</option>
                  <option value="Haircare">Haircare</option>
                  <option value="Salon Equipment">Salon Equipment</option>
                  <option value="OEM / Private Label">OEM / Private Label</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-[#500037] hover:bg-[#53103B] active:scale-[0.99] text-white font-semibold text-[14px] px-6 sm:px-8 py-3 rounded-lg transition-all md:w-auto w-full shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Trending Tags */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#8D8087] uppercase tracking-wider">
              Trending:
            </span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="text-[11.5px] sm:text-[12px] font-medium text-[#500037] hover:underline decoration-1 underline-offset-2 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Flanking Beauty Asset (Luxury Cream Jar) - Gracefully positioned only on spacious desktop viewports */}
      <div className="hidden xl:flex absolute right-4 2xl:right-12 top-1/2 -translate-y-1/2 z-10 flex-col items-center pointer-events-none select-none transition-all duration-500">
        <div className="relative group transition-transform duration-700 hover:scale-105">
          {/* Ambient Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-bl from-[#E6007E]/10 to-transparent blur-xl"></div>
          
          <div className="relative w-36 2xl:w-48 h-52 2xl:h-64 rounded-2xl overflow-hidden border border-white/80 shadow-lg bg-white/40 backdrop-blur-xs">
            <img
              src="/src/assets/images/hero_right_cream_1786976999531.jpg"
              alt="Luxury cosmetic cream jar and beauty tool"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Subtle Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#500037]/40 via-transparent to-white/10"></div>
            
            {/* Micro Badge */}
            <div className="absolute bottom-2.5 inset-x-2.5 bg-white/90 backdrop-blur-md rounded-lg py-1 px-2 border border-white/60 shadow-2xs text-center">
              <span className="block text-[9px] 2xl:text-[10px] font-extrabold uppercase tracking-widest text-[#B90064]">
                Private Label
              </span>
              <span className="block text-[10.5px] 2xl:text-[11px] font-semibold text-[#1C1B1B] truncate">
                Barrier Cream Jars
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
