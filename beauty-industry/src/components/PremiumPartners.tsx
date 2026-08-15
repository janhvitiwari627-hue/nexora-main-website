import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Building2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Award,
  Play,
  Film,
  Sparkles,
  Heart,
  Clock,
  Eye
} from 'lucide-react';
import { SupplierPartner, VideoTestimonial, Product } from '../types';
import { StarRating } from './StarRating';

interface PremiumPartnersProps {
  partners: SupplierPartner[];
  videoTestimonials?: VideoTestimonial[];
  products?: Product[];
  onSelectPartner: (partner: SupplierPartner) => void;
  onViewAllPartners: () => void;
  onSelectVideo?: (video: VideoTestimonial) => void;
  onOpenSubmitModal?: () => void;
  onAddToQuote?: (product: Product, quantity: number) => void;
  likedVideoIds?: string[];
  onLikeVideo?: (videoId: string) => void;
}

export const PremiumPartners: React.FC<PremiumPartnersProps> = ({
  partners,
  videoTestimonials = [],
  products = [],
  onSelectPartner,
  onViewAllPartners,
  onSelectVideo,
  onOpenSubmitModal,
  onAddToQuote,
  likedVideoIds = [],
  onLikeVideo
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'videos'>('directory');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      {/* Outer Card Container with clean luxury cream/white styling */}
      <div className="bg-white border border-[#EAE5DE] rounded-3xl p-6 sm:p-10 shadow-xs">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#F5F2EB]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">
                Premium Partners
              </h2>
              <ShieldCheck className="w-6 h-6 text-[#B8005A]" />
            </div>
            <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-2xl">
              Discover verified wholesale distributors and direct formulation labs for unparalleled luxury quality and fulfillment speed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl border border-[#EAE5DE]">
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-white text-[#B8005A] shadow-xs'
                    : 'text-[#737373] hover:text-[#1A1A1A]'
                }`}
              >
                Directory
              </button>

              <button
                onClick={() => setActiveTab('videos')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'videos'
                    ? 'bg-white text-[#B8005A] shadow-xs'
                    : 'text-[#737373] hover:text-[#1A1A1A]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video Testimonials</span>
                {videoTestimonials.length > 0 && (
                  <span className="bg-[#B8005A] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {videoTestimonials.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onViewAllPartners}
              className="text-xs sm:text-sm font-bold text-[#B8005A] hover:text-[#8E0045] flex items-center gap-1.5 transition-colors cursor-pointer bg-[#FFF0F5] hover:bg-[#FFE5EE] border border-[#FFD1E3] px-4 py-2 rounded-xl"
            >
              <span>View All Partners</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Directory Cards */}
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 animate-in fade-in duration-200">
            {partners.slice(0, 3).map((partner) => (
              <motion.div
                key={partner.id}
                onClick={() => onSelectPartner(partner)}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="bg-[#FCFCFA] hover:bg-white border border-[#EAE5DE] hover:border-[#B8005A]/40 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
              >
                <div>
                  {/* Top Row: Initials Avatar + High-Contrast Clear Badges */}
                  <div className="flex items-start justify-between mb-4">
                    {/* Avatar Initials with luxury tint */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFF0F5] to-[#FFE0EC] border border-[#FFD6E5] text-[#B8005A] flex items-center justify-center font-extrabold text-lg tracking-wider group-hover:scale-105 transition-transform shadow-xs">
                      {partner.initials}
                    </div>

                    {/* Distinct Clear Badges */}
                    {partner.verified ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#B8005A] uppercase tracking-wider bg-gradient-to-r from-[#FFF0F5] to-[#FFF5F8] border border-[#FFB8D2] px-3 py-1 rounded-full shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-[#B8005A] animate-pulse" />
                        NEXORA VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-[#52525B] uppercase tracking-wider bg-[#F4F4F5] border border-[#E4E4E7] px-2.5 py-1 rounded-full">
                        FREE SUPPLIER
                      </span>
                    )}
                  </div>

                  {/* Partner Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors line-clamp-1">
                    {partner.name}
                  </h3>

                  {/* Star Rating */}
                  <div className="mt-2 flex items-center">
                    <StarRating rating={partner.rating} reviewsCount={partner.reviewsCount} size="xs" compact={true} />
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-[#737373] mt-2.5">
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

                  {/* Short description */}
                  <p className="text-xs text-[#525252] mt-3 line-clamp-2 leading-relaxed">
                    {partner.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[#F0EBE1]">
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

                {/* Bottom Quick Info & Link */}
                <div className="mt-6 pt-4 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-bold text-[#B8005A]">
                  <span className="text-[11px] text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md font-semibold">
                    ⚡ {partner.responseRate}
                  </span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View Line Sheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab 2: Video Testimonials Grid */}
        {activeTab === 'videos' && (
          <div className="mt-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-[#737373]">
                Showing real formulation trials & equipment reviews from verified partners
              </div>
              {onOpenSubmitModal && (
                <button
                  onClick={onOpenSubmitModal}
                  className="text-xs font-bold text-[#B8005A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Submit Distributor Video</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videoTestimonials.slice(0, 3).map((video) => {
                const isLiked = likedVideoIds.includes(video.id);

                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo?.(video)}
                    className="bg-[#FCFCFA] hover:bg-white border border-[#EAE5DE] hover:border-[#B8005A]/40 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Video Thumbnail with Play Button */}
                    <div className="relative w-full aspect-video bg-black overflow-hidden">
                      <img
                        src={video.thumbnail || undefined}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[#B8005A]/90 group-hover:bg-[#B8005A] text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300 border border-white/40">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          {video.category}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-white/90 font-semibold z-10">
                        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md font-mono">
                          <Clock className="w-3 h-3 text-[#FF85B2]" />
                          {video.duration}
                        </span>
                        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          <Eye className="w-3 h-3 text-[#FF85B2]" />
                          {video.viewsCount} views
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFF0F5] to-[#FFE0EC] border border-[#FFD6E5] text-[#B8005A] flex items-center justify-center font-bold text-[11px]">
                            {video.distributorInitials}
                          </div>
                          <span className="font-bold text-xs text-[#1A1A1A]">
                            {video.distributorName}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors line-clamp-2 leading-snug">
                          {video.title}
                        </h3>

                        <p className="text-xs text-[#525252] mt-2 line-clamp-2 italic">
                          "{video.quote}"
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F5F2EB] flex items-center justify-between text-xs font-bold text-[#B8005A]">
                        <span className="text-[11px] text-[#8E0045] font-semibold">
                          ✨ {video.speakerName}
                        </span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>Watch Highlight</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

