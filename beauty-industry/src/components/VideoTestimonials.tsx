import React, { useState } from 'react';
import {
  Play,
  Film,
  Sparkles,
  ShieldCheck,
  Building2,
  MapPin,
  Heart,
  Share2,
  PlusCircle,
  Eye,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
import { VideoTestimonial, Product, SupplierPartner } from '../types';
import { StarRating } from './StarRating';

interface VideoTestimonialsProps {
  videos: VideoTestimonial[];
  distributors: SupplierPartner[];
  products: Product[];
  onSelectVideo: (video: VideoTestimonial) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectSupplier?: (supplierId: string) => void;
  onOpenSubmitModal?: () => void;
  onAddToQuote?: (product: Product, quantity: number) => void;
  likedVideoIds?: string[];
  onLikeVideo?: (videoId: string) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const VideoTestimonials: React.FC<VideoTestimonialsProps> = ({
  videos,
  distributors,
  products,
  onSelectVideo,
  onSelectProduct,
  onSelectSupplier,
  onOpenSubmitModal,
  onAddToQuote,
  likedVideoIds = [],
  onLikeVideo,
  title = "Distributor Video Testimonials & Highlights",
  subtitle = "Watch verified distributors demonstrate live backbar stress tests, molecular penetration trials, and salon client retention results.",
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'All Highlights' },
    { id: 'Haircare & Tools', label: 'Haircare & Tools' },
    { id: 'Skincare', label: 'Derm Skincare' },
    { id: 'Spa & Wellness', label: 'Spa & Wellness' },
    { id: 'Salon Tools & Eq.', label: 'Salon Tech & Eq.' }
  ];

  const filteredVideos = videos.filter((v) => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
    if (selectedDistributorFilter !== 'all' && v.distributorId !== selectedDistributorFilter) return false;
    if (verifiedOnly && !v.distributorVerified) return false;
    return true;
  });

  return (
    <section className="w-full">
      <div className="bg-white border border-[#EAE5DE] rounded-3xl p-6 sm:p-10 shadow-xs">
        {/* Section Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#F5F2EB]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FFD1E3] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-2">
              <Film className="w-3.5 h-3.5" />
              Verified Distributor Showcase
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#737373] mt-1.5 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {onOpenSubmitModal && (
              <button
                onClick={onOpenSubmitModal}
                className="bg-[#FFF0F5] hover:bg-[#FFE5EE] border border-[#FFD1E3] text-[#B8005A] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Video Highlight</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        {!compact && (
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFCFA] border border-[#EAE5DE] rounded-2xl p-3.5 sm:p-4">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#B8005A] text-white shadow-xs'
                      : 'bg-white text-[#525252] border border-[#EAE5DE] hover:border-[#B8005A]/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Right: Distributor Filter & Verified Switch */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <select
                value={selectedDistributorFilter}
                onChange={(e) => setSelectedDistributorFilter(e.target.value)}
                className="bg-white border border-[#EAE5DE] rounded-xl px-3 py-1.5 text-xs text-[#1A1A1A] font-semibold focus:outline-none focus:border-[#B8005A] cursor-pointer"
              >
                <option value="all">All Distributors</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-bold text-[#4A4A4A] cursor-pointer select-none bg-white border border-[#EAE5DE] px-3 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-[#8C7077] text-[#B8005A] focus:ring-[#B8005A]"
                />
                <span className="flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B8005A]" />
                  Verified Only
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Video Cards Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 bg-[#FCFCFA] rounded-2xl border border-[#EAE5DE] mt-6">
            <Film className="w-10 h-10 text-[#8E8E93] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">No Video Highlights Match Filters</h3>
            <p className="text-xs text-[#737373] mt-1">Try selecting another category or clear verified filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-8">
            {filteredVideos.map((video) => {
              const isLiked = likedVideoIds.includes(video.id);
              const linkedProduct = video.featuredProductId
                ? products.find((p) => p.id === video.featuredProductId)
                : undefined;

              return (
                <div
                  key={video.id}
                  onClick={() => onSelectVideo(video)}
                  className="bg-[#FCFCFA] hover:bg-white border border-[#EAE5DE] hover:border-[#B8005A]/40 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                >
                  {/* Top: Video Thumbnail Cover with Play Button Overlay */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden">
                    <img
                      src={video.thumbnail || undefined}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                    />

                    {/* Gradient Scrim for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play Button Icon Overlay with Pulsing Magenta Glow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-[#B8005A]/90 group-hover:bg-[#B8005A] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300 backdrop-blur-xs border border-white/40">
                        <Play className="w-6 h-6 ml-0.5 fill-white" />
                      </div>
                    </div>

                    {/* Top Left: Category & Live Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                        {video.category}
                      </span>
                    </div>

                    {/* Top Right: Like Button on Thumbnail */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikeVideo?.(video.id);
                      }}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                        isLiked
                          ? 'bg-[#B8005A] text-white'
                          : 'bg-black/50 hover:bg-black/80 text-white/90 border border-white/20'
                      }`}
                      title="Like highlight"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                    </button>

                    {/* Bottom Info on Thumbnail: Duration & View Count */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-semibold z-10">
                      <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-[#FF85B2]" />
                        {video.duration}
                      </span>
                      <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px]">
                        <Eye className="w-3 h-3 text-[#FF85B2]" />
                        {video.viewsCount} views
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Distributor Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE0EC] border border-[#FFD6E5] text-[#B8005A] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {video.distributorInitials}
                          </div>
                          <div>
                            <span className="font-bold text-[#1A1A1A] text-xs group-hover:text-[#B8005A] transition-colors block line-clamp-1">
                              {video.distributorName}
                            </span>
                            <span className="text-[10px] text-[#737373] flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-[#B8005A]" />
                              {video.distributorLocation}
                            </span>
                          </div>
                        </div>

                        {video.distributorVerified && (
                          <span className="text-[10px] font-extrabold text-[#B8005A] uppercase tracking-wider bg-[#FFF0F5] border border-[#FFB8D2] px-2 py-0.5 rounded-full shrink-0">
                            VERIFIED
                          </span>
                        )}
                      </div>

                      {/* Video Title */}
                      <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors line-clamp-2 leading-snug">
                        {video.title}
                      </h3>

                      {/* Speaker Quote Preview */}
                      <p className="text-xs text-[#525252] mt-2 line-clamp-2 italic leading-relaxed">
                        "{video.quote}"
                      </p>

                      {/* Key Verified Highlight Bullet */}
                      <div className="mt-3 bg-[#FFF5F8] border border-[#FFD6E5] rounded-xl p-2.5 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#B8005A] shrink-0 mt-0.5" />
                        <p className="text-[11px] text-[#8E0045] font-semibold line-clamp-1">
                          {video.keyHighlight}
                        </p>
                      </div>
                    </div>

                    {/* Tagged Product Bottom Bar */}
                    <div className="mt-5 pt-3.5 border-t border-[#F5F2EB]">
                      {(linkedProduct || video.featuredProductName) && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img
                              src={linkedProduct?.image || video.featuredProductImage || undefined}
                              alt={linkedProduct?.name || video.featuredProductName}
                              className="w-9 h-9 object-cover rounded-lg border border-[#EAE5DE] bg-white shrink-0"
                            />
                            <div className="truncate">
                              <span className="text-[11px] font-bold text-[#1A1A1A] block truncate">
                                {linkedProduct?.name || video.featuredProductName}
                              </span>
                              <span className="text-[10px] text-[#B8005A] font-extrabold">
                                ₹{(linkedProduct?.price || video.featuredProductPrice || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {linkedProduct && onAddToQuote && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToQuote(linkedProduct, linkedProduct.moq);
                                }}
                                className="p-1.5 rounded-lg bg-[#FFF0F5] hover:bg-[#FFE5EE] text-[#B8005A] border border-[#FFD1E3] transition-colors cursor-pointer"
                                title="Add to RFQ"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="flex items-center gap-1 font-bold text-[#B8005A] text-xs group-hover:translate-x-1 transition-transform">
                              <span>Watch</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
