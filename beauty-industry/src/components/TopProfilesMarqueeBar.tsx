import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  UserPlus, 
  Check, 
  ChevronRight, 
  MessageCircle, 
  Users, 
  Flame, 
  ExternalLink,
  CheckCircle2,
  Building2,
  Star
} from 'lucide-react';

export interface TopProfileMember {
  id: string;
  name: string;
  roleType: 'supplier' | 'buyer';
  businessType: string;
  category: string;
  location: string;
  city: string;
  state: string;
  avatar: string;
  isVerified: boolean;
  isGstVerified: boolean;
  trustScore?: number;
  phone: string;
  joinedBadge?: string;
  specialty: string;
  profilePath: string; // e.g. /supplier/profile or /buyer/profile
  profileId: string;
  followersCount: string;
  isFollowing?: boolean;
}

export const TOP_MEMBERS_DATA: TopProfileMember[] = [
  {
    id: 'mem_aura_001',
    name: 'Aura Beauty Labs & Formulations',
    roleType: 'supplier',
    businessType: 'Manufacturer & OEM',
    category: 'Haircare Formulations',
    location: 'Navi Mumbai, MH',
    city: 'Mumbai',
    state: 'Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 98,
    phone: '+919820154321',
    joinedBadge: 'Top OEM Partner',
    specialty: 'Nano-Keratin & Cold-Process Hair Serums',
    profilePath: '/supplier/profile',
    profileId: 'seller_aura_001',
    followersCount: '4.2k',
    isFollowing: false
  },
  {
    id: 'mem_priya_002',
    name: 'Priya Sharma (Radiant Beauty)',
    roleType: 'buyer',
    businessType: 'Salon / Spa Chain Buyer',
    category: 'Skincare & Hair Spa',
    location: 'BKC Mumbai, MH',
    city: 'Mumbai',
    state: 'Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 96,
    phone: '+919820154322',
    joinedBadge: 'High-Volume Buyer',
    specialty: 'Bulk Salon Consumables & Professional Serums',
    profilePath: '/buyer/profile',
    profileId: 'buyer_priya_001',
    followersCount: '1.5k',
    isFollowing: true
  },
  {
    id: 'mem_dermaglow_003',
    name: 'Dermaglow India Cosmeceuticals',
    roleType: 'supplier',
    businessType: 'OEM / Contract Manufacturer',
    category: 'Clinical Skincare',
    location: 'Ahmedabad, GJ',
    city: 'Ahmedabad',
    state: 'Gujarat',
    avatar: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 97,
    phone: '+919820154323',
    joinedBadge: 'Verified Contract Mfr',
    specialty: 'Vitamin C 20% + E & Ceramide Barrier Creams',
    profilePath: '/supplier/profile',
    profileId: 'seller_dermaglow_002',
    followersCount: '3.8k',
    isFollowing: false
  },
  {
    id: 'mem_luxeform_004',
    name: 'LuxeForm Cosmetic Packaging Ltd.',
    roleType: 'supplier',
    businessType: 'Packaging & Tooling Supplier',
    category: 'Bottles & Droppers',
    location: 'Peenya Bengaluru, KA',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 95,
    phone: '+919820154324',
    joinedBadge: 'Packaging Specialist',
    specialty: 'Amber Glass 30ml Dropper & Airless Pumps',
    profilePath: '/supplier/profile',
    profileId: 'seller_luxeform_003',
    followersCount: '2.9k',
    isFollowing: false
  },
  {
    id: 'mem_vikram_005',
    name: 'Vikram Mehta (Apex Glow Dist.)',
    roleType: 'buyer',
    businessType: 'Regional Beauty Distributor',
    category: 'Color Cosmetics & Equipment',
    location: 'Connaught Place, Delhi',
    city: 'New Delhi',
    state: 'Delhi NCR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 94,
    phone: '+919820154325',
    joinedBadge: 'Wholesale Buyer',
    specialty: 'Pan-India Distribution Network (450+ Salons)',
    profilePath: '/buyer/profile',
    profileId: 'buyer_vikram_002',
    followersCount: '2.1k',
    isFollowing: false
  },
  {
    id: 'mem_radiant_006',
    name: 'Radiant Botanicals & Active Extracts',
    roleType: 'supplier',
    businessType: 'Active Botanical Extractor',
    category: 'Raw Materials & Botanicals',
    location: 'Kakkanad SEZ, Kochi',
    city: 'Kochi',
    state: 'Kerala',
    avatar: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 99,
    phone: '+919820154326',
    joinedBadge: '100% Organic Certified',
    specialty: 'Gotu Kola 95% & Cold-Pressed Bakuchiol Oil',
    profilePath: '/supplier/profile',
    profileId: 'seller_radiant_004',
    followersCount: '5.1k',
    isFollowing: true
  },
  {
    id: 'mem_novapharma_007',
    name: 'NovaPharma Clinical Cosmeceuticals',
    roleType: 'supplier',
    businessType: 'Dermatological Formulator',
    category: 'Clinical Peels & Sunscreens',
    location: 'Genome Valley, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    avatar: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 98,
    phone: '+919820154327',
    joinedBadge: 'US-FDA Compliant',
    specialty: 'Invisible Hybrid SPF 50+ & Azelaic 15%',
    profilePath: '/supplier/profile',
    profileId: 'seller_novapharma_007',
    followersCount: '6.4k',
    isFollowing: false
  },
  {
    id: 'mem_ananya_008',
    name: 'Ananya Verma (DermaLuxe Spa)',
    roleType: 'buyer',
    businessType: 'Dermatology & Aesthetic Clinic',
    category: 'Peels & Medical Facials',
    location: 'Koramangala, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 93,
    phone: '+919820154328',
    joinedBadge: 'Clinic Chain Partner',
    specialty: 'Medi-Facial Formulations & Clinic Equipment',
    profilePath: '/buyer/profile',
    profileId: 'buyer_ananya_003',
    followersCount: '980',
    isFollowing: false
  },
  {
    id: 'mem_pureessence_009',
    name: 'PureEssence Distillers & Oils',
    roleType: 'supplier',
    businessType: 'Essential Oil Distiller & OEM',
    category: 'Hydrosols & Fragrance Oils',
    location: 'SIDCUL Haridwar, UK',
    city: 'Haridwar',
    state: 'Uttarakhand',
    avatar: 'https://images.unsplash.com/photo-1608248597359-52e1eb704179?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 94,
    phone: '+919820154329',
    joinedBadge: 'Steam Distillation Lab',
    specialty: 'Organic Damask Rose Water & Lavender Hydrosols',
    profilePath: '/supplier/profile',
    profileId: 'seller_pureessence_005',
    followersCount: '1.9k',
    isFollowing: false
  },
  {
    id: 'mem_glampack_010',
    name: 'GlamPack Sustainable Tooling Co.',
    roleType: 'supplier',
    businessType: 'Eco Packaging Manufacturer',
    category: 'PCR Tubes & Jars',
    location: 'Okhla Phase-II, Delhi',
    city: 'New Delhi',
    state: 'Delhi NCR',
    avatar: 'https://images.unsplash.com/photo-1556228722-d9b32f913d96?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    isGstVerified: true,
    trustScore: 96,
    phone: '+919820154330',
    joinedBadge: 'Green Packaging Lead',
    specialty: 'Post-Consumer Recycled (PCR) Tubes & Bamboo Jars',
    profilePath: '/supplier/profile',
    profileId: 'seller_glampack_006',
    followersCount: '3.1k',
    isFollowing: false
  }
];

interface TopProfilesMarqueeBarProps {
  onNavigateProfile?: (roleType: 'supplier' | 'buyer', profileId: string, memberData: TopProfileMember) => void;
  onOpenWhatsApp?: (phone: string, name: string) => void;
}

export const TopProfilesMarqueeBar: React.FC<TopProfilesMarqueeBarProps> = ({
  onNavigateProfile,
  onOpenWhatsApp
}) => {
  const [members, setMembers] = useState<TopProfileMember[]>(TOP_MEMBERS_DATA);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleFollow = (e: React.MouseEvent, memberId: string, memberName: string) => {
    e.stopPropagation();
    setMembers(prev =>
      prev.map(item => {
        if (item.id === memberId) {
          const nextFollowing = !item.isFollowing;
          showToast(
            nextFollowing
              ? `You are now following ${memberName}`
              : `Unfollowed ${memberName}`
          );
          return { ...item, isFollowing: nextFollowing };
        }
        return item;
      })
    );
  };

  const handleCardClick = (member: TopProfileMember) => {
    if (onNavigateProfile) {
      onNavigateProfile(member.roleType, member.profileId, member);
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, member: TopProfileMember) => {
    e.stopPropagation();
    if (onOpenWhatsApp) {
      onOpenWhatsApp(member.phone, member.name);
    } else {
      const cleanPhone = member.phone.replace(/[^0-9]/g, '');
      const message = encodeURIComponent(
        `Hello ${member.name}, I discovered your profile on Nexora Luxe B2B Marketplace and would like to discuss a potential procurement partnership.`
      );
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
  };

  // Duplicate items for continuous infinite marquee
  const marqueeItems = [...members, ...members];

  return (
    <section className="w-full relative py-2 select-none">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#1c1b1b] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between gap-3 mb-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-[#1c1b1b] tracking-tight flex items-center gap-1.5">
                <span>🔥 Newly Joined Network Partners</span>
                <span className="text-[11px] font-normal text-[#8c7077] hidden sm:inline">• 10 Verified Profiles</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase tracking-wider hidden md:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b90064] animate-pulse" />
                Live Auto-Scroll
              </span>
            </div>
            <p className="text-[11px] text-[#594047] font-medium hidden sm:block">
              Connect directly with recently onboarded manufacturers, OEM formulators, and verified buyers. Hover to pause.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#8c7077] font-semibold">
          <span className="hidden sm:inline">Hover card to pause</span>
        </div>
      </div>

      {/* HORIZONTAL CONTINUOUS AUTO-SCROLLING MARQUEE TRACK */}
      <div className="relative w-full overflow-hidden group">
        {/* Soft edge gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-[#fdf8f8] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-[#fdf8f8] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-3.5 py-2 px-2">
          {marqueeItems.map((member, idx) => (
            <div
              key={`${member.id}-${idx}`}
              onClick={() => handleCardClick(member)}
              className="shrink-0 w-[300px] sm:w-[325px] bg-white border border-[#e8e8e8] hover:border-[#b90064]/60 hover:shadow-lg rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group/card relative select-none"
            >
              {/* Top Row: Avatar, Name, GST Badge, Follow Button */}
              <div className="flex items-start gap-2.5">
                <div className="relative shrink-0">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#e8e8e8] shadow-2xs group-hover/card:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {member.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white border border-green-200 flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#1c1b1b] group-hover/card:text-[#b90064] transition-colors truncate">
                      {member.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {member.isGstVerified && (
                      <span className="px-1.5 py-0.2 rounded bg-green-50 text-green-700 border border-green-200 text-[9px] font-black uppercase tracking-tight">
                        GST Verified
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-[#b90064] truncate">
                      {member.businessType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10.5px] text-[#8c7077] mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-[#0050d6] shrink-0" />
                    <span className="truncate">{member.location}</span>
                  </div>
                </div>
              </div>

              {/* Specialty & Badge snippet */}
              <div className="mt-2.5 pt-2 border-t border-[#f0edec] space-y-1">
                <div className="text-[10.5px] text-[#594047] line-clamp-1 font-medium">
                  <span className="text-[#8c7077] font-semibold">Specialty: </span>
                  {member.specialty}
                </div>
              </div>

              {/* Bottom Action Bar: WhatsApp Button & Follow / Unfollow */}
              <div className="mt-2.5 pt-2 border-t border-[#f0edec] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10.5px] text-[#8c7077] font-semibold">
                  <Users className="w-3 h-3 text-[#b90064]" />
                  <span>{member.followersCount} Followers</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* WhatsApp Action Button */}
                  <button
                    type="button"
                    onClick={(e) => handleWhatsAppClick(e, member)}
                    title={`Open WhatsApp chat with ${member.name}`}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span className="hidden sm:inline text-[11px] font-extrabold">WhatsApp</span>
                  </button>

                  {/* Follow / Unfollow Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(e, member.id, member.name)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 border ${
                      member.isFollowing
                        ? 'bg-[#fde7f3] border-[#b90064]/30 text-[#b90064] hover:bg-[#fbc5e3]'
                        : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064]'
                    }`}
                  >
                    {member.isFollowing ? (
                      <>
                        <Check className="w-3 h-3 text-[#b90064]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 text-[#8c7077]" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
