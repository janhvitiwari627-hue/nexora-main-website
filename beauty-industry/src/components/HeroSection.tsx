import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  Sparkles, 
  MapPin, 
  Building2, 
  Package, 
  ArrowRight, 
  X, 
  Clock, 
  Trash2, 
  Scissors, 
  Palette, 
  Brush, 
  Hand, 
  Flower2, 
  Heart, 
  PenTool, 
  Armchair, 
  Wrench, 
  ShieldCheck, 
  Flame, 
  Filter, 
  CornerDownLeft,
  Check
} from 'lucide-react';
import { CITIES, MOCK_PRODUCTS, MOCK_PARTNERS, CATEGORIES } from '../data/mockData';
import { CategoryId, Product, SupplierPartner } from '../types';

interface HeroSectionProps {
  onSearch: (query: string, scope: 'all' | 'products' | 'brands' | 'suppliers', city?: string, category?: CategoryId | 'all') => void;
  selectedCity?: string;
  setSelectedCity?: (city: string) => void;
  onOpenCitySelector?: () => void;
  onSelectCategory?: (catId: CategoryId) => void;
}

const PRESET_POPULAR_QUERIES = [
  'Peptide Rich Formula Cream',
  'Ionic Salon Dryer X2',
  'Pro Master Brush Set',
  'Caviar Repair Hair Mask',
  'DermaGlow Clinical Skincare',
  'Hydraulic Treatment Spa Bed',
  'Hyaluronic Multi-Molecular Serum',
  'Micro-Pigment Cosmetic Ink',
  'Backbar Botanical Shampoo Gallon',
  'LED Light Therapy Facial Mask',
  'AeroPro Salon Equipment',
  'Organic Essential Massage Oils',
  'Long-Wear Salon Gel Polish',
  'Mumbai Beauty Imports',
  'Global Glamour Cosmetics Supply'
];

const TRENDING_INDIA_SEARCHES = [
  { term: 'Peptide Rich Anti-Aging Cream', volume: '24.5k searches', growth: '+34%' },
  { term: 'Ionic Salon Hair Dryer X2', volume: '18.2k searches', growth: '+28%' },
  { term: 'Hydraulic Treatment Spa Bed', volume: '15.9k searches', growth: '+41%' },
  { term: 'DermaGlow Clinical Serum', volume: '14.1k searches', growth: '+19%' },
  { term: 'Wholesale Botanical Shampoo', volume: '12.8k searches', growth: '+22%' },
  { term: 'Bridal HD Makeup Pro Palette', volume: '11.4k searches', growth: '+37%' },
  { term: 'Professional UV Gel Polish Set', volume: '9.6k searches', growth: '+15%' },
  { term: 'Mumbai Beauty Distributor Hub', volume: '8.3k searches', growth: '+18%' }
];

const CATEGORY_IMAGES: Record<string, string> = {
  all: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
  skincare: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80',
  haircare: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=300&q=80',
  haircolor: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&q=80',
  makeup: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80',
  nails: 'https://images.unsplash.com/photo-1632345031435-8727f6c97d34?auto=format&fit=crop&w=300&q=80',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80',
  massage: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=300&q=80',
  tattoo: 'https://images.unsplash.com/photo-1598371839606-f1c42f039d52?auto=format&fit=crop&w=300&q=80',
  furniture: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80',
  tools: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=300&q=80'
};

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  skincare: <Sparkles className="w-3.5 h-3.5" />,
  haircare: <Scissors className="w-3.5 h-3.5" />,
  haircolor: <Palette className="w-3.5 h-3.5" />,
  makeup: <Brush className="w-3.5 h-3.5" />,
  nails: <Hand className="w-3.5 h-3.5" />,
  spa: <Flower2 className="w-3.5 h-3.5" />,
  massage: <Heart className="w-3.5 h-3.5" />,
  tattoo: <PenTool className="w-3.5 h-3.5" />,
  furniture: <Armchair className="w-3.5 h-3.5" />,
  tools: <Wrench className="w-3.5 h-3.5" />
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  selectedCity = 'Mumbai',
  setSelectedCity,
  onOpenCitySelector,
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'products' | 'brands' | 'suppliers'>('all');
  const [activeCategoryTag, setActiveCategoryTag] = useState<CategoryId | 'all'>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Recent searches saved in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_recent_searches');
      return saved ? JSON.parse(saved) : ['Peptide Serums', 'Ionic Dryer', 'Salon Furniture', 'DermaGlow'];
    } catch {
      return ['Peptide Serums', 'Ionic Dryer', 'Salon Furniture', 'DermaGlow'];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scopes: Array<{ id: 'all' | 'products' | 'brands' | 'suppliers'; label: string }> = [
    { id: 'all', label: 'All Catalog' },
    { id: 'products', label: 'Products' },
    { id: 'brands', label: 'Brands' },
    { id: 'suppliers', label: 'Distributors' }
  ];

  // Save recent search
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const clean = query.trim();
    const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('nexora_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Could not save recent searches', e);
    }
  };

  const removeRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== queryToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('nexora_recent_searches', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('nexora_recent_searches');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
        setIsScopeOpen(false);
        setIsCityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter categories according to query
  const matchingCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return CATEGORIES.slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.subtext && c.subtext.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery]);

  // Candidate terms for predictive typeahead autocompletion (Categories only)
  const allCandidateTerms = useMemo(() => {
    return CATEGORIES.map(c => c.name);
  }, []);

  // Predictive candidate calculation (Ghost Text)
  const predictiveMatch = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    // Check if any candidate starts strictly with the query
    const match = allCandidateTerms.find(term => term.toLowerCase().startsWith(q) && term.toLowerCase() !== q);
    if (match) {
      return {
        fullText: match,
        suffix: match.slice(searchQuery.length)
      };
    }
    return null;
  }, [searchQuery, allCandidateTerms]);

  // Total selectable items in dropdown for keyboard navigation
  const selectableCount = useMemo(() => {
    return matchingCategories.length;
  }, [matchingCategories]);

  // Handle Form Submit
  const handleSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const term = (customQuery !== undefined ? customQuery : searchQuery).trim();
    if (term) {
      saveRecentSearch(term);
    }
    setIsSuggestionsOpen(false);
    onSearch(term, searchScope, selectedCity, activeCategoryTag);
  };

  // Handle Selection from dropdown
  const handleSelectSuggestion = (query: string, scope: 'all' | 'products' | 'brands' | 'suppliers' = 'products') => {
    setSearchQuery(query);
    setSearchScope(scope);
    saveRecentSearch(query);
    setIsSuggestionsOpen(false);
    onSearch(query, scope, selectedCity, activeCategoryTag);
  };

  // Complete the ghost predictive text
  const handleAcceptPredictive = () => {
    if (predictiveMatch) {
      setSearchQuery(predictiveMatch.fullText);
      inputRef.current?.focus();
    }
  };

  // Keyboard navigation inside search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || (e.key === 'ArrowRight' && inputRef.current?.selectionStart === searchQuery.length)) {
      if (predictiveMatch) {
        e.preventDefault();
        handleAcceptPredictive();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isSuggestionsOpen) {
        setIsSuggestionsOpen(true);
      } else {
        setSelectedIndex(prev => (prev < selectableCount - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : selectableCount - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && isSuggestionsOpen) {
        e.preventDefault();
        // Execute highlighted category selection
        if (selectedIndex < matchingCategories.length) {
          handleSelectSuggestion(matchingCategories[selectedIndex].name, 'all');
          return;
        }
      }
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleCategoryTagClick = (catId: CategoryId | 'all') => {
    setActiveCategoryTag(catId);
    if (catId !== 'all' && onSelectCategory) {
      // Keep category filter ready
    }
    inputRef.current?.focus();
  };

  // Helper to highlight matching substrings
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);
    return (
      <span>
        {before}
        <strong className="text-[#B8005A] font-extrabold bg-[#FFF0F5] px-0.5 rounded">{match}</strong>
        {after}
      </span>
    );
  };

  return (
    <section className="relative w-full min-h-[600px] sm:min-h-[660px] flex items-center justify-center overflow-hidden py-16">
      {/* Background Image with warm luxury aesthetic */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_8XRqnZ42dwqZX7WXwBzA5qYrdD6gdYSfQKIo5Av0zIYIbI9FYU4LibxTMaHYeIu7iCp2qlIoWXzct-aGaRx3wnMjFE1N12YFVZFYFzkxGoV6IM8rf0h2VLe8tSkTPbTJ02KyDx0eyMc5YT3kXCj8A_Rq6B4WqZjqJQUOzDVZMAiwbJZHJ4HWGlH51G7jdxpcMsuOkmjC8JK_Cly1o2jyWg57BRjwTSGU2FIK3HRy4iWOS1lmQXx9')`
        }}
      >
        {/* Soft Dark Amber & Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
        {/* Top subtle luxury badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-semibold mb-5 tracking-wider shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#FFB3D1]" />
          <span>Exclusive B2B Wholesale & Distribution Portal</span>
        </div>

        {/* Exact Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-[54px] leading-tight sm:leading-[1.15] font-extrabold text-white tracking-tight max-w-4xl drop-shadow-lg">
          The Premier Network for Luxury Beauty Businesses & Products
        </h1>

        {/* Subheading */}
        <p className="mt-4 text-base sm:text-lg text-white/90 font-normal max-w-2xl text-balance drop-shadow">
          Discover manufacturers, wholesalers, distributors, and professional products.
        </p>

        {/* MOST PROMINENT SEARCH BAR CONTAINER WITH PREDICTIVE TYPEAHEAD */}
        <div 
          ref={searchContainerRef}
          className="mt-8 w-full max-w-4xl relative z-30"
        >
          <form 
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_16px_45px_rgba(0,0,0,0.35)] ring-1 ring-black/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 transition-all hover:shadow-[0_20px_55px_rgba(0,0,0,0.45)]"
          >
            {/* Main Search Input with Ghost Predictive Text Overlay */}
            <div className="relative flex-1 bg-[#F9F9FB] border border-[#E8E8EE] focus-within:border-[#B8005A] focus-within:bg-white rounded-xl sm:rounded-2xl flex items-center px-4 py-3 sm:py-2.5 transition-all shadow-2xs">
              <Search className="w-4 h-4 text-[#8E8E93] shrink-0 mr-3" />
              
              {/* Active Category Scope Tag Chip inside Input (if active) */}
              {activeCategoryTag !== 'all' && (
                <div className="hidden sm:inline-flex items-center gap-1 bg-[#FFF0F5] border border-[#FFD1E3] text-[#B8005A] text-[11px] font-bold px-2 py-0.5 rounded-lg mr-2 shrink-0">
                  {CATEGORY_ICON_MAP[activeCategoryTag]}
                  <span className="capitalize">{activeCategoryTag}</span>
                  <button 
                    type="button" 
                    onClick={() => setActiveCategoryTag('all')}
                    className="hover:text-black ml-0.5"
                    title="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Ghost Completion Text Container */}
              <div className="relative flex-1 flex items-center">
                {/* 1. Ghost Predictive Autocomplete (renders behind input) */}
                {predictiveMatch && (
                  <div 
                    aria-hidden="true" 
                    className="absolute inset-0 pointer-events-none flex items-center text-sm font-medium whitespace-pre overflow-hidden"
                  >
                    <span className="opacity-0">{searchQuery}</span>
                    <span className="text-[#B8005A]/40 font-medium select-none">
                      {predictiveMatch.suffix}
                    </span>
                  </div>
                )}

                {/* 2. Interactive Real Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSuggestionsOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeCategoryTag !== 'all' 
                      ? `Search within ${CATEGORIES.find(c => c.id === activeCategoryTag)?.name || activeCategoryTag}...`
                      : "Search luxury products, formulas, brands, distributors..."
                  }
                  className="w-full bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#8E8E93] font-medium focus:outline-none relative z-10"
                />
              </div>

              {/* Predictive Tab Helper Pill */}
              {predictiveMatch && (
                <button
                  type="button"
                  onClick={handleAcceptPredictive}
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3] px-2 py-0.5 rounded-md mr-1 shrink-0 cursor-pointer hover:bg-[#FFE0EB] transition-colors"
                  title="Click or press Tab to complete"
                >
                  <span>Tab</span>
                  <CornerDownLeft className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Clear Input Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scope Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsScopeOpen(!isScopeOpen);
                  setIsCityOpen(false);
                  setIsSuggestionsOpen(false);
                }}
                className="w-full sm:w-auto bg-[#F4F4F6] hover:bg-[#EBEBEF] border border-[#E2E2E8] text-xs sm:text-sm font-semibold text-[#2C2C2E] px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
              >
                <span>{scopes.find(s => s.id === searchScope)?.label || 'All Catalog'}</span>
                <ChevronDown className="w-4 h-4 text-[#737373] shrink-0" />
              </button>

              {isScopeOpen && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-2xl border border-[#EDEDED] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider">
                    Search Scope
                  </div>
                  {scopes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSearchScope(s.id);
                        setIsScopeOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors hover:bg-[#FFF0F5] hover:text-[#B8005A] font-medium flex items-center justify-between ${
                        searchScope === s.id ? 'text-[#B8005A] font-bold bg-[#FFF0F5]/70' : 'text-[#333]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {searchScope === s.id && <Check className="w-3.5 h-3.5 text-[#B8005A]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCitySelector) {
                    onOpenCitySelector();
                  } else {
                    setIsCityOpen(!isCityOpen);
                    setIsScopeOpen(false);
                    setIsSuggestionsOpen(false);
                  }
                }}
                className="w-full sm:w-auto bg-[#F4F4F6] hover:bg-[#EBEBEF] border border-[#E2E2E8] text-xs sm:text-sm font-semibold text-[#2C2C2E] px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#B8005A] shrink-0" />
                <span className="truncate max-w-[100px]">{selectedCity}</span>
                <ChevronDown className="w-4 h-4 text-[#737373] shrink-0" />
              </button>

              {isCityOpen && (
                <div className="absolute top-full mt-2 right-0 sm:left-0 w-52 bg-white rounded-2xl shadow-2xl border border-[#EDEDED] py-1.5 max-h-60 overflow-y-auto z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider">
                    Sourcing Region
                  </div>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        if (setSelectedCity) setSelectedCity(city);
                        setIsCityOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors hover:bg-[#FFF0F5] hover:text-[#B8005A] flex items-center gap-2 ${
                        selectedCity === city ? 'text-[#B8005A] font-bold bg-[#FFF0F5]/70' : 'text-[#333]'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-[#B8005A]" />
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* High-Impact Luxury Search Button */}
            <button
              type="submit"
              className="bg-[#B8005A] hover:bg-[#A0004E] text-white text-xs sm:text-sm font-bold px-7 py-3 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* ADVANCED PREDICTIVE SUGGESTIONS & INSTANT RESULTS DROPDOWN */}
          {isSuggestionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-[#EAE5DE] p-2 sm:p-3 text-left z-40 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#B8005A]" />
                    {searchQuery ? 'Matching Categories' : 'Browse Categories'}
                  </span>
                  <span className="text-[10px] text-[#8E8E93]">
                    {matchingCategories.length} categories
                  </span>
                </div>
                
                {matchingCategories.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#8E8E93] bg-[#F9F9FB] rounded-xl">
                    No categories match your search
                  </div>
                ) : (
                  <div className="space-y-1">
                    {matchingCategories.map((c, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(c.name, 'all')}
                          className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-xl transition-colors group cursor-pointer text-left border ${
                            isSelected ? 'bg-[#FFF0F5] border-[#FFD1E3]' : 'hover:bg-[#FFF0F5] border-transparent hover:border-[#FFD1E3]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFF0F5] to-white border border-[#FFD1E3] flex items-center justify-center text-[#B8005A] shadow-sm shrink-0">
                              {CATEGORY_ICON_MAP[c.id] || <Sparkles className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1E1E1E] group-hover:text-[#B8005A] transition-colors">
                                {highlightMatch(c.name, searchQuery)}
                              </p>
                              {c.subtext && (
                                <p className="text-[11px] text-[#737373] mt-0.5">
                                  {c.subtext}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-[#8E8E93] bg-[#F4F4F6] px-2 py-1 rounded-md">
                              {c.itemCount}+ items
                            </span>
                            <ArrowRight className="w-4 h-4 text-[#B8005A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Quick Search Actions */}
              <div className="mt-2 pt-2 border-t border-[#F0F0F0] px-3 pb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#8E8E93] text-[11px]">
                  <span>Navigate with <kbd className="bg-gray-100 px-1 py-0.5 rounded border text-[10px]">↑</kbd> <kbd className="bg-gray-100 px-1 py-0.5 rounded border text-[10px]">↓</kbd></span>
                  <span>•</span>
                  <span>Select with <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border text-[10px]">Enter ↵</kbd></span>
                  {predictiveMatch && (
                    <>
                      <span>•</span>
                      <span>Autocomplete with <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border text-[10px]">Tab ⇥</kbd></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Search Trending Tags Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/90">
          <span className="text-white/70 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#FFB3D1]" />
            Trending:
          </span>
          {['Peptide Serums', 'Salon Ionic Dryers', 'Vegan Brushes', 'Micro-Pigments', 'Hydraulic Spa Beds', 'Hyaluronic Acid'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchQuery(tag);
                saveRecentSearch(tag);
                onSearch(tag, 'products', selectedCity, activeCategoryTag);
              }}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 rounded-full px-3 py-1 text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
