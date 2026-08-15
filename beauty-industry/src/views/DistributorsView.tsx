import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  Globe,
  Building2,
  Truck,
  Film,
  Sparkles,
  Scissors,
  Palette,
  Brush,
  Hand,
  Flower2,
  Armchair,
  Wrench,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  Bookmark,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { SupplierPartner, VideoTestimonial, Product } from '../types';
import { StarRating } from '../components/StarRating';
import { VideoTestimonials } from '../components/VideoTestimonials';

interface DistributorsViewProps {
  partners: SupplierPartner[];
  videoTestimonials?: VideoTestimonial[];
  products?: Product[];
  onSelectPartner: (partner: SupplierPartner) => void;
  onOpenRegister: () => void;
  onSelectVideo?: (video: VideoTestimonial) => void;
  onOpenSubmitModal?: () => void;
  onAddToQuote?: (product: Product, quantity: number) => void;
  likedVideoIds?: string[];
  onLikeVideo?: (videoId: string) => void;
}

export const DistributorsView: React.FC<DistributorsViewProps> = ({
  partners,
  videoTestimonials = [],
  products = [],
  onSelectPartner,
  onOpenRegister,
  onSelectVideo,
  onOpenSubmitModal,
  onAddToQuote,
  likedVideoIds = [],
  onLikeVideo
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'directory' | 'videos'>('directory');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest' | 'orders'>('recommended');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Business Type Quick Navigation Tab State
  const [activeFilterType, setActiveFilterType] = useState<
    'all' | 'verified_distributors' | 'oem_manufacturers' | 'wholesalers' | 'custom'
  >('all');

  // Sidebar Filter States
  const [businessTypeFilters, setBusinessTypeFilters] = useState<{
    manufacturer: boolean;
    wholesaler: boolean;
    distributor: boolean;
    importer: boolean;
  }>({
    manufacturer: true,
    wholesaler: true,
    distributor: true,
    importer: true
  });

  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [panIndiaOnly, setPanIndiaOnly] = useState(false);
  const [sameDayDelivery, setSameDayDelivery] = useState(false);

  // Bookmarks & Quick Filters state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['partner-1', 'partner-3']);
  const [quickFilter, setQuickFilter] = useState<'none' | 'recent' | 'favorites' | 'near_me'>('none');

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Accordion Open States
  const [openSections, setOpenSections] = useState({
    businessType: true,
    trustSafety: true,
    location: false
  });

  const [visibleCount, setVisibleCount] = useState(6);

  // Quick Business Type Navigation Switcher
  const handleFilterTypeChange = (type: 'all' | 'verified_distributors' | 'oem_manufacturers' | 'wholesalers' | 'brands') => {
    setActiveFilterType(type);
    if (type === 'all') {
      setBusinessTypeFilters({
        manufacturer: true,
        wholesaler: true,
        distributor: true,
        importer: true
      });
      setVerifiedOnly(false);
    } else if (type === 'brands') {
      setBusinessTypeFilters({
        manufacturer: true,
        wholesaler: false,
        distributor: true,
        importer: false
      });
      setVerifiedOnly(true);
    } else if (type === 'verified_distributors') {
      setBusinessTypeFilters({
        manufacturer: false,
        wholesaler: false,
        distributor: true,
        importer: false
      });
      setVerifiedOnly(true);
    } else if (type === 'oem_manufacturers') {
      setBusinessTypeFilters({
        manufacturer: true,
        wholesaler: false,
        distributor: false,
        importer: false
      });
      setVerifiedOnly(false);
    } else if (type === 'wholesalers') {
      setBusinessTypeFilters({
        manufacturer: false,
        wholesaler: true,
        distributor: false,
        importer: false
      });
      setVerifiedOnly(false);
    }
  };

  // Dynamic Count Calculation for Navigation Tabs
  const filterTypeCounts = useMemo(() => {
    let all = 0;
    let verifiedDistributors = 0;
    let oemManufacturers = 0;
    let wholesalers = 0;

    partners.forEach((partner) => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = partner.name.toLowerCase().includes(q);
        const matchesDesc = partner.description.toLowerCase().includes(q);
        const matchesLoc = partner.location.toLowerCase().includes(q);
        const matchesTags = partner.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesName && !matchesDesc && !matchesLoc && !matchesTags) return;
      }

      // City filter
      if (selectedCity && !partner.location.toLowerCase().includes(selectedCity.toLowerCase())) {
        return;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const catMap: Record<string, string[]> = {
          skincare: ['skincare', 'facial', 'ayurvedic', 'peptides', 'serum', 'cream', 'skin', 'derma', 'face', 'cleanser'],
          haircare: ['haircare', 'shampoo', 'keratin', 'hair', 'conditioner', 'oil', 'scalp', 'botox'],
          haircolor: ['hair color', 'color', 'pigments', 'dye', 'bleach', 'highlight'],
          makeup: ['makeup', 'cosmetics', 'pigments', 'lipstick', 'foundation', 'palette', 'eyeliner'],
          nails: ['nails', 'lash', 'nail', 'gel', 'acrylic', 'manicure', 'pedicure', 'extension'],
          spa: ['spa', 'massage', 'wellness', 'stones', 'essential', 'aroma', 'body', 'scrub'],
          tools: ['tools', 'equipment', 'furniture', 'dryer', 'salon', 'chair', 'scissors', 'machine', 'laser', 'clipper'],
          oem: ['oem', 'manufacturer', 'private label', 'custom', 'formulation', 'factory', 'lab', 'bulk', 'contract'],
          fragrance: ['fragrance', 'perfume', 'attar', 'scent', 'aroma', 'deodorant', 'body mist'],
          hygiene: ['hygiene', 'sanitizer', 'disposable', 'waxing', 'apron', 'towel', 'glove', 'mask']
        };
        const keywords = catMap[selectedCategory] || [selectedCategory];
        const hasMatch = (partner.tags && partner.tags.some((tag) =>
          keywords.some((kw) => tag.toLowerCase().includes(kw))
        )) || keywords.some((kw) => partner.description.toLowerCase().includes(kw));
        if (!hasMatch) return;
      }

      const pType = partner.type.toLowerCase();
      const pDetail = (partner.businessTypeDetail || '').toLowerCase();
      const isMfg = pType === 'manufacturer' || pDetail.includes('manufacturer') || pDetail.includes('company');
      const isWholesale = pType === 'wholesaler' || pDetail.includes('wholesaler');
      const isDist = pType === 'distributor' || pDetail.includes('distributor');

      all++;
      if (isDist && partner.verified) verifiedDistributors++;
      if (isMfg) oemManufacturers++;
      if (isWholesale) wholesalers++;
    });

    return { all, verifiedDistributors, oemManufacturers, wholesalers };
  }, [partners, searchQuery, selectedCity, selectedCategory]);

  // Categories for category strip & directory quick navigation
  const categoriesList = [
    { id: 'all', label: 'All Categories', icon: Layers, image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80' },
    { id: 'skincare', label: 'Skincare', icon: Sparkles, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80' },
    { id: 'haircare', label: 'Haircare', icon: Scissors, image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=300&q=80' },
    { id: 'haircolor', label: 'Hair Color', icon: Palette, image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&q=80' },
    { id: 'makeup', label: 'Makeup', icon: Brush, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=300&q=80' },
    { id: 'nails', label: 'Nails & Lashes', icon: Hand, image: 'https://images.unsplash.com/photo-1632345031435-8727f6c97d34?auto=format&fit=crop&w=300&q=80' },
    { id: 'spa', label: 'Spa & Wellness', icon: Flower2, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80' },
    { id: 'tools', label: 'Salon Tools', icon: Armchair, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80' },
    { id: 'oem', label: 'OEM & Private Label', icon: Building2, image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=300&q=80' },
    { id: 'fragrance', label: 'Fragrance & Attars', icon: Sparkles, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80' },
    { id: 'hygiene', label: 'Hygiene & Disposables', icon: ShieldCheck, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80' }
  ];

  // Toggle Accordion section
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedCategory('all');
    setActiveFilterType('all');
    setBusinessTypeFilters({
      manufacturer: true,
      wholesaler: true,
      distributor: true,
      importer: true
    });
    setVerifiedOnly(false);
    setTopRatedOnly(false);
    setPanIndiaOnly(false);
    setSameDayDelivery(false);
  };

  // Filtered & Sorted Suppliers
  const filteredSuppliers = useMemo(() => {
    return partners.filter((partner) => {
      // Quick Filters (Recent, Favorites, Near Me)
      if (quickFilter === 'favorites' && !bookmarkedIds.includes(partner.id)) return false;
      if (quickFilter === 'recent' && partner.establishedYear < 2018) return false;
      if (
        quickFilter === 'near_me' &&
        !partner.location.toLowerCase().includes('mumbai') &&
        !partner.location.toLowerCase().includes('delhi') &&
        !partner.location.toLowerCase().includes('jaipur')
      )
        return false;

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = partner.name.toLowerCase().includes(q);
        const matchesDesc = partner.description.toLowerCase().includes(q);
        const matchesLoc = partner.location.toLowerCase().includes(q);
        const matchesTags = partner.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!matchesName && !matchesDesc && !matchesLoc && !matchesTags) return false;
      }

      // City filter
      if (selectedCity) {
        if (!partner.location.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const catMap: Record<string, string[]> = {
          skincare: ['skincare', 'facial', 'ayurvedic', 'peptides', 'serum', 'cream', 'skin', 'derma', 'face', 'cleanser'],
          haircare: ['haircare', 'shampoo', 'keratin', 'hair', 'conditioner', 'oil', 'scalp', 'botox'],
          haircolor: ['hair color', 'color', 'pigments', 'dye', 'bleach', 'highlight'],
          makeup: ['makeup', 'cosmetics', 'pigments', 'lipstick', 'foundation', 'palette', 'eyeliner'],
          nails: ['nails', 'lash', 'nail', 'gel', 'acrylic', 'manicure', 'pedicure', 'extension'],
          spa: ['spa', 'massage', 'wellness', 'stones', 'essential', 'aroma', 'body', 'scrub'],
          tools: ['tools', 'equipment', 'furniture', 'dryer', 'salon', 'chair', 'scissors', 'machine', 'laser', 'clipper'],
          oem: ['oem', 'manufacturer', 'private label', 'custom', 'formulation', 'factory', 'lab', 'bulk', 'contract'],
          fragrance: ['fragrance', 'perfume', 'attar', 'scent', 'aroma', 'deodorant', 'body mist'],
          hygiene: ['hygiene', 'sanitizer', 'disposable', 'waxing', 'apron', 'towel', 'glove', 'mask']
        };
        const keywords = catMap[selectedCategory] || [selectedCategory];
        const hasMatch = (partner.tags && partner.tags.some((tag) =>
          keywords.some((kw) => tag.toLowerCase().includes(kw))
        )) || keywords.some((kw) => partner.description.toLowerCase().includes(kw));
        if (!hasMatch) return false;
      }

      // Business Type Filter
      const pType = partner.type.toLowerCase();
      const pDetail = (partner.businessTypeDetail || '').toLowerCase();
      const isMfg = pType === 'manufacturer' || pDetail.includes('manufacturer') || pDetail.includes('company');
      const isWholesale = pType === 'wholesaler' || pDetail.includes('wholesaler');
      const isDist = pType === 'distributor' || pDetail.includes('distributor');
      const isImp = pDetail.includes('importer');

      const matchesType =
        (businessTypeFilters.manufacturer && isMfg) ||
        (businessTypeFilters.wholesaler && isWholesale) ||
        (businessTypeFilters.distributor && isDist) ||
        (businessTypeFilters.importer && isImp);

      if (!matchesType) return false;

      // Trust & Safety
      if (verifiedOnly && !partner.verified) return false;
      if (topRatedOnly && partner.rating < 4.8) return false;

      // Quick filter tags
      if (panIndiaOnly && !partner.location.includes('India') && partner.region !== 'India') return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return b.establishedYear - a.establishedYear;
      if (sortBy === 'orders') return a.minOrderValue - b.minOrderValue;
      // Default: Recommended (verified first, then highest rating)
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return b.rating - a.rating;
    });
  }, [
    partners,
    searchQuery,
    selectedCity,
    selectedCategory,
    businessTypeFilters,
    verifiedOnly,
    topRatedOnly,
    panIndiaOnly,
    sortBy,
    quickFilter,
    bookmarkedIds
  ]);

  const displayedSuppliers = filteredSuppliers.slice(0, visibleCount);

  // Helper to trigger direct WhatsApp or Call
  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsappNum: string | undefined, partnerName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const num = (whatsappNum || '+919820012345').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${partnerName}, I discovered your verified profile on Nexora Luxe. I would like to request your wholesale salon catalog and backbar pricing.`
    );
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-[#FCF9F8] text-[#1C1B1B] pb-24 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-4 pb-2 flex justify-between items-center">
        <nav aria-label="Breadcrumb" className="flex text-sm text-[#594047]">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <a href="#" className="text-xs font-medium hover:text-[#B90064] transition-colors">Home</a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-xs mx-1">›</span>
                <a href="#" className="text-xs font-medium hover:text-[#B90064] transition-colors">Beauty Industry Directory</a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="text-xs mx-1">›</span>
                <span className="text-xs font-bold text-[#B90064]">Beauty Suppliers &amp; Manufacturers</span>
              </div>
            </li>
          </ol>
        </nav>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#594047] hover:text-[#B90064] bg-white border border-[#E8E8E8] px-3 py-1.5 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Share Directory</span>
        </button>
      </div>

      {/* Direct-Contact Trust Strip */}
      <div className="bg-[#F7F2F2] border-y border-[#E8E8E8] py-2.5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2 text-[#B90064] font-bold text-xs md:text-sm">
            <MessageCircle className="w-4 h-4" />
            <span className="uppercase tracking-wider">Direct Supplier Connection</span>
          </div>
          <span className="hidden sm:inline text-[#594047]">•</span>
          <p className="text-xs md:text-sm text-[#594047]">
            Call or WhatsApp suppliers directly — no middleman brokerage.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12 flex flex-col lg:flex-row items-center gap-10 relative">
        {/* Live Manufacturer Indicator */}
        <div className="absolute top-2 right-4 md:right-10 z-20 animate-pulse hidden sm:block">
          <div className="bg-white/80 backdrop-blur-md border border-white/40 px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#25D366]"></span>
            <span className="text-[11px] font-semibold text-[#594047] uppercase tracking-wider">
              <span className="font-bold text-[#1C1B1B]">14 Manufacturers online now</span> | 240+ quotes sent today
            </span>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B90064]/5 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-[#FDE7F3]/50 rounded-full blur-3xl"></div>
        </div>

        {/* Text & Search Content */}
        <div className="flex-1 flex flex-col gap-6 z-10 lg:max-w-xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1C1B1B] leading-tight tracking-tight">
              India’s Premier B2B <br />
              <span className="text-[#B90064]">Beauty Sourcing Network</span>
            </h1>
            <p className="text-base md:text-lg text-[#594047] leading-relaxed">
              Discover products, brands, manufacturers, wholesalers, and distributors across the professional beauty industry with 0% brokerage.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* AI Toggle */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setVerifiedOnly(true);
                  setTopRatedOnly(true);
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#B90064] to-[#8E004B] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>✨ AI Smart Match</span>
              </button>
              <span className="text-xs text-[#594047] font-medium">Auto-find best suppliers</span>
            </div>

            {/* Master Search Bar Container */}
            <div className="bg-white/40 backdrop-blur-md border border-white/50 shadow-lg flex flex-col lg:flex-row items-stretch rounded-2xl p-2 gap-2 relative z-20">
              {/* Search Keyword Input */}
              <div className="flex-1 flex items-center px-4 gap-3 border-b lg:border-b-0 lg:border-r border-[#E8E8E8] py-2 lg:py-1">
                <Search className="w-5 h-5 text-[#B90064] shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-none focus:ring-0 text-sm text-[#1C1B1B] placeholder:text-[#594047]/70 bg-transparent outline-none font-medium"
                  placeholder="Search products, brands, suppliers, equipment..."
                  type="text"
                />
              </div>

              {/* Business / Partner Type Dropdown */}
              <div className="flex-1 flex items-center px-4 gap-3 border-b lg:border-b-0 lg:border-r border-[#E8E8E8] py-2 lg:py-1">
                <Building2 className="w-5 h-5 text-[#B90064] shrink-0" />
                <select
                  value={activeFilterType}
                  onChange={(e) => handleFilterTypeChange(e.target.value as any)}
                  className="w-full border-none focus:ring-0 text-sm text-[#1C1B1B] bg-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="all">All Suppliers & Businesses</option>
                  <option value="brands">Brands</option>
                  <option value="oem_manufacturers">Manufacturers / OEM</option>
                  <option value="wholesalers">Wholesalers</option>
                  <option value="verified_distributors">Verified Distributors</option>
                </select>
              </div>

              {/* Category Dropdown */}
              <div className="flex-1 flex items-center px-4 gap-3 border-b lg:border-b-0 lg:border-r border-[#E8E8E8] py-2 lg:py-1">
                <Layers className="w-5 h-5 text-[#B90064] shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full border-none focus:ring-0 text-sm text-[#1C1B1B] bg-transparent outline-none cursor-pointer font-medium"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location / City Dropdown */}
              <div className="flex-1 flex items-center px-4 gap-3 py-2 lg:py-1">
                <MapPin className="w-5 h-5 text-[#B90064] shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border-none focus:ring-0 text-sm text-[#1C1B1B] bg-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="">Pan India (All Cities)</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="jaipur">Jaipur</option>
                  <option value="delhi">Delhi NCR</option>
                  <option value="bangalore">Bengaluru</option>
                  <option value="kolkata">Kolkata</option>
                  <option value="chennai">Chennai</option>
                  <option value="pune">Pune</option>
                  <option value="hyderabad">Hyderabad</option>
                  <option value="ahmedabad">Ahmedabad</option>
                </select>
              </div>

              {/* Master Search Button */}
              <button
                onClick={() => {
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#B90064] text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#8E004B] transition-all w-full lg:w-auto justify-center shadow-[0_4px_14px_0_rgba(185,0,100,0.39)] hover:shadow-[0_6px_20px_rgba(185,0,100,0.5)] hover:-translate-y-0.5 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Trending Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-[#594047] uppercase tracking-wider mr-1">Trending:</span>
              <button
                onClick={() => handleFilterTypeChange('verified_distributors')}
                className={`border px-3.5 py-1 rounded-full text-xs font-semibold hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                  activeFilterType === 'verified_distributors'
                    ? 'bg-[#B90064] text-white border-[#B90064]'
                    : 'bg-white/80 border-[#E8E8E8] text-[#B90064] hover:bg-white'
                }`}
              >
                #Verified Distributors ({filterTypeCounts.verifiedDistributors})
              </button>
              <button
                onClick={() => handleFilterTypeChange('oem_manufacturers')}
                className={`border px-3.5 py-1 rounded-full text-xs font-semibold hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                  activeFilterType === 'oem_manufacturers'
                    ? 'bg-[#B90064] text-white border-[#B90064]'
                    : 'bg-white/80 border-[#E8E8E8] text-[#B90064] hover:bg-white'
                }`}
              >
                #OEM Manufacturers ({filterTypeCounts.oemManufacturers})
              </button>
              <button
                onClick={() => handleFilterTypeChange('wholesalers')}
                className={`border px-3.5 py-1 rounded-full text-xs font-semibold hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                  activeFilterType === 'wholesalers'
                    ? 'bg-[#B90064] text-white border-[#B90064]'
                    : 'bg-white/80 border-[#E8E8E8] text-[#B90064] hover:bg-white'
                }`}
              >
                #Wholesalers ({filterTypeCounts.wholesalers})
              </button>
              <button
                onClick={() => setSelectedCategory('makeup')}
                className={`border px-3.5 py-1 rounded-full text-xs font-semibold hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                  selectedCategory === 'makeup'
                    ? 'bg-[#B90064] text-white border-[#B90064]'
                    : 'bg-white/80 border-[#E8E8E8] text-[#B90064] hover:bg-white'
                }`}
              >
                #Cosmetic Brands
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid (3 Cards) */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
          {/* Card 1 */}
          <div
            onClick={() => {
              setSelectedCategory('skincare');
              document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group cursor-pointer active:scale-[0.98]"
          >
            <img
              alt="Premium Brands"
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ooDqyMa-n6eza8fP9pd_mNfHg3uGDmaE4tYTMN2rr2uB9cwtSYXfF5wRoqYClzJ6mEC8tFjckfCAj59rvAo6qWk5-xCqriNuDQQRBxDGzcywsu9TbvyRKBHMR-jaqV4VZa3Il5uW8SjUHj7kr7boJLE6tLGbw66umNSRoeJTEvkQn6shOO0KYJ61IOfP2R7P4HKfbG28iuq2Z5Kv7lfHsBkfADbZVXrI06VyYKhXGzgyLLJA2sxk"
            />
            <div className="p-5 flex flex-col flex-1 gap-2.5">
              <h3 className="text-base font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors">
                Explore Premium Beauty Brands
              </h3>
              <p className="text-xs text-[#594047] flex-1 leading-relaxed">
                Source advanced formulations from top nationwide distributors.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('skincare');
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 bg-[#B90064] text-white text-center py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8E004B] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Shop Brands
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => {
              setSelectedCategory('tools');
              document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group cursor-pointer active:scale-[0.98]"
          >
            <img
              alt="Professional Tools"
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5r0_maUiBhLmrfcDdTuI3bdAPEdxI2QdZDO3ZJLhP-Y46j7KfUnpR2aSGd7mIWie43A51GSYDMIOCOGh-mwDWftrlF3i46berkcU9yRJ-vNqMnheyU-iZoYK8S0Gp8HD5BK980wehIBSwcUXMgnulEuFHh8l_lVB-ZbCgb2-8nDtD9YsXxZML2QePvLMISczGQAPvyx9t4FfgVPbZuSaHidZvHlV4fSjJ90tG2Ir8euEcF1CishJr"
            />
            <div className="p-5 flex flex-col flex-1 gap-2.5">
              <h3 className="text-base font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors">
                Bulk Salon Hardware &amp; Tools
              </h3>
              <p className="text-xs text-[#594047] flex-1 leading-relaxed">
                Equip your salon with high-performance professional equipment.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory('tools');
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 bg-[#B90064] text-white text-center py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8E004B] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Browse Equipment
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => {
              handleFilterTypeChange('oem_manufacturers');
              document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 group cursor-pointer active:scale-[0.98]"
          >
            <img
              alt="Manufacturing"
              className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeOBMvS3evDS53yZztkYy3n3-H7LqwnKQJhD9wWiNGXpJViIpsaWN4cXvTw0Bh90JZLGcdH7pO1-yaAXQNHrABdj2c0A0p0gMH_PRdPzsKclyJ6OhivoI-IT1D4lzFH94z3IphpE6CghK9UmrzHeatYwmK-hQOVpIReBl9XhuHBkc-RxQwJlRvzp2XPG4UWzNPTikUSndlHATB3nDlNp7tRv1oeaMpYLH2b8xSWk4EhlshvPRYOYTD"
            />
            <div className="p-5 flex flex-col flex-1 gap-2.5">
              <h3 className="text-base font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors">
                Direct Factory &amp; OEM Sourcing
              </h3>
              <p className="text-xs text-[#594047] flex-1 leading-relaxed">
                Partner with trusted manufacturers to launch your custom beauty line.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterTypeChange('oem_manufacturers');
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-2 bg-[#B90064] text-white text-center py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8E004B] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Connect Factory
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section className="border-y border-[#E8E8E8] bg-white my-4 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FDE7F3] flex items-center justify-center text-[#B90064] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1C1B1B]">10,000+</p>
                <p className="text-xs font-semibold text-[#594047] uppercase tracking-wider">Verified Suppliers</p>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-[#E8E8E8]"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FDE7F3] flex items-center justify-center text-[#B90064] shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1C1B1B]">50,000+</p>
                <p className="text-xs font-semibold text-[#594047] uppercase tracking-wider">Beauty Products</p>
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-[#E8E8E8]"></div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FDE7F3] flex items-center justify-center text-[#B90064] shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1C1B1B]">100% Free</p>
                <p className="text-xs font-semibold text-[#594047] uppercase tracking-wider">Direct Connect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supplier Acquisition Compact Banner */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-[#F7F2F2] rounded-3xl p-6 lg:p-8 border border-[#E8E8E8]">
          <div className="flex-1 max-w-2xl flex flex-col gap-3">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#1C1B1B] leading-tight">
              Are you a Beauty Brand, Manufacturer, or Distributor?
            </h2>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-[#594047] uppercase tracking-wider">
              <span className="flex items-center gap-1 text-[#B90064]">
                <CheckCircle2 className="w-4 h-4" /> Direct WhatsApp &amp; Call Leads
              </span>
              <span className="flex items-center gap-1 text-[#B90064]">
                <CheckCircle2 className="w-4 h-4" /> 0% Commission
              </span>
              <span className="flex items-center gap-1 text-[#B90064]">
                <CheckCircle2 className="w-4 h-4" /> Dedicated Page
              </span>
            </div>
          </div>
          <div>
            <button
              onClick={onOpenRegister}
              className="bg-[#B90064] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8E004B] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
            >
              <span>Register Business</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Businesses Quick Grid */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 my-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[#B90064] font-bold tracking-widest uppercase text-xs">NEXORA DIRECTORY</span>
            <h3 className="text-2xl font-extrabold text-[#1C1B1B] mt-1">Featured Beauty Businesses</h3>
          </div>
          <button
            onClick={() => {
              setVerifiedOnly(true);
              document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[#B90064] font-bold text-xs uppercase tracking-wider hover:underline cursor-pointer"
          >
            View All Verified
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.slice(0, 3).map((partner) => (
            <div key={partner.id} className="bg-white rounded-2xl p-6 border border-[#E8E8E8] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF0F5] border border-[#E8E8E8] flex items-center justify-center font-extrabold text-[#B90064] text-lg shrink-0">
                    {partner.initials || partner.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-[#1C1B1B] truncate flex items-center gap-1.5">
                      <span>{partner.name}</span>
                      {partner.verified && <CheckCircle2 className="w-4 h-4 text-[#B90064] shrink-0" />}
                    </h4>
                    <p className="text-xs text-[#594047] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#B90064]" /> {partner.location}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#594047] line-clamp-2 mb-4 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#E8E8E8]">
                <button
                  onClick={() => onSelectPartner(partner)}
                  className="flex-1 bg-[#FFF0F5] text-[#B90064] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#B90064] hover:text-white transition-colors text-center cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => handleWhatsApp(partner.whatsapp, partner.name, e)}
                  className="p-2.5 border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-colors cursor-pointer"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleCall(partner.phone, e)}
                  className="p-2.5 border border-[#E8E8E8] bg-[#F7F2F2] text-[#1C1B1B] rounded-xl hover:text-[#B90064] hover:border-[#B90064] transition-colors cursor-pointer"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Category Strip */}
      <section className="w-full border-b border-[#E8E8E8] bg-white overflow-hidden shadow-2xs z-20 relative sticky top-[73px]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-4 flex overflow-x-auto hide-scrollbar gap-5 sm:gap-6 items-center">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-2 group min-w-[80px] cursor-pointer active:scale-95 transition-transform"
              >
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shrink-0 group cursor-pointer flex flex-col items-center justify-center p-1 text-center transition-all duration-300 shadow-md ${
                    isActive
                      ? 'border-2 border-[#FFD700] ring-4 ring-[#FFD700]/30 shadow-2xl scale-105'
                      : 'border border-white/50 hover:border-white hover:scale-105'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 duration-300 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                  <div className="relative z-10 flex flex-col items-center justify-center text-white">
                    <Icon className="w-5 h-5 mb-0.5 text-white" />
                  </div>
                </div>
                <span
                  className={`text-xs font-bold tracking-tight transition-colors ${
                    isActive ? 'text-[#B90064]' : 'text-[#594047] group-hover:text-[#B90064]'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Nexora Directory Header & Tabs */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 pt-6 pb-2">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF0F5] text-[#B90064] border border-[#FFD6E5]">
              Nexora Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1C1B1B] mb-2 tracking-tight">
            Partner Directory
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#594047] max-w-2xl">
            Discover and connect with top-tier beauty brands, manufacturers, wholesalers, and distributors in our exclusive sourcing network.
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2.5 mb-6 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setQuickFilter(quickFilter === 'recent' ? 'none' : 'recent')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              quickFilter === 'recent'
                ? 'bg-[#B90064] text-white border-[#B90064] shadow-xs'
                : 'bg-white text-[#594047] border-[#E8E8E8] hover:bg-[#F7F2F2] hover:text-[#B90064]'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setQuickFilter(quickFilter === 'favorites' ? 'none' : 'favorites')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              quickFilter === 'favorites'
                ? 'bg-[#B90064] text-white border-[#B90064] shadow-xs'
                : 'bg-white text-[#594047] border-[#E8E8E8] hover:bg-[#F7F2F2] hover:text-[#B90064]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Favorites ({bookmarkedIds.length})</span>
          </button>
          <button
            onClick={() => setQuickFilter(quickFilter === 'near_me' ? 'none' : 'near_me')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              quickFilter === 'near_me'
                ? 'bg-[#B90064] text-white border-[#B90064] shadow-xs'
                : 'bg-white text-[#594047] border-[#E8E8E8] hover:bg-[#F7F2F2] hover:text-[#B90064]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Near Me</span>
          </button>
          <button
            onClick={() => {
              document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="shrink-0 px-4 py-1.5 rounded-full bg-white text-[#594047] text-xs font-bold border border-[#E8E8E8] hover:bg-[#F7F2F2] hover:text-[#B90064] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Horizontal Directory Tabs */}
        <div className="relative border-b border-[#E8E8E8]">
          <div className="flex gap-6 sm:gap-8 overflow-x-auto hide-scrollbar" role="tablist">
            <button
              onClick={() => handleFilterTypeChange('all')}
              className={`relative pb-3 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-2 ${
                activeFilterType === 'all' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#B90064]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>All</span>
              {activeFilterType === 'all' && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B90064] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => handleFilterTypeChange('brands')}
              className={`relative pb-3 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-2 ${
                activeFilterType === 'brands' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#B90064]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Brands</span>
              {activeFilterType === 'brands' && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B90064] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => handleFilterTypeChange('oem_manufacturers')}
              className={`relative pb-3 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-2 ${
                activeFilterType === 'oem_manufacturers' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#B90064]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Manufacturers / OEM</span>
              {activeFilterType === 'oem_manufacturers' && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B90064] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => handleFilterTypeChange('wholesalers')}
              className={`relative pb-3 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-2 ${
                activeFilterType === 'wholesalers' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#B90064]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Wholesalers</span>
              {activeFilterType === 'wholesalers' && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B90064] rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => handleFilterTypeChange('verified_distributors')}
              className={`relative pb-3 text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-2 ${
                activeFilterType === 'verified_distributors' ? 'text-[#B90064]' : 'text-[#594047] hover:text-[#B90064]'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Distributors</span>
              {activeFilterType === 'verified_distributors' && (
                <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#B90064] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Directory Layout with Sidebar Filters and High Density Editorial Cards */}
      <div id="suppliers-results" className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-10 py-10 flex flex-col md:flex-row gap-8">
        {/* Left: Sidebar Filters (1/4 width) */}
        <aside className="w-full md:w-1/4 lg:w-[290px] flex flex-col gap-6 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-[#FCF9F8] flex justify-between items-center border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#B90064]" />
                <h2 className="text-base font-bold text-[#1C1B1B]">Filters</h2>
              </div>
              <button
                onClick={handleClearAll}
                className="text-xs text-[#B90064] hover:text-[#8E004B] transition-colors font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Accordion: Business Type */}
            <div className="border-b border-[#E8E8E8]">
              <button
                onClick={() => toggleSection('businessType')}
                className="w-full flex justify-between items-center p-5 text-sm font-bold text-[#1C1B1B] hover:bg-[#F7F2F2] transition-colors cursor-pointer"
              >
                <span>Business Type</span>
                {openSections.businessType ? (
                  <ChevronUp className="w-4 h-4 text-[#8C7077]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8C7077]" />
                )}
              </button>

              {openSections.businessType && (
                <div className="px-5 pb-5 flex flex-col gap-3.5">
                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.manufacturer}
                        onChange={(e) => {
                          setActiveFilterType('custom');
                          setBusinessTypeFilters((prev) => ({ ...prev, manufacturer: e.target.checked }));
                        }}
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Company / Manufacturer
                      </span>
                    </div>
                    <span className="text-xs text-[#594047] bg-[#F0EDEC] px-2 py-0.5 rounded-full font-semibold">
                      {filterTypeCounts.oemManufacturers}
                    </span>
                  </label>

                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.wholesaler}
                        onChange={(e) => {
                          setActiveFilterType('custom');
                          setBusinessTypeFilters((prev) => ({ ...prev, wholesaler: e.target.checked }));
                        }}
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Wholesaler
                      </span>
                    </div>
                    <span className="text-xs text-[#594047] bg-[#F0EDEC] px-2 py-0.5 rounded-full font-semibold">
                      {filterTypeCounts.wholesalers}
                    </span>
                  </label>

                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.distributor}
                        onChange={(e) => {
                          setActiveFilterType('custom');
                          setBusinessTypeFilters((prev) => ({ ...prev, distributor: e.target.checked }));
                        }}
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Regional Distributor
                      </span>
                    </div>
                    <span className="text-xs text-[#594047] bg-[#F0EDEC] px-2 py-0.5 rounded-full font-semibold">
                      {filterTypeCounts.verifiedDistributors}
                    </span>
                  </label>

                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.importer}
                        onChange={(e) =>
                          setBusinessTypeFilters((prev) => ({ ...prev, importer: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Importer
                      </span>
                    </div>
                    <span className="text-xs text-[#594047] bg-[#F0EDEC] px-2 py-0.5 rounded-full font-semibold">
                      12
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Accordion: Trust & Safety */}
            <div className="border-b border-[#E8E8E8]">
              <button
                onClick={() => toggleSection('trustSafety')}
                className="w-full flex justify-between items-center p-5 text-sm font-bold text-[#1C1B1B] hover:bg-[#F7F2F2] transition-colors cursor-pointer"
              >
                <span>Trust & Safety</span>
                {openSections.trustSafety ? (
                  <ChevronUp className="w-4 h-4 text-[#8C7077]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8C7077]" />
                )}
              </button>

              {openSections.trustSafety && (
                <div className="px-5 pb-5 flex flex-col gap-3.5">
                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Nexora Verified Only
                      </span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#B90064]" />
                  </label>

                  <label className="flex justify-between items-center cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={topRatedOnly}
                        onChange={(e) => setTopRatedOnly(e.target.checked)}
                        className="w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#8C7077] cursor-pointer"
                      />
                      <span className="text-sm text-[#1C1B1B] group-hover:text-[#B90064] transition-colors font-medium">
                        Top Rated (4.8+)
                      </span>
                    </div>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </label>
                </div>
              )}
            </div>

            {/* Accordion: Location / Region */}
            <div>
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex justify-between items-center p-5 text-sm font-bold text-[#1C1B1B] hover:bg-[#F7F2F2] transition-colors cursor-pointer"
              >
                <span>Location Hub</span>
                {openSections.location ? (
                  <ChevronUp className="w-4 h-4 text-[#8C7077]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8C7077]" />
                )}
              </button>

              {openSections.location && (
                <div className="px-5 pb-5 flex flex-col gap-2">
                  {['Jaipur', 'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Pune'].map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city.toLowerCase() ? '' : city.toLowerCase())}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex justify-between items-center ${
                        selectedCity === city.toLowerCase()
                          ? 'bg-[#FFF0F5] text-[#B90064] font-bold border border-[#FFD6E5]'
                          : 'hover:bg-[#F0EDEC] text-[#594047]'
                      }`}
                    >
                      <span>{city}</span>
                      {selectedCity === city.toLowerCase() && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Apply Filters Button */}
            <div className="p-5 bg-[#FCF9F8] border-t border-[#E8E8E8]">
              <button
                onClick={() => {
                  document.getElementById('suppliers-results')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-[#B90064] text-white px-6 py-3 rounded-full text-xs font-bold hover:bg-[#8E004B] transition-colors duration-200 min-h-[44px] shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Supplier Registration Promo Card */}
          <div className="bg-gradient-to-br from-[#FFF5F8] via-[#FFF0F5] to-white border border-[#FFD6E5] rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#FFD6E5] text-[#B90064] flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1B1B]">Are you a Distributor?</h3>
              <p className="text-xs text-[#594047] mt-1 leading-relaxed">
                Connect with 12,000+ verified salons, spas, and aesthetic clinics across India and worldwide.
              </p>
            </div>
            <button
              onClick={onOpenRegister}
              className="mt-1 bg-[#B90064] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-[#8E004B] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>List Your Business</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* Right: Results Area (3/4 width) */}
        <section className="w-full flex-grow flex flex-col gap-6">
          {/* Business Type Quick Navigation Bar */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-1.5 flex flex-wrap sm:flex-nowrap gap-1.5 shadow-xs">
            <button
              onClick={() => handleFilterTypeChange('all')}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilterType === 'all'
                  ? 'bg-[#B90064] text-white shadow-md'
                  : 'text-[#594047] hover:bg-[#FDF8F8] hover:text-[#B90064]'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>All Suppliers</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeFilterType === 'all' ? 'bg-white/20 text-white' : 'bg-[#F0EDEC] text-[#594047]'
                }`}
              >
                {filterTypeCounts.all}
              </span>
            </button>

            <button
              onClick={() => handleFilterTypeChange('verified_distributors')}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilterType === 'verified_distributors'
                  ? 'bg-[#B90064] text-white shadow-md'
                  : 'text-[#594047] hover:bg-[#FDF8F8] hover:text-[#B90064]'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  activeFilterType === 'verified_distributors' ? 'text-white' : 'text-emerald-600'
                }`}
              />
              <span>Verified Distributors</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeFilterType === 'verified_distributors' ? 'bg-white/20 text-white' : 'bg-[#F0EDEC] text-[#594047]'
                }`}
              >
                {filterTypeCounts.verifiedDistributors}
              </span>
            </button>

            <button
              onClick={() => handleFilterTypeChange('oem_manufacturers')}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilterType === 'oem_manufacturers'
                  ? 'bg-[#B90064] text-white shadow-md'
                  : 'text-[#594047] hover:bg-[#FDF8F8] hover:text-[#B90064]'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>OEM Manufacturers</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeFilterType === 'oem_manufacturers' ? 'bg-white/20 text-white' : 'bg-[#F0EDEC] text-[#594047]'
                }`}
              >
                {filterTypeCounts.oemManufacturers}
              </span>
            </button>

            <button
              onClick={() => handleFilterTypeChange('wholesalers')}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilterType === 'wholesalers'
                  ? 'bg-[#B90064] text-white shadow-md'
                  : 'text-[#594047] hover:bg-[#FDF8F8] hover:text-[#B90064]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Wholesalers</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeFilterType === 'wholesalers' ? 'bg-white/20 text-white' : 'bg-[#F0EDEC] text-[#594047]'
                }`}
              >
                {filterTypeCounts.wholesalers}
              </span>
            </button>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1">
            <span className="text-xs font-bold text-[#594047] uppercase tracking-wider shrink-0 mr-1">Category:</span>
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-[#B90064] text-white border-[#B90064] shadow-sm'
                      : 'bg-white text-[#594047] border-[#E8E8E8] hover:border-[#B90064] hover:text-[#B90064]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-2 border-b border-[#E8E8E8]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-[#1C1B1B]">Premium Suppliers</h2>
                <div className="inline-flex items-center gap-1 bg-[#FFF0F5] border border-[#FFD6E5] text-[#B90064] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <span>{filteredSuppliers.length}</span>
                  <span className="font-normal text-[11px]">available</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#594047] mt-1">
                Showing curated manufacturers, regional distributors, and authorized wholesale suppliers
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs font-semibold text-[#594047] uppercase tracking-wider">Sort by:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-[#E8E8E8] rounded-full pl-4 pr-10 py-2 text-xs font-semibold text-[#1C1B1B] focus:outline-none focus:border-[#B90064] focus:ring-1 focus:ring-[#B90064] cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Established</option>
                  <option value="orders">Lowest MOQ</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#8C7077] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* High Density Editorial Cards Stack */}
          {displayedSuppliers.length > 0 ? (
            <div className="flex flex-col gap-6">
              {displayedSuppliers.map((supplier) => (
                <motion.article
                  key={supplier.id}
                  onClick={() => onSelectPartner(supplier)}
                  whileHover={{ y: -8, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-[#B90064]/12 hover:border-[#B90064]/50 transition-all duration-300 flex flex-col md:flex-row group cursor-pointer relative"
                >
                  {/* Left: Image Cover */}
                  <div className="w-full md:w-[290px] h-52 md:h-auto relative overflow-hidden flex-shrink-0 bg-neutral-100">
                    <img
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      src={
                        supplier.coverImage ||
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCK-1tyXdcZhq03-TknCZ3gj6usizy9FmYBWyXQZlEScGfVq8T_ErDPFErYxAkuiVtq1xmegqXRtquzvh_V0hgWSBFfHqkJEGEyePtXBmhFZ6NgHonkxGvxrYSpwS5NYPGs6yOR7iHtUhmsMalVUgxHJ4wqzY_LJBzIQYY0Dw-t7B46Jglat6owcHZ9QLSSfrM8ImMQbj_n3TvkV5O37biJ2dDtkDu9PgLKS34ZsO28OndThcLh2dUo'
                      }
                      alt={supplier.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent group-hover:from-black/75 transition-colors duration-500" />

                    {/* Verified vs Free Supplier Badge */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {supplier.verified ? (
                        <span className="bg-[#B90064] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider flex items-center gap-1 shadow-md group-hover:scale-105 transition-transform duration-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          NEXORA VERIFIED
                        </span>
                      ) : (
                        <span className="bg-white/90 backdrop-blur-xs text-[#1C1B1B] px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md border border-[#E8E8E8] group-hover:scale-105 transition-transform duration-300">
                          FREE SUPPLIER
                        </span>
                      )}
                    </div>

                    {/* Brand Avatar Overlay */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-white/95 backdrop-blur-xs rounded-xl shadow-md p-1 border border-[#E8E8E8] group-hover:scale-110 group-hover:shadow-lg transition-transform duration-300">
                      <div className="w-full h-full bg-[#FFF0F5] rounded-lg flex items-center justify-center font-extrabold text-[#B90064] text-lg">
                        {supplier.initials || supplier.name.charAt(0)}
                      </div>
                    </div>

                    {/* Bookmark Favorite Button */}
                    <button
                      onClick={(e) => toggleBookmark(supplier.id, e)}
                      className={`absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 z-10 cursor-pointer ${
                        bookmarkedIds.includes(supplier.id)
                          ? 'bg-[#B90064] text-white shadow-md'
                          : 'bg-white/80 text-[#1C1B1B] hover:bg-white hover:text-[#B90064]'
                      }`}
                      title={bookmarkedIds.includes(supplier.id) ? 'Remove Favorite' : 'Add Favorite'}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(supplier.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-grow p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors duration-200 flex items-center gap-2">
                            <span>{supplier.name}</span>
                            {supplier.verified && (
                              <CheckCircle2 className="w-4 h-4 text-[#B90064] shrink-0 inline group-hover:scale-110 transition-transform duration-200" />
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-[#594047]">
                            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#8C7077]">
                              {supplier.businessTypeDetail || `${supplier.type} & Wholesaler`}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[#E0BEC6]" />
                            <div className="flex items-center text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 inline mr-1" />
                              <span className="text-[#1C1B1B]">{supplier.rating.toFixed(1)}</span>
                              <span className="text-[#8C7077] font-normal ml-1">({supplier.reviewsCount})</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-[#E0BEC6]" />
                            <span>Est. {supplier.establishedYear}</span>
                          </div>
                        </div>

                        {/* Location Badge */}
                        <div className="flex items-center gap-1 text-[#594047] bg-[#F7F2F2] px-3 py-1.5 rounded-full border border-[#E8E8E8] text-xs font-medium self-start group-hover:border-[#B90064]/30 group-hover:bg-[#FFF0F5] group-hover:text-[#B90064] transition-colors duration-300">
                          <MapPin className="w-3.5 h-3.5 text-[#B90064]" />
                          <span>{supplier.location}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-[#594047] mt-2.5 leading-relaxed line-clamp-2">
                        {supplier.description}
                      </p>

                      {/* Horizontal Product Thumbnail Strip */}
                      <div className="flex items-center gap-2.5 mt-4">
                        {(supplier.sampleImages || [
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuCNZWlxo1GE3RfXkL38ez9qU0PUaR7lM3gFLgHj5X30C7AnefXJPRYe2XMQqGRC7kE4z1Ktw4Jz9S_xpPzIMskSLPI-FbsfkH_mUOuZZidEIttsWlQ0Coo_R_tTmGPebKfznKeY_IPlVFQ16VrVlkTKasvjuTQY8Jd6Bq0yu2WpICmzZWm8IeXqxKd0DFZWWWVDR-trwOaAQD98vBxOIhHXcEUtC_R0Amcxb44DE-fqXreE85PhKhjK',
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuDnJB1h3l7QdG5inXNig2zQ_SNPj47UYUQuqySdluwxz_WqsOistnvQgDWWr3KGPj9W88GD4v4WsKhV2my9Jjy_HBdVevJqKf2wnkEYAriuiq3-SgtrzyleSHjA348ir1OZ8UydadWzsQs41aVeB2R8L4xXTjgtlv1pj7JY-dILg8my7KJaI8GQXw6frw3-h0vYuO9uFdSdR1y92b_ujj1iMWbHUtBgy_O8AKm7I1eHK42mxiWySf5T'
                        ]).map((imgSrc, i) => (
                          <div
                            key={i}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#F0EDEC] border border-[#E8E8E8] overflow-hidden shrink-0 group/thumb transition-all duration-300 hover:border-[#B90064] hover:shadow-md hover:-translate-y-0.5"
                          >
                            <img src={imgSrc || undefined} alt="Sample product" className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                          </div>
                        ))}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#F7F2F2] border border-[#E8E8E8] flex flex-col items-center justify-center text-[#594047] text-xs font-bold shrink-0 hover:bg-[#FFF0F5] hover:border-[#B90064]/30 hover:text-[#B90064] transition-colors duration-300 cursor-pointer">
                          <span>+{supplier.productCount > 0 ? supplier.productCount : 12}</span>
                          <span className="text-[9px] font-normal text-[#8C7077]">items</span>
                        </div>

                        {/* Logistics preview */}
                        <div className="hidden lg:flex flex-col text-[11px] text-[#594047] ml-3 pl-3 border-l border-[#E8E8E8]">
                          <span className="font-semibold text-[#1C1B1B]">Response: <strong className="text-[#B90064] font-bold">{supplier.responseRate}</strong></span>
                          <span className="text-[#8C7077]">Min Order: ${supplier.minOrderValue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5 pt-4 border-t border-[#F0EDEC]">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {supplier.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-[#FCF9F8] border border-[#E0BEC6] px-3 py-1 rounded-md text-[11px] font-semibold text-[#594047] hover:bg-[#FFF0F5] hover:border-[#B90064]/40 hover:text-[#B90064] transition-colors duration-200 cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPartner(supplier);
                          }}
                          className="px-5 py-2 rounded-full border border-[#B90064] text-[#B90064] text-xs hover:bg-[#B90064] hover:text-white transition-all duration-200 font-bold shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          View Profile
                        </button>

                        <button
                          onClick={(e) => handleCall(supplier.phone, e)}
                          className="w-9 h-9 rounded-full bg-[#F7F2F2] border border-[#E8E8E8] flex items-center justify-center text-[#1C1B1B] hover:text-[#B90064] hover:border-[#B90064] hover:bg-white hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                          title="Call Supplier"
                        >
                          <Phone className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleWhatsApp(supplier.whatsapp, supplier.name, e)}
                          className="w-9 h-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#B90064] flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1C1B1B]">No suppliers found</h3>
              <p className="text-xs text-[#594047] max-w-md">
                We couldn't find any suppliers matching your current filter criteria. Try clearing some filters or searching for another category.
              </p>
              <button
                onClick={handleClearAll}
                className="mt-2 bg-[#B90064] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#8E004B] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination / Load More Button */}
          {visibleCount < filteredSuppliers.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="bg-white border border-[#8C7077] text-[#1C1B1B] px-8 py-3 rounded-full text-xs font-bold hover:bg-[#F7F2F2] transition-colors duration-200 min-h-[44px] shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <span>Load More Results</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Digital Showroom / Share Profile Section */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text & Actions (Left, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#1C1B1B] leading-tight tracking-tight">
                Your Digital<br />
                <span className="text-[#B90064] italic font-serif">Showroom</span>
              </h2>
              <p className="text-base md:text-lg text-[#594047] leading-relaxed">
                Share your verified profile directly with buyers. One link for your entire catalog, certifications, and contact details.
              </p>
            </div>
            <div className="bg-[#F7F2F2] p-6 md:p-8 border-l-4 border-[#B90064] rounded-r-2xl">
              <p className="text-xs font-bold text-[#594047] uppercase tracking-widest mb-4">
                Share via WhatsApp
              </p>
              <div className="bg-white p-4 border border-[#E8E8E8] rounded-xl mb-6 text-xs md:text-sm text-[#594047] font-mono leading-relaxed">
                "Hi, check out our professional beauty catalog and wholesale pricing on Nexora: nexora.com/supplier/lumina-cosmetics"
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Hi, check out our professional beauty catalog and wholesale pricing on Nexora: nexora.com/supplier/lumina-cosmetics')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-all duration-200 w-full sm:w-auto shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('nexora.com/supplier/lumina-cosmetics');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="bg-[#ECE7E7] text-[#1C1B1B] px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#E6E1E1] transition-all duration-200 w-full sm:w-auto cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mockup (Right, 7 cols) */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-[#FDE7F3]/50 -ml-6 md:-ml-8 mt-6 md:mt-8 rounded-3xl z-0"></div>
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl shadow-xl z-10 relative overflow-hidden group transition-all duration-500 hover:scale-[1.03] sm:hover:scale-[1.05] hover:shadow-2xl hover:shadow-[#B90064]/15 hover:border-white cursor-pointer">
              <div className="h-48 overflow-hidden">
                <img
                  alt="Lumina Cosmetics Cover"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5r0_maUiBhLmrfcDdTuI3bdAPEdxI2QdZDO3ZJLhP-Y46j7KfUnpR2aSGd7mIWie43A51GSYDMIOCOGh-mwDWftrlF3i46berkcU9yRJ-vNqMnheyU-iZoYK8S0Gp8HD5BK980wehIBSwcUXMgnulEuFHh8l_lVB-ZbCgb2-8nDtD9YsXxZML2QePvLMISczGQAPvyx9t4FfgVPbZuSaHidZvHlV4fSjJ90tG2Ir8euEcF1CishJr"
                />
              </div>
              <div className="px-6 md:px-8 pb-8 relative">
                <div className="w-24 h-24 bg-white/90 backdrop-blur-sm border-4 border-white shadow-lg rounded-full overflow-hidden -mt-12 relative z-20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#B90064]/20">
                  <span className="font-serif text-3xl text-[#B90064] font-bold group-hover:scale-110 transition-transform duration-300">L</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-2xl font-extrabold text-[#1C1B1B]">Lumina Cosmetics</h3>
                  <CheckCircle2 className="w-6 h-6 text-[#B90064]" title="Verified Supplier" />
                </div>
                <div className="flex items-center gap-2 mt-2 text-[#594047] bg-[#F7F2F2] w-max px-3 py-1.5 rounded-lg border border-[#E8E8E8]">
                  <LinkIcon className="w-4 h-4 text-[#B90064]" />
                  <span className="font-mono text-xs md:text-sm font-semibold">nexora.com/supplier/lumina-cosmetics</span>
                </div>
                <div className="mt-6 flex items-center justify-around gap-4 border-t border-[#E8E8E8] pt-6">
                  <div className="text-center">
                    <div className="font-bold text-xl text-[#1C1B1B]">150+</div>
                    <div className="text-[11px] text-[#594047] uppercase tracking-wider font-semibold">Products</div>
                  </div>
                  <div className="w-px h-10 bg-[#E8E8E8]"></div>
                  <div className="text-center">
                    <div className="font-bold text-xl text-[#1C1B1B]">OEM</div>
                    <div className="text-[11px] text-[#594047] uppercase tracking-wider font-semibold">Capabilities</div>
                  </div>
                  <div className="w-px h-10 bg-[#E8E8E8]"></div>
                  <div className="text-center">
                    <div className="font-bold text-xl text-[#1C1B1B]">ISO</div>
                    <div className="text-[11px] text-[#594047] uppercase tracking-wider font-semibold">Certified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acquisition Banner Section */}
      <section className="bg-[#B90064] py-16 md:py-20 relative overflow-hidden my-8">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <img
            alt="Background Texture"
            className="w-full h-full object-cover grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ooDqyMa-n6eza8fP9pd_mNfHg3uGDmaE4tYTMN2rr2uB9cwtSYXfF5wRoqYClzJ6mEC8tFjckfCAj59rvAo6qWk5-xCqriNuDQQRBxDGzcywsu9TbvyRKBHMR-jaqV4VZa3Il5uW8SjUHj7kr7boJLE6tLGbw66umNSRoeJTEvkQn6shOO0KYJ61IOfP2R7P4HKfbG28iuq2Z5Kv7lfHsBkfADbZVXrI06VyYKhXGzgyLLJA2sxk"
          />
        </div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-8">
              <h2 className="text-white font-black text-4xl sm:text-5xl md:text-7xl leading-[1.1] tracking-tighter uppercase">
                Zero<br />
                Brokerage.<br />
                Infinite<br />
                Reach.
              </h2>
              <div className="h-1 w-24 bg-white/30 rounded-full"></div>
              <p className="text-white/90 text-lg md:text-2xl font-light max-w-lg leading-relaxed">
                Join India's fastest growing B2B network. Get direct buyer inquiries with 100% free registration and absolutely no commission fees.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenRegister}
                  className="inline-flex items-center justify-center bg-white text-[#B90064] px-8 py-5 rounded-2xl font-bold text-base md:text-lg uppercase tracking-widest hover:bg-[#FDE7F3] transition-all duration-300 w-full sm:w-auto text-center shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                >
                  <span>Register Business Now</span>
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full"></div>
              <img
                alt="Professional Manufacturing"
                className="w-full h-[480px] object-cover relative z-10 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-8 border-white/10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeOBMvS3evDS53yZztkYy3n3-H7LqwnKQJhD9wWiNGXpJViIpsaWN4cXvTw0Bh90JZLGcdH7pO1-yaAXQNHrABdj2c0A0p0gMH_PRdPzsKclyJ6OhivoI-IT1D4lzFH94z3IphpE6CghK9UmrzHeatYwmK-hQOVpIReBl9XhuHBkc-RxQwJlRvzp2XPG4UWzNPTikUSndlHATB3nDlNp7tRv1oeaMpYLH2b8xSWk4EhlshvPRYOYTD"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Verified Distributor Video Testimonials & Highlights Section */}
      {videoTestimonials.length > 0 && onSelectVideo && (
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 md:px-10 pt-8">
          <div className="border-t border-[#E8E8E8] pt-10">
            <VideoTestimonials
              videos={videoTestimonials}
              distributors={partners}
              products={products}
              onSelectVideo={onSelectVideo}
              onOpenSubmitModal={onOpenSubmitModal}
              onAddToQuote={onAddToQuote}
              onSelectSupplier={(supplierId) => {
                const partner = partners.find((p) => p.id === supplierId);
                if (partner) onSelectPartner(partner);
              }}
              likedVideoIds={likedVideoIds}
              onLikeVideo={onLikeVideo}
              title="Verified Distributor Video Highlights"
              subtitle="Watch high-definition backbar demonstrations, chemical peel unboxings, and clinic protocol trials recorded by authorized suppliers."
            />
          </div>
        </div>
      )}

      {/* Share Profile Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E8] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#E8E8E8] bg-[#FCF9F8]">
              <h3 className="font-bold text-base text-[#1C1B1B]">Share Directory</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-[#594047] hover:text-[#1C1B1B] p-1 rounded-full hover:bg-[#F7F2F2] transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* Preview Card */}
              <div className="border border-[#E8E8E8] rounded-xl p-4 bg-[#F7F2F2] flex flex-col gap-3 relative overflow-hidden shadow-xs">
                <div className="absolute top-0 right-0 bg-[#B90064]/10 text-[#B90064] px-2.5 py-1 rounded-bl-lg text-[10px] uppercase font-extrabold flex items-center gap-1 border-b border-l border-[#B90064]/20">
                  <CheckCircle2 className="w-3 h-3" /> NEXORA VERIFIED
                </div>
                <div className="flex items-center gap-3.5 mt-2">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E8E8E8] flex items-center justify-center shrink-0 shadow-xs text-[#B90064]">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-sm text-[#1C1B1B] leading-tight">Nexora B2B Directory</h4>
                    <p className="text-[11px] text-[#594047] uppercase flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#B90064]" /> India-wide Network
                    </p>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-[#E8E8E8] mt-1">
                  <p className="text-xs text-[#594047] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#B90064]" /> 10,000+ Verified Beauty Suppliers &amp; Brands
                  </p>
                </div>
              </div>

              {/* Share Options */}
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-[#594047] font-bold uppercase tracking-wider">Share directly to</p>
                <div className="flex items-center gap-4 justify-around">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent('Check out Nexora B2B Beauty Directory: nexora.com/directory')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-xs cursor-pointer"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('nexora.com/directory');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-12 h-12 rounded-full border border-[#E8E8E8] bg-[#F7F2F2] text-[#1C1B1B] flex items-center justify-center hover:bg-[#B90064] hover:text-white transition-all shadow-xs cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {/* Copy Link Input */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#594047] font-bold uppercase tracking-wider">Copy Link</p>
                <div className="flex items-center border border-[#E8E8E8] rounded-xl bg-white p-1.5 shadow-xs">
                  <input
                    readOnly
                    type="text"
                    value="nexora.com/directory"
                    className="flex-1 bg-transparent border-none text-xs text-[#594047] focus:ring-0 px-3 outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('nexora.com/directory');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="bg-[#B90064] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#8E004B] transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
