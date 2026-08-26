import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MapPin,
  X,
  SlidersHorizontal,
  Grid,
  List,
  ChevronDown,
  Heart,
  Store,
  Info,
  Zap,
  FlaskConical,
  MessageCircle,
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  Phone,
  Send,
  CheckCircle2,
  Award,
  Factory,
  Radio,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { SearchProduct, SearchSupplier, OEMFormulation } from '../types';
import { SEARCH_PRODUCTS, SEARCH_SUPPLIERS, SEARCH_OEM_FORMULATIONS } from '../data/mockData';
import { CATEGORY_TAXONOMY, CATEGORY_TAXONOMY_LIST } from '../data/categories';
import { ProductCompareModal } from './ProductCompareModal';
import { SupplierComparisonModal } from './SupplierComparisonModal';
import { FilterPanel } from './FilterPanel';
import { VerifiedBadge } from './VerifiedBadge';

interface SearchFilterScreenProps {
  initialQuery?: string;
  initialCategory?: string;
  initialLocation?: string;
  isSupplierSaved?: (supplierId: string) => boolean;
  onToggleSaveSupplier?: (supplierId: string, supplierName?: string) => void;
  onOpenEnquiryModal: (item: any) => void;
  onOpenQuoteModal: (rfq: any) => void;
  onOpenRFQModal: () => void;
  onOpenMapModal?: (supplier: any) => void;
  onNavigateToExplore: () => void;
  onCallSupplier: (name: string) => void;
  onWhatsAppSupplier: (name: string) => void;
  onNavigate: (screen: any, params?: any) => void;
}

export const SearchFilterScreen: React.FC<SearchFilterScreenProps> = ({
  initialQuery = 'Professional Hair Serum',
  initialCategory = 'All',
  initialLocation = 'Mumbai, Maharashtra (+50 km)',
  isSupplierSaved,
  onToggleSaveSupplier,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenMapModal,
  onNavigateToExplore,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigate
}) => {
  // Search inputs
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);

  // Tab state
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'oem'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory !== 'All' ? [initialCategory] : ['Haircare']
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedSupplierTypes, setSelectedSupplierTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedMoqTiers, setSelectedMoqTiers] = useState<string[]>([]);
  const [selectedEstablishedYears, setSelectedEstablishedYears] = useState<string[]>([]);
  const [isGstOnly, setIsGstOnly] = useState(false);
  const [isIsoOnly, setIsIsoOnly] = useState(false);
  const [isNexoraVerifiedOnly, setIsNexoraVerifiedOnly] = useState(false);
  const [isBusinessVerifiedOnly, setIsBusinessVerifiedOnly] = useState(false);
  const [isExportReadyOnly, setIsExportReadyOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Category & Subcategory Data from CATEGORY_TAXONOMY
  const CATEGORIES = useMemo(() => {
    return Object.entries(CATEGORY_TAXONOMY).map(([name, subcategories]) => ({
      name,
      subcategories
    }));
  }, []);

  const availableSubcategories = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return CATEGORIES
      .filter(cat => selectedCategories.includes(cat.name))
      .flatMap(cat => cat.subcategories);
  }, [selectedCategories]);

  // Mobile Filter Drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Comparison State
  const [comparedProductIds, setComparedProductIds] = useState<string[]>(['sp-1', 'sp-2']);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [comparedSupplierIds, setComparedSupplierIds] = useState<string[]>([]);
  const [isSupplierCompareModalOpen, setIsSupplierCompareModalOpen] = useState(false);

  // Filter Toggles
  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const toggleMoqTier = (tier: string) => {
    setSelectedMoqTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleEstablishedYear = (yr: string) => {
    setSelectedEstablishedYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  // Active filter chips list
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    if (searchQuery.trim()) {
      chips.push({
        id: 'search-keyword',
        label: `Keyword: "${searchQuery}"`,
        onRemove: () => setSearchQuery('')
      });
    }

    selectedCategories.forEach((cat) => {
      chips.push({
        id: `cat-${cat}`,
        label: `Category: ${cat}`,
        onRemove: () => setSelectedCategories((prev) => prev.filter((c) => c !== cat))
      });
    });

    selectedSubcategories.forEach((sub) => {
      chips.push({
        id: `sub-${sub}`,
        label: sub,
        onRemove: () => setSelectedSubcategories((prev) => prev.filter((s) => s !== sub))
      });
    });

    selectedCertifications.forEach((cert) => {
      chips.push({
        id: `cert-${cert}`,
        label: `Cert: ${cert}`,
        onRemove: () => setSelectedCertifications((prev) => prev.filter((c) => c !== cert))
      });
    });

    selectedLocations.forEach((loc) => {
      chips.push({
        id: `loc-${loc}`,
        label: `📍 ${loc}`,
        onRemove: () => setSelectedLocations((prev) => prev.filter((l) => l !== loc))
      });
    });

    selectedMoqTiers.forEach((tier) => {
      const labelMap: Record<string, string> = {
        lt_50: 'MOQ < 50 units',
        '50_200': 'MOQ 50-200',
        '200_500': 'MOQ 200-500',
        gt_500: 'MOQ 500+'
      };
      chips.push({
        id: `moq-${tier}`,
        label: labelMap[tier] || `MOQ: ${tier}`,
        onRemove: () => setSelectedMoqTiers((prev) => prev.filter((t) => t !== tier))
      });
    });

    selectedEstablishedYears.forEach((yr) => {
      const yrMap: Record<string, string> = {
        '15_plus': '15+ Yrs Legacy',
        '10_15': '10-15 Yrs Established',
        '5_10': '5-10 Yrs Growth',
        lt_5: '< 5 Yrs Tech'
      };
      chips.push({
        id: `yr-${yr}`,
        label: yrMap[yr] || yr,
        onRemove: () => setSelectedEstablishedYears((prev) => prev.filter((y) => y !== yr))
      });
    });

    selectedSupplierTypes.forEach((type) => {
      chips.push({
        id: `type-${type}`,
        label: `Type: ${type}`,
        onRemove: () => setSelectedSupplierTypes((prev) => prev.filter((t) => t !== type))
      });
    });

    if (isGstOnly) {
      chips.push({
        id: 'filter-gst',
        label: 'GST Verified',
        onRemove: () => setIsGstOnly(false)
      });
    }

    if (isNexoraVerifiedOnly) {
      chips.push({
        id: 'filter-tier1',
        label: 'Nexora Verified',
        onRemove: () => setIsNexoraVerifiedOnly(false)
      });
    }

    if (isBusinessVerifiedOnly) {
      chips.push({
        id: 'filter-biz-ver',
        label: 'Business Audited',
        onRemove: () => setIsBusinessVerifiedOnly(false)
      });
    }

    if (isExportReadyOnly) {
      chips.push({
        id: 'filter-export-ready',
        label: 'Export Ready',
        onRemove: () => setIsExportReadyOnly(false)
      });
    }

    if (maxPrice < 5000) {
      chips.push({
        id: 'filter-price',
        label: `Max ₹${maxPrice}`,
        onRemove: () => setMaxPrice(5000)
      });
    }

    return chips;
  }, [
    searchQuery,
    selectedCategories,
    selectedSubcategories,
    selectedCertifications,
    selectedLocations,
    selectedMoqTiers,
    selectedEstablishedYears,
    selectedSupplierTypes,
    isGstOnly,
    isNexoraVerifiedOnly,
    isBusinessVerifiedOnly,
    isExportReadyOnly,
    maxPrice
  ]);

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedSupplierTypes([]);
    setSelectedLocations([]);
    setSelectedCertifications([]);
    setSelectedMoqTiers([]);
    setSelectedEstablishedYears([]);
    setIsGstOnly(false);
    setIsIsoOnly(false);
    setIsNexoraVerifiedOnly(false);
    setIsBusinessVerifiedOnly(false);
    setIsExportReadyOnly(false);
    setMaxPrice(5000);
    setLocationQuery('All India');
    setSearchQuery('');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const isRemoving = prev.includes(cat);
      if (isRemoving) {
        // Also remove subcategories belonging to this category
        const subcatsToRemove = CATEGORIES.find(c => c.name === cat)?.subcategories || [];
        setSelectedSubcategories(s => s.filter(sub => !subcatsToRemove.includes(sub)));
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const toggleSupplierType = (type: string) => {
    setSelectedSupplierTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompare = (id: string) => {
    setComparedProductIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 products at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleSupplierCompare = (id: string) => {
    setComparedSupplierIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 suppliers at a time.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedProducts = useMemo(() => {
    return SEARCH_PRODUCTS.filter((p) => comparedProductIds.includes(p.id));
  }, [comparedProductIds]);

  const comparedSuppliers = useMemo(() => {
    return SEARCH_SUPPLIERS.filter((s) => comparedSupplierIds.includes(s.id));
  }, [comparedSupplierIds]);

  // Helper matching functions for multi-selects
  const matchesLocationRegions = (locationStr: string, regions: string[]) => {
    if (regions.length === 0) return true;
    const loc = locationStr.toLowerCase();
    return regions.some((region) => {
      if (region === 'Maharashtra') return loc.includes('mumbai') || loc.includes('pune') || loc.includes('thane') || loc.includes('maharashtra') || loc.includes('mh');
      if (region === 'Delhi NCR') return loc.includes('delhi') || loc.includes('noida') || loc.includes('gurugram') || loc.includes('gurgaon') || loc.includes('ncr');
      if (region === 'Gujarat') return loc.includes('ahmedabad') || loc.includes('surat') || loc.includes('vadodara') || loc.includes('gujarat') || loc.includes('gj');
      if (region === 'Karnataka') return loc.includes('bengaluru') || loc.includes('bangalore') || loc.includes('karnataka') || loc.includes('ka');
      if (region === 'Tamil Nadu') return loc.includes('chennai') || loc.includes('tamil') || loc.includes('tn');
      if (region === 'Telangana') return loc.includes('hyderabad') || loc.includes('telangana') || loc.includes('ts');
      if (region === 'Pan India') return true;
      return loc.includes(region.toLowerCase());
    });
  };

  const matchesCertifications = (item: { isGmpCertified?: boolean; isIsoCertified?: boolean; isHalalCertified?: boolean; isOrganicCertified?: boolean; isFdaRegistered?: boolean; isCrueltyFree?: boolean; certifications?: string[] }, certs: string[]) => {
    if (certs.length === 0) return true;
    return certs.every((c) => {
      if (c === 'GMP') return item.isGmpCertified || item.certifications?.some(x => x.toLowerCase().includes('gmp'));
      if (c === 'ISO') return item.isIsoCertified || item.certifications?.some(x => x.toLowerCase().includes('iso'));
      if (c === 'Halal') return item.isHalalCertified || item.certifications?.some(x => x.toLowerCase().includes('halal'));
      if (c === 'Organic') return item.isOrganicCertified || item.certifications?.some(x => x.toLowerCase().includes('organic') || x.toLowerCase().includes('ecocert'));
      if (c === 'FDA') return item.isFdaRegistered || item.certifications?.some(x => x.toLowerCase().includes('fda'));
      if (c === 'Cruelty-Free') return item.isCrueltyFree || item.certifications?.some(x => x.toLowerCase().includes('cruelty') || x.toLowerCase().includes('vegan'));
      return true;
    });
  };

  const matchesMoq = (moqNum: number, tiers: string[]) => {
    if (tiers.length === 0) return true;
    return tiers.some((t) => {
      if (t === 'lt_50') return moqNum < 50;
      if (t === '50_200') return moqNum >= 50 && moqNum <= 200;
      if (t === '200_500') return moqNum > 200 && moqNum <= 500;
      if (t === 'gt_500') return moqNum > 500;
      return true;
    });
  };

  const matchesEstablishedYears = (yearNum: number | undefined, yrTiers: string[]) => {
    if (yrTiers.length === 0) return true;
    if (!yearNum) return true;
    const currentYear = 2026;
    const yearsActive = currentYear - yearNum;
    return yrTiers.some((yt) => {
      if (yt === '15_plus') return yearsActive >= 15;
      if (yt === '10_15') return yearsActive >= 10 && yearsActive < 15;
      if (yt === '5_10') return yearsActive >= 5 && yearsActive < 10;
      if (yt === 'lt_5') return yearsActive < 5;
      return true;
    });
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return SEARCH_PRODUCTS.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          p.title.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // Location match
      if (!matchesLocationRegions(p.supplierLocation, selectedLocations)) return false;

      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          if (!p.supplierLocation.toLowerCase().includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((c) => p.category.toLowerCase().includes(c.toLowerCase()));
        if (!matchesCat) return false;
      }

      // Subcategory match
      if (selectedSubcategories.length > 0) {
        const matchesSub = selectedSubcategories.some((s) => p.title.toLowerCase().includes(s.toLowerCase()));
        if (!matchesSub) return false;
      }

      // Certifications match
      if (!matchesCertifications(p, selectedCertifications)) return false;

      // MOQ match
      if (!matchesMoq(p.moqNumber, selectedMoqTiers)) return false;

      // Established year match
      if (!matchesEstablishedYears(p.establishedYearNumber, selectedEstablishedYears)) return false;

      // Supplier type match
      if (selectedSupplierTypes.length > 0) {
        const matchesType = selectedSupplierTypes.some((type) => p.supplierType.toLowerCase().includes(type.toLowerCase()));
        if (!matchesType) return false;
      }

      if (isGstOnly && !p.isGstVerified) return false;
      if (isIsoOnly && !p.isIsoCertified) return false;
      if (isNexoraVerifiedOnly && !p.isNexoraVerified) return false;
      if (isBusinessVerifiedOnly && !p.isBusinessVerified) return false;

      if (p.priceMin > maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating_desc') return (b.rating || 4.5) - (a.rating || 4.5);
      if (sortBy === 'price_asc') return a.priceMin - b.priceMin;
      if (sortBy === 'price_desc') return b.priceMin - a.priceMin;
      if (sortBy === 'moq_asc') return a.moqNumber - b.moqNumber;
      if (sortBy === 'established_asc') return (a.establishedYearNumber || 2015) - (b.establishedYearNumber || 2015);
      if (sortBy === 'most_enquired') return (b.moqNumber || 0) - (a.moqNumber || 0);
      return 0;
    });
  }, [
    searchQuery,
    selectedLocations,
    locationQuery,
    selectedCategories,
    selectedSubcategories,
    selectedCertifications,
    selectedMoqTiers,
    selectedEstablishedYears,
    selectedSupplierTypes,
    isGstOnly,
    isIsoOnly,
    isNexoraVerifiedOnly,
    isBusinessVerifiedOnly,
    maxPrice,
    sortBy
  ]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return SEARCH_SUPPLIERS.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.categories.some((c) => c.toLowerCase().includes(q)) ||
          s.type.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Location match
      const fullLoc = `${s.city} ${s.state} ${s.locationDetails?.industrialZone || ''}`;
      if (!matchesLocationRegions(fullLoc, selectedLocations)) return false;

      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          if (!fullLoc.toLowerCase().includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((cat) =>
          s.categories.some((sc) => sc.toLowerCase().includes(cat.toLowerCase()))
        );
        if (!matchesCat) return false;
      }

      // Supplier Type match
      if (selectedSupplierTypes.length > 0) {
        const matchesType = selectedSupplierTypes.some((type) => s.type.toLowerCase().includes(type.toLowerCase()));
        if (!matchesType) return false;
      }

      // Certifications match
      if (!matchesCertifications({
        isGmpCertified: s.isGmpCertified,
        isIsoCertified: s.isIsoCertified,
        isHalalCertified: s.isHalalCertified,
        isOrganicCertified: s.isOrganicCertified,
        isFdaRegistered: s.isFdaRegistered,
        isCrueltyFree: s.isCrueltyFree,
        certifications: s.certificationsList
      }, selectedCertifications)) return false;

      // Established years match
      if (!matchesEstablishedYears(s.establishedYearNumber, selectedEstablishedYears)) return false;

      if (isGstOnly && !s.isGstVerified) return false;
      if (isIsoOnly && !s.isIsoCertified) return false;
      if (isNexoraVerifiedOnly && !s.isNexoraVerified) return false;
      if (isBusinessVerifiedOnly && !s.isBusinessVerified) return false;
      if (isExportReadyOnly && !s.exportReady) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating_desc') return (b.rating || 4.5) - (a.rating || 4.5);
      if (sortBy === 'established_asc') return (a.establishedYearNumber || 2010) - (b.establishedYearNumber || 2010);
      if (sortBy === 'established_desc') return (b.establishedYearNumber || 2010) - (a.establishedYearNumber || 2010);
      if (sortBy === 'employees_desc') return (b.employeeCountNumber || 50) - (a.employeeCountNumber || 50);
      if (sortBy === 'verified') return (b.trustScore || 0) - (a.trustScore || 0);
      if (sortBy === 'most_products') return (b.totalProductsCount || 0) - (a.totalProductsCount || 0);
      if (sortBy === 'fast_response') {
        const isAFast = a.responseTime?.includes('1 hr') || a.responseTime?.includes('30 min');
        const isBFast = b.responseTime?.includes('1 hr') || b.responseTime?.includes('30 min');
        if (isAFast && !isBFast) return -1;
        if (isBFast && !isAFast) return 1;
      }
      return 0;
    });
  }, [
    searchQuery,
    selectedLocations,
    locationQuery,
    selectedCategories,
    selectedSupplierTypes,
    selectedCertifications,
    selectedEstablishedYears,
    isGstOnly,
    isIsoOnly,
    isNexoraVerifiedOnly,
    isBusinessVerifiedOnly,
    isExportReadyOnly,
    sortBy
  ]);

  // Filtered OEM Formulations
  const filteredOem = useMemo(() => {
    return SEARCH_OEM_FORMULATIONS.filter((oem) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          oem.title.toLowerCase().includes(q) ||
          oem.developer.toLowerCase().includes(q) ||
          oem.location.toLowerCase().includes(q) ||
          oem.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Location match
      if (!matchesLocationRegions(oem.location, selectedLocations)) return false;

      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase().split(',')[0].trim();
        if (loc && !['all', 'india', 'all india'].includes(loc)) {
          if (!oem.location.toLowerCase().includes(loc)) return false;
        }
      }

      // Category match
      if (selectedCategories.length > 0) {
        const matchesCat = selectedCategories.some((cat) =>
          oem.title.toLowerCase().includes(cat.toLowerCase()) ||
          oem.tags.some((t) => t.toLowerCase().includes(cat.toLowerCase()))
        );
        if (!matchesCat) return false;
      }

      if (isGstOnly && !oem.isGstVerified) return false;
      if (isIsoOnly && !oem.isIsoCertified) return false;

      return true;
    });
  }, [
    searchQuery,
    selectedLocations,
    locationQuery,
    selectedCategories,
    isGstOnly,
    isIsoOnly
  ]);

  return (
    <div className="bg-[#fdf8f8] min-h-screen text-[#1c1b1b] flex flex-col pb-28">
      
      {/* Sticky Search & Filter Header */}
      <div className="bg-[#fcf9f8]/95 backdrop-blur-sm sticky top-20 z-30 border-b border-[#e8e8e8] py-4 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 flex flex-col gap-3">
          
          {/* Search Inputs Row */}
          <div className="flex flex-col md:flex-row gap-3 w-full">
            {/* Query Input */}
            <div className="flex-1 relative flex items-center bg-[#f0edec] rounded-xl border border-transparent focus-within:border-[#b90064] focus-within:bg-white transition-all px-4 py-2.5">
              <Search className="w-4 h-4 text-[#594047] mr-3 shrink-0" />
              <input
                type="text"
                id="search-main-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, suppliers, OEM formulations, machines..."
                className="w-full bg-transparent border-none text-[14px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#8c7077] hover:text-[#1c1b1b]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Location Input */}
            <div className="w-full md:w-1/3 relative flex items-center bg-[#f0edec] rounded-xl border border-transparent focus-within:border-[#b90064] focus-within:bg-white transition-all px-4 py-2.5">
              <MapPin className="w-4 h-4 text-[#594047] mr-3 shrink-0" />
              <input
                type="text"
                id="search-location-input"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City, State (or radius)"
                className="w-full bg-transparent border-none text-[14px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none"
              />
              {locationQuery && locationQuery !== 'All India' && (
                <button onClick={() => setLocationQuery('All India')} className="text-[#8c7077] hover:text-[#1c1b1b] ml-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="search-submit-btn"
              className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[14px] px-8 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Quick Filter Suggested Tags */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider shrink-0 mr-1">
              Quick Filter:
            </span>
            <button
              onClick={() => toggleCertification('GMP')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedCertifications.includes('GMP')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              WHO-GMP
            </button>
            <button
              onClick={() => toggleCertification('ISO')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedCertifications.includes('ISO')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              ISO Certified
            </button>
            <button
              onClick={() => toggleCertification('Organic')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedCertifications.includes('Organic')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              Organic / ECOCERT
            </button>
            <button
              onClick={() => toggleMoqTier('lt_50')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedMoqTiers.includes('lt_50')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              Low MOQ (&lt;50 units)
            </button>
            <button
              onClick={() => toggleLocation('Maharashtra')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedLocations.includes('Maharashtra')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              📍 Maharashtra Hub
            </button>
            <button
              onClick={() => toggleLocation('Delhi NCR')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedLocations.includes('Delhi NCR')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              📍 Delhi NCR
            </button>
            <button
              onClick={() => toggleEstablishedYear('15_plus')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                selectedEstablishedYears.includes('15_plus')
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              15+ Yrs Legacy
            </button>
            <button
              onClick={() => setIsExportReadyOnly(!isExportReadyOnly)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all shrink-0 border ${
                isExportReadyOnly
                  ? 'bg-[#b90064] text-white border-[#b90064]'
                  : 'bg-white text-[#594047] border-[#e8e8e8] hover:border-[#b90064]'
              }`}
            >
              Export Ready
            </button>
          </div>

          {/* Active Filter Chips & Clear All */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f0edec]">
            <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {activeChips.length === 0 ? (
              <span className="text-[12px] text-[#8c7077] italic">No active filters applied (Showing all results)</span>
            ) : (
              activeChips.map((chip) => (
                <div
                  key={chip.id}
                  className="flex items-center bg-[#fde7f3] border border-[#e0bec6] rounded-full px-3 py-0.5 gap-1.5 transition-colors"
                >
                  <span className="text-[12px] font-semibold text-[#b90064]">{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="text-[#b90064] hover:text-[#8e004b] flex items-center transition-colors"
                    title={`Remove ${chip.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}

            {activeChips.length > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-[12px] font-semibold text-[#594047] underline hover:text-[#b90064] ml-2 transition-colors"
              >
                Clear All Filters
              </button>
            )}

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="md:hidden ml-auto flex items-center gap-1.5 text-[12px] font-bold bg-white border border-[#e8e8e8] px-3 py-1 rounded-lg text-[#1c1b1b]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#b90064]" />
              <span>Filters</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area: Sidebar + Results */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-5 md:px-10 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-[180px] flex flex-col gap-6 max-h-[calc(100vh-200px)] overflow-y-auto pb-8 pr-2 custom-scrollbar">
            <FilterPanel
              categories={CATEGORIES}
              selectedCategories={selectedCategories}
              toggleCategory={toggleCategory}
              availableSubcategories={availableSubcategories}
              selectedSubcategories={selectedSubcategories}
              toggleSubcategory={toggleSubcategory}
              selectedLocations={selectedLocations}
              toggleLocation={toggleLocation}
              selectedCertifications={selectedCertifications}
              toggleCertification={toggleCertification}
              selectedMoqTiers={selectedMoqTiers}
              toggleMoqTier={toggleMoqTier}
              selectedEstablishedYears={selectedEstablishedYears}
              toggleEstablishedYear={toggleEstablishedYear}
              selectedSupplierTypes={selectedSupplierTypes}
              toggleSupplierType={toggleSupplierType}
              isGstOnly={isGstOnly}
              setIsGstOnly={setIsGstOnly}
              isNexoraVerifiedOnly={isNexoraVerifiedOnly}
              setIsNexoraVerifiedOnly={setIsNexoraVerifiedOnly}
              isBusinessVerifiedOnly={isBusinessVerifiedOnly}
              setIsBusinessVerifiedOnly={setIsBusinessVerifiedOnly}
              isExportReadyOnly={isExportReadyOnly}
              setIsExportReadyOnly={setIsExportReadyOnly}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              onClearAll={handleClearAllFilters}
            />

            {/* Live Market Demand Widget */}
            <div className="bg-[#f7f2f2] border border-[#e8e8e8] rounded-xl p-4 relative overflow-hidden group hover:border-[#b90064]/50 transition-colors shadow-2xs mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#b90064] animate-pulse"></span>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#b90064]">Live Market Demand</h4>
              </div>
              <p className="text-[13px] text-[#1c1b1b] mb-3 leading-snug">
                Buyer in Delhi requested <strong className="font-bold">500 units</strong> of Argan Oil Serum.
              </p>
              <button
                onClick={() =>
                  onOpenQuoteModal({
                    id: 'rfq-live-dem',
                    buyerLocation: 'Delhi NCR',
                    title: '500 units Argan Oil Anti-Frizz Serum',
                    quantityRequired: '500 Units',
                    targetPrice: '₹350 / Unit'
                  })
                }
                className="w-full text-center py-2 px-4 border border-[#b90064] text-[#b90064] hover:bg-[#b90064] hover:text-white font-bold text-[12px] rounded-lg transition-colors shadow-2xs"
              >
                Submit Quote
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Results Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Result Summary Bar */}
          <div className="mb-6 bg-white border border-[#e8e8e8] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-extrabold text-[#1c1b1b]">
                {activeTab === 'products' ? filteredProducts.length : activeTab === 'suppliers' ? filteredSuppliers.length : filteredOem.length} results for <span className="text-[#b90064]">“{searchQuery || 'All Beauty Categories'}”</span>
              </h2>
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#594047]">
                <MapPin className="w-3.5 h-3.5 text-[#b90064]" />
                <span>{locationQuery}</span>
                <span className="mx-1 opacity-40">•</span>
                <span>Sorted by: {
                  activeTab === 'products' ? 
                    (sortBy === 'relevance' ? 'Relevance' : sortBy === 'rating_desc' ? 'Highest Rating' : sortBy === 'moq_asc' ? 'Lowest MOQ' : sortBy === 'price_asc' ? 'Price: Low to High' : sortBy === 'price_desc' ? 'Price: High to Low' : sortBy === 'established_asc' ? 'Established Manufacturer' : 'Most Enquired') :
                  activeTab === 'suppliers' ?
                    (sortBy === 'relevance' ? 'Relevance' : sortBy === 'rating_desc' ? 'Highest Rating' : sortBy === 'established_asc' ? 'Year Established (Oldest First)' : sortBy === 'established_desc' ? 'Year Established (Newest First)' : sortBy === 'employees_desc' ? 'Employee Count' : sortBy === 'verified' ? 'Verified First' : sortBy === 'fast_response' ? 'Fastest Response' : 'Most Products') :
                    (sortBy === 'relevance' ? 'Relevance' : sortBy === 'verified' ? 'Verified First' : sortBy === 'moq_asc' ? 'Lowest MOQ' : 'Fastest Lead Time')
                }</span>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[11px] font-bold text-[#8c7077] uppercase mr-1">Active:</span>
                {activeChips.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={chip.onRemove}
                    className="flex items-center gap-1.5 bg-[#f7f2f2] border border-[#e8e8e8] px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#594047] hover:border-[#b90064] hover:text-[#b90064] transition-all group"
                  >
                    {chip.label}
                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e8e8e8] pb-4 mb-6 gap-4">
            
            {/* Primary Tabs */}
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setActiveTab('products')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'products'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                Products <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredProducts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('suppliers')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'suppliers'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                Suppliers <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredSuppliers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('oem')}
                className={`text-[15px] font-bold pb-1 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'oem'
                    ? 'text-[#b90064] border-[#b90064]'
                    : 'text-[#594047] border-transparent hover:text-[#b90064]'
                }`}
              >
                OEM &amp; Private Label <span className="text-[#8c7077] font-normal text-xs ml-1">({filteredOem.length})</span>
              </button>
            </div>

            {/* Sorting & View Mode Switcher */}
            <div className="flex items-center gap-3 shrink-0">
              {activeTab === 'products' && comparedProductIds.length > 0 && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="bg-[#fde7f3] hover:bg-[#fbd0e8] text-[#b90064] text-[12px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs border border-[#b90064]/20"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Compare ({comparedProductIds.length})</span>
                </button>
              )}

              {activeTab === 'suppliers' && comparedSupplierIds.length > 0 && (
                <button
                  onClick={() => setIsSupplierCompareModalOpen(true)}
                  className="bg-[#fde7f3] hover:bg-[#fbd0e8] text-[#b90064] text-[12px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs border border-[#b90064]/20"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Compare ({comparedSupplierIds.length})</span>
                </button>
              )}

              <div className="flex items-center border border-[#e8e8e8] rounded-lg bg-white p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-[#f0edec] text-[#1c1b1b]' : 'text-[#594047] hover:text-[#b90064]'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-[#f0edec] text-[#1c1b1b]' : 'text-[#594047] hover:text-[#b90064]'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-[#e8e8e8] hover:border-[#8c7077] rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#1c1b1b] focus:outline-none focus:border-[#b90064] cursor-pointer appearance-none pr-8 shadow-2xs"
                >
                  {activeTab === 'products' ? (
                    <>
                      <option value="relevance">Sort: Relevance</option>
                      <option value="rating_desc">Sort: Highest Rating ★</option>
                      <option value="moq_asc">Sort: Lowest MOQ</option>
                      <option value="price_asc">Sort: Price: Low to High</option>
                      <option value="price_desc">Sort: Price: High to Low</option>
                      <option value="established_asc">Sort: Established Manufacturer</option>
                      <option value="most_enquired">Sort: Most Enquired</option>
                    </>
                  ) : activeTab === 'suppliers' ? (
                    <>
                      <option value="relevance">Sort: Relevance</option>
                      <option value="rating_desc">Sort: Highest Rating ★</option>
                      <option value="established_asc">Sort: Established (Oldest First)</option>
                      <option value="established_desc">Sort: Established (Newest First)</option>
                      <option value="employees_desc">Sort: Employee Count (Largest)</option>
                      <option value="verified">Sort: Trust Score &amp; Verified</option>
                      <option value="fast_response">Sort: Fastest Response Time</option>
                      <option value="most_products">Sort: Most Products Listed</option>
                    </>
                  ) : (
                    <>
                      <option value="relevance">Sort: Relevance</option>
                      <option value="verified">Sort: Verified Labs First</option>
                      <option value="moq_asc">Sort: Lowest MOQ</option>
                      <option value="fast_lead">Sort: Fastest Lead Time</option>
                    </>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#594047] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* TAB 1: Products Grid View */}
          {activeTab === 'products' && (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <FlaskConical className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No matching formulations or products</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Try adjusting your category or location filters, or broadcast your custom requirement directly to 120+ audited factories.
                  </p>
                  <button
                    onClick={onOpenRFQModal}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Post Custom Requirement / RFQ
                  </button>
                </div>
              ) : (
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((prod) => {
                      const isCompared = comparedProductIds.includes(prod.id);
                      const isFav = !!favorites[prod.id];

                      return (
                        <motion.div
                          key={prod.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -10 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="bg-white/80 backdrop-blur-xs border border-[#e8e8e8] rounded-xl overflow-hidden flex flex-col hover:scale-[1.02] hover:border-[#b90064] transition-all duration-300 group shadow-2xs"
                        >
                          {/* Image Header */}
                          <div className="relative h-48 bg-[#f0edec] overflow-hidden">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {prod.isGstVerified && (
                                <span className="bg-[#0150d6] text-white font-bold text-[11px] px-2 py-1 rounded shadow-xs tracking-wide">
                                  GST Verified
                                </span>
                              )}
                              {prod.isNexoraVerified && (
                                <span className="bg-[#b90064] text-white font-bold text-[11px] px-2 py-1 rounded shadow-xs tracking-wide">
                                  Nexora Verified
                                </span>
                              )}
                            </div>

                            <div className="absolute top-3 right-3 flex gap-2">
                              <label className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-md shadow-xs cursor-pointer hover:bg-white transition-colors select-none">
                                <input
                                  type="checkbox"
                                  checked={isCompared}
                                  onChange={() => toggleCompare(prod.id)}
                                  className="rounded border-[#8c7077] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer accent-[#b90064]"
                                />
                                <span className="text-[11.5px] font-bold text-[#594047]">Compare</span>
                              </label>
                              <button
                                onClick={() => toggleFavorite(prod.id)}
                                className="p-1.5 bg-white/90 rounded-md text-[#594047] hover:text-[#b90064] transition-colors shadow-xs"
                                title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                              >
                                <Heart className={`w-4 h-4 ${isFav ? 'fill-[#b90064] text-[#b90064]' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="mb-2">
                              <h3 className="font-bold text-[15px] text-[#1c1b1b] line-clamp-2 mb-1 group-hover:text-[#b90064] transition-colors leading-snug">
                                {prod.title}
                              </h3>
                              <p className="text-[12.5px] text-[#594047] flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                                <span className="truncate">{prod.supplierName}</span>
                                <span className="text-[#8c7077] mx-1">•</span>
                                <span>{prod.supplierLocation}</span>
                              </p>
                            </div>

                            {/* Verification Tag Chips */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="bg-[#f0edec] text-[#1c1b1b] font-semibold text-[11.5px] px-2.5 py-1 rounded-md">
                                MOQ: {prod.moq}
                              </span>
                              <span className="bg-[#f0edec] text-[#1c1b1b] font-semibold text-[11.5px] px-2.5 py-1 rounded-md">
                                Ships in 7-10 Days
                              </span>
                            </div>

                            {/* Premium Tiered Pricing Box */}
                            <div className="bg-[#fcf9f8] rounded-xl p-3 mb-4 border border-[#e8e8e8] shadow-2xs">
                              <span className="block text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider mb-2">
                                Tiered Pricing
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between border-r border-[#e8e8e8] pr-2.5">
                                  <span className="text-[12px] font-semibold text-[#594047]">100u:</span>
                                  <span className="text-[13px] font-bold text-[#1c1b1b]">₹{prod.priceMin || 350}</span>
                                </div>
                                <div className="flex justify-between pl-2.5">
                                  <span className="text-[12px] font-semibold text-[#594047]">500u:</span>
                                  <span className="text-[13px] font-bold text-[#b90064]">₹{Math.round((prod.priceMin || 350) * 0.8)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action CTAs */}
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => onOpenEnquiryModal(prod)}
                                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-xl shadow-xs transition-opacity cursor-pointer text-center"
                              >
                                Get Quote
                              </button>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => onCallSupplier(prod.supplierName)}
                                  className="px-3 py-2.5 border border-[#e8e8e8] text-[#594047] hover:bg-[#f7f2f2] rounded-xl transition-colors flex items-center justify-center"
                                  title="Call Supplier"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onWhatsAppSupplier(prod.supplierName)}
                                  className="px-3 py-2.5 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-xl transition-colors flex items-center justify-center"
                                  title="WhatsApp Direct"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => onNavigate('sample-request')}
                              className="w-full mt-2 border border-[#e8e8e8] hover:border-[#b90064] hover:text-[#b90064] text-[#594047] font-bold text-[12px] py-2 rounded-xl transition-all cursor-pointer text-center bg-transparent"
                            >
                              Request Sample
                            </button>
                            <button
                              onClick={() => onNavigate('product-detail', { productId: prod.id })}
                              className="w-full mt-2 bg-[#fcf9f8] border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] font-bold text-[12px] py-2 rounded-xl transition-all cursor-pointer text-center"
                            >
                              View Full Specifications
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Suppliers Directory View */}
          {activeTab === 'suppliers' && (
            <div>
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <Building2 className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No verified suppliers found for this filter</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Try selecting "All India Hubs" or clearing category filters to view all audited manufacturers.
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Reset Location &amp; Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredSuppliers.map((sup) => {
                      const saved = isSupplierSaved ? isSupplierSaved(sup.id) : false;
                      return (
                        <motion.div
                          key={sup.id}
                          layout
                          initial={{ opacity: 0, scale: 0.94, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -10 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                          className="bg-white rounded-xl border border-[#e8e8e8] p-5 shadow-2xs hover:border-[#8c7077] transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-[#b90064] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                  {sup.shortCode}
                                </div>
                                <div>
                                  <h3 className="font-bold text-[15px] text-[#1c1b1b]">{sup.name}</h3>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <p className="text-[12px] text-[#594047]">
                                      📍 {sup.city}, {sup.state}
                                    </p>
                                    {onOpenMapModal && (
                                      <button
                                        onClick={() => onOpenMapModal(sup)}
                                        className="text-[11px] font-bold text-[#b90064] hover:text-[#8e004b] bg-[#fde7f3] hover:bg-[#fbd0e8] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                                        title="View manufacturer proximity to shipping ports, airports and raw material hubs"
                                      >
                                        <MapPin className="w-3 h-3" />
                                        <span>View on Map</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {onToggleSaveSupplier && (
                                  <button
                                    onClick={() => onToggleSaveSupplier(sup.id, sup.name)}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      saved
                                        ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]'
                                        : 'bg-white border-[#e8e8e8] text-[#8c7077] hover:text-[#b90064] hover:border-[#b90064]'
                                    }`}
                                    title={saved ? 'Remove from Saved Suppliers' : 'Save Supplier'}
                                  >
                                    {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                  </button>
                                )}
                                <label className="flex items-center gap-1.5 bg-[#fcf9f8] px-2 py-1.5 rounded-lg border border-[#e8e8e8] cursor-pointer hover:bg-[#fde7f3]/50 transition-all select-none">
                                  <input
                                    type="checkbox"
                                    checked={comparedSupplierIds.includes(sup.id)}
                                    onChange={() => toggleSupplierCompare(sup.id)}
                                    className="w-3.5 h-3.5 accent-[#b90064] rounded cursor-pointer"
                                  />
                                  <span className="text-[11px] font-bold text-[#594047]">Compare</span>
                                </label>
                                <VerifiedBadge
                                  trustScore={sup.trustScore}
                                  overallRating={sup.overallRating}
                                  size="sm"
                                />
                                <span className="text-[11px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-full block">
                                  {sup.trustScore}/100 Trust
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 my-3">
                              {sup.categories.map((cat, idx) => (
                                <span key={idx} className="bg-[#f7f2f2] text-[#1c1b1b] text-[11px] px-2.5 py-1 rounded-md font-medium">
                                  {cat}
                                </span>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11.5px] text-[#594047] py-2.5 border-t border-b border-[#e8e8e8] my-3">
                              <div>
                                <span className="text-[#8c7077] block text-[10px] uppercase">Min Order Value</span>
                                <strong className="text-[#1c1b1b]">{sup.minOrderValue}</strong>
                              </div>
                              <div>
                                <span className="text-[#8c7077] block text-[10px] uppercase">Response SLA</span>
                                <strong className="text-[#0050d6]">{sup.responseTime} ({sup.responseRate})</strong>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() =>
                                onOpenEnquiryModal({
                                  title: `Supplier Partnership Inquiry: ${sup.name}`,
                                  supplierName: sup.name,
                                  supplierLocation: `${sup.city}, ${sup.state}`,
                                  image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80'
                                })
                              }
                              className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[12px] py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Contact
                            </button>
                            <button
                              onClick={() => onCallSupplier(sup.name)}
                              className="px-3 py-2 border border-[#e8e8e8] text-[#594047] hover:bg-[#f7f2f2] rounded-lg transition-colors flex items-center justify-center"
                              title="Call Supplier"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                             <button
                               onClick={() => onWhatsAppSupplier(sup.name)}
                               className="px-3 py-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-[12px] font-bold"
                               title="WhatsApp Direct"
                             >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => onNavigate('supplier-profile', { supplierId: sup.id })}
                            className="w-full mt-2 bg-[#fcf9f8] border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] font-bold text-[12px] py-2 rounded-lg transition-all cursor-pointer text-center"
                          >
                            View Full Profile
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OEM / Private Label Hub */}
          {activeTab === 'oem' && (
            <div>
              {filteredOem.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e8e8] p-8">
                  <FlaskConical className="w-12 h-12 text-[#8c7077] mx-auto mb-3 opacity-60" />
                  <h3 className="text-base font-bold text-[#1c1b1b]">No OEM formulations found</h3>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1 mb-4">
                    Adjust your category or location filters to discover private label contract developers.
                  </p>
                  <button
                    onClick={handleClearAllFilters}
                    className="bg-[#b90064] text-white font-bold px-6 py-2.5 rounded-lg text-[13px] shadow-sm hover:bg-[#8e004b] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredOem.map((oem) => (
                      <motion.div
                        key={oem.id}
                        layout
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -10 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="bg-white rounded-xl border border-[#e8e8e8] p-5 shadow-2xs hover:border-[#8c7077] transition-all flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
                      >
                        <div className="flex gap-4 items-start">
                          <img
                            src={oem.image}
                            alt={oem.title}
                            className="w-20 h-20 rounded-xl object-cover border border-[#e8e8e8] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-[#fde7f3] text-[#b90064] font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                                OEM Formulation
                              </span>
                              <span className="text-[12px] text-[#594047]">📍 {oem.location}</span>
                            </div>
                            <h3 className="font-bold text-[15px] text-[#1c1b1b]">{oem.title}</h3>
                            <p className="text-[12px] text-[#594047] mt-0.5">
                              Lab Developer: <strong>{oem.developer}</strong> • Capacity: {oem.batchCapacity}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {oem.tags.map((t, idx) => (
                                <span key={idx} className="bg-[#f0f5ff] text-[#0050d6] text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#e8e8e8]">
                          <div className="text-right">
                            <span className="text-[11px] text-[#8c7077] block">Target Unit Cost</span>
                            <strong className="text-[15px] font-bold text-[#b90064]">{oem.targetPrice}</strong>
                            <span className="text-[10px] text-[#594047] block">MOQ: {oem.moq}</span>
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex gap-2">
                              <button
                                onClick={() => onNavigate('sample-request')}
                                className="flex-1 bg-[#1c1b1b] text-white font-bold text-[12px] px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 hover:bg-[#313030]"
                              >
                                <FlaskConical className="w-3.5 h-3.5" />
                                Request Sample
                              </button>
                              <button
                                onClick={() =>
                                  onOpenEnquiryModal({
                                    title: `OEM Private Label Inquiry: ${oem.title}`,
                                    supplierName: oem.developer,
                                    supplierLocation: oem.location,
                                    moq: oem.moq,
                                    price: oem.targetPrice,
                                    image: oem.image
                                  })
                                }
                                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[12px] px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Contact
                              </button>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onCallSupplier(oem.developer)}
                                className="flex-1 py-2 border border-[#e8e8e8] text-[#594047] hover:bg-[#f7f2f2] rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">Call Lab</span>
                              </button>
                              <button
                                onClick={() => onWhatsAppSupplier(oem.developer)}
                                className="flex-1 py-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Floating Comparison Dock (Products) */}
      {comparedProducts.length > 0 && activeTab === 'products' && (
        <div
          id="floating-compare-dock"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-3.5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-[92%] max-w-3xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center justify-between w-full sm:w-auto sm:block shrink-0">
            <div>
              <span className="font-bold text-[14px] text-[#1c1b1b] block">Compare Products</span>
              <span className="text-[12px] font-semibold text-[#b90064]">
                {comparedProducts.length}/4 Selected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 overflow-x-auto no-scrollbar py-1">
            {comparedProducts.map((prod) => (
              <div
                key={prod.id}
                className="w-12 h-12 rounded-lg border border-[#e8e8e8] overflow-hidden relative group shrink-0 shadow-2xs"
              >
                <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleCompare(prod.id)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setComparedProductIds([])}
              className="text-[12px] font-semibold text-[#594047] hover:text-red-600 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="w-full sm:w-auto bg-[#0050d6] hover:bg-[#0040ab] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Compare Specs
            </button>
          </div>
        </div>
      )}

      {/* Floating Comparison Dock (Suppliers) */}
      {comparedSupplierIds.length > 0 && activeTab === 'suppliers' && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-5 py-3.5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-[92%] max-w-3xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center justify-between w-full sm:w-auto sm:block shrink-0">
            <div>
              <span className="font-bold text-[14px] text-[#1c1b1b] block">Compare Suppliers</span>
              <span className="text-[12px] font-semibold text-[#b90064]">
                {comparedSupplierIds.length}/3 Selected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 overflow-x-auto no-scrollbar py-1">
            {comparedSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="w-12 h-12 rounded-lg border border-[#e8e8e8] overflow-hidden relative group shrink-0 shadow-2xs bg-[#fdf8f8] flex items-center justify-center"
              >
                <div className="text-[10px] font-bold text-[#b90064] truncate px-1">{sup.name.split(' ')[0]}</div>
                <button
                  onClick={() => toggleSupplierCompare(sup.id)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setComparedSupplierIds([])}
              className="text-[12px] font-semibold text-[#594047] hover:text-red-600 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={() => setIsSupplierCompareModalOpen(true)}
              className="w-full sm:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Compare Business Stats
            </button>
          </div>
        </div>
      )}

      {/* Product Comparison Modal */}
      <ProductCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        products={comparedProducts}
        onRemoveProduct={(id) => toggleCompare(id)}
        onOpenEnquiry={(product) => onOpenEnquiryModal(product)}
      />

      {/* Supplier Comparison Modal */}
      <SupplierComparisonModal
        isOpen={isSupplierCompareModalOpen}
        onClose={() => setIsSupplierCompareModalOpen(false)}
        selectedSuppliers={comparedSuppliers}
        allSuppliers={SEARCH_SUPPLIERS}
        onAddSupplier={(s) => toggleSupplierCompare(s.id)}
        onRemoveSupplier={(id) => toggleSupplierCompare(id)}
        onClearAll={() => setComparedSupplierIds([])}
        onOpenEnquiry={(s) => onOpenEnquiryModal({ supplierName: s.name, supplierLocation: s.city })}
        onCallSupplier={onCallSupplier}
        onWhatsAppSupplier={onWhatsAppSupplier}
      />

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="ml-auto w-[85%] max-w-sm h-full bg-white flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#e8e8e8]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#b90064]" />
                <h2 className="text-lg font-bold text-[#1c1b1b]">Filters</h2>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 hover:bg-[#f7f2f2] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#594047]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <FilterPanel
                categories={CATEGORIES}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                availableSubcategories={availableSubcategories}
                selectedSubcategories={selectedSubcategories}
                toggleSubcategory={toggleSubcategory}
                selectedLocations={selectedLocations}
                toggleLocation={toggleLocation}
                selectedCertifications={selectedCertifications}
                toggleCertification={toggleCertification}
                selectedMoqTiers={selectedMoqTiers}
                toggleMoqTier={toggleMoqTier}
                selectedEstablishedYears={selectedEstablishedYears}
                toggleEstablishedYear={toggleEstablishedYear}
                selectedSupplierTypes={selectedSupplierTypes}
                toggleSupplierType={toggleSupplierType}
                isGstOnly={isGstOnly}
                setIsGstOnly={setIsGstOnly}
                isNexoraVerifiedOnly={isNexoraVerifiedOnly}
                setIsNexoraVerifiedOnly={setIsNexoraVerifiedOnly}
                isBusinessVerifiedOnly={isBusinessVerifiedOnly}
                setIsBusinessVerifiedOnly={setIsBusinessVerifiedOnly}
                isExportReadyOnly={isExportReadyOnly}
                setIsExportReadyOnly={setIsExportReadyOnly}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                onClearAll={handleClearAllFilters}
              />
            </div>

            <div className="p-5 border-t border-[#e8e8e8] bg-[#fcf9f8]">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold py-3.5 rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
