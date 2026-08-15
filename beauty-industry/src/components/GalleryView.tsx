import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Flower2, HeartHandshake, Crown, 
  Upload, ShieldCheck, Heart, ArrowRight, Filter, Search, Eye, CheckCircle2
} from 'lucide-react';
import { GalleryItem, SalonTheme } from '../types/gallery';
import { SALON_THEMES_INFO, getPublicCustomerGalleryItems } from '../data/galleryData';

interface GalleryViewProps {
  items: GalleryItem[];
  onOpenUploadModal: () => void;
  onOpenModerationPanel: () => void;
  onBookService?: (serviceName: string, price: number) => void;
  onLikeItem?: (itemId: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  items,
  onOpenUploadModal,
  onOpenModerationPanel,
  onBookService,
  onLikeItem
}) => {
  const [activeTheme, setActiveTheme] = useState<SalonTheme>('hair_studio');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [beforeAfterToggle, setBeforeAfterToggle] = useState<Record<string, 'after' | 'before'>>({});

  const themeInfo = SALON_THEMES_INFO[activeTheme];

  // Apply strict Theme Isolation + Customer Visibility filter (status === 'published')
  const publicItems = getPublicCustomerGalleryItems(items, activeTheme);

  // Apply Category and Search filters
  const filteredItems = publicItems.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      !searchQuery.trim() || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.linkedServiceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const iconMap = {
    barber: Scissors,
    hair_studio: Sparkles,
    beauty_spa: Flower2,
    family: HeartHandshake,
    nail_lash: Crown
  };

  const handleToggleBeforeAfter = (itemId: string) => {
    setBeforeAfterToggle(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 'before' ? 'after' : 'before'
    }));
  };

  return (
    <div className="min-h-screen bg-[#FCF8FA] pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E1E1E] via-[#2D1222] to-[#8E004B] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#B8005A]/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-[#FFD1E3] mb-3">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Phase 14.7 — Multi-Theme Moderated Gallery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif">
                Verified Salon Transformations
              </h1>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                Explore real, high-resolution salon results. Every transformation photo is strictly verified and approved by authorized salon owners before public display.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenUploadModal}
                className="px-4 py-2.5 bg-white text-[#8E004B] font-bold text-xs rounded-xl shadow-lg hover:bg-[#FFF0F5] transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Transformation</span>
              </button>

              <button
                onClick={onOpenModerationPanel}
                className="px-4 py-2.5 bg-[#8E004B] hover:bg-[#A0004E] text-white font-bold text-xs rounded-xl border border-white/30 shadow-lg transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Owner/Admin Moderation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Theme Switcher Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#F0E6EC] p-3 sm:p-4 mb-6">
          <div className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
            <span>Select Salon Theme (Theme Isolated)</span>
            <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Theme Isolated
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(SALON_THEMES_INFO) as SalonTheme[]).map((tKey) => {
              const info = SALON_THEMES_INFO[tKey];
              const IconComp = iconMap[tKey];
              const isSelected = activeTheme === tKey;
              const count = getPublicCustomerGalleryItems(items, tKey).length;

              return (
                <button
                  key={tKey}
                  onClick={() => {
                    setActiveTheme(tKey);
                    setSelectedCategory('all');
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-start justify-between text-left group ${
                    isSelected
                      ? 'bg-[#8E004B] border-[#8E004B] text-white shadow-md'
                      : 'bg-white border-[#EDEDED] text-[#1E1E1E] hover:border-[#8E004B]/50 hover:bg-[#FFF0F5]/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FFF0F5] text-[#8E004B]'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white text-[#8E004B]' : 'bg-[#F5F5F5] text-[#737373]'
                    }`}>
                      {count} items
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold block truncate">{info.name}</span>
                    <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-gray-200' : 'text-[#737373]'}`}>
                      {info.tagline}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Theme Info Banner */}
        <div className="bg-white rounded-2xl border border-[#F0E6EC] p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${themeInfo.badgeBg} ${themeInfo.badgeText}`}>
                {themeInfo.name} Theme
              </span>
              <span className="text-xs font-semibold text-[#737373]">• {themeInfo.tagline}</span>
            </div>
            <p className="text-xs text-[#4A4A4A] mt-1">{themeInfo.description}</p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles, techniques..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#EDEDED] rounded-xl focus:outline-none focus:border-[#8E004B] bg-[#FAFAFA]"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#1E1E1E] text-white shadow-xs'
                : 'bg-white text-[#737373] border border-[#EDEDED] hover:bg-[#F5F5F5]'
            }`}
          >
            All Categories ({publicItems.length})
          </button>
          {themeInfo.categories.map((cat) => {
            const catCount = publicItems.filter(i => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#8E004B] text-white shadow-xs'
                    : 'bg-white text-[#737373] border border-[#EDEDED] hover:bg-[#FFF0F5]'
                }`}
              >
                {cat} ({catCount})
              </button>
            );
          })}
        </div>

        {/* Customer Public Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#E0BEC6] p-12 text-center my-8">
            <Eye className="w-12 h-12 text-[#8E004B]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1E1E1E]">No Approved Photos in {themeInfo.name}</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-md mx-auto">
              There are currently no approved public gallery items under this category filter. Uploaded items are waiting for Owner/Admin approval.
            </p>
            <button
              onClick={onOpenUploadModal}
              className="mt-4 px-4 py-2 bg-[#8E004B] text-white text-xs font-bold rounded-xl hover:bg-[#A0004E] transition-all inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Photo for Approval</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const currentToggle = beforeAfterToggle[item.id] || 'after';
              const displayImg = item.mediaType === 'before_after' 
                ? (currentToggle === 'before' ? item.beforeImageUrl : item.afterImageUrl)
                : item.imageUrl;

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#F0E6EC] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  {/* Media Aspect Container */}
                  <div className="relative aspect-[4/3] bg-[#1E1E1E] overflow-hidden">
                    <img
                      src={displayImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="bg-[#10B981] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Live
                      </span>
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                        {item.category}
                      </span>
                    </div>

                    {/* Before & After Interactive Toggle Button */}
                    {item.mediaType === 'before_after' && (
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleBeforeAfter(item.id)}
                          className="px-3 py-1 bg-white/90 backdrop-blur-md hover:bg-white text-[#1E1E1E] text-xs font-bold rounded-full shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#8E004B]" />
                          <span>Showing: <strong className="uppercase text-[#8E004B]">{currentToggle}</strong> (Click to toggle)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-[#1E1E1E] leading-snug">{item.title}</h3>
                        <button
                          onClick={() => onLikeItem && onLikeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
                          title="Endorse styling"
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#737373] mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0E6EC] space-y-2">
                      {/* Linked Service */}
                      <div className="bg-[#FFF0F5] border border-[#FFD1E3] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E004B] block">
                            Linked Service
                          </span>
                          <span className="text-xs font-bold text-[#1E1E1E] truncate block">
                            {item.linkedServiceName}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-[#8E004B] bg-white px-2 py-0.5 rounded-lg border border-[#FFD1E3]">
                          Theme OK
                        </span>
                      </div>

                      {/* Salon & Action */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="text-[11px] text-[#737373] truncate">
                          by <span className="font-bold text-[#1E1E1E]">{item.salonName}</span>
                        </div>
                        <button
                          onClick={() => onBookService && onBookService(item.linkedServiceName, 95)}
                          className="px-3 py-1.5 bg-[#8E004B] hover:bg-[#A0004E] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
                        >
                          <span>Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
