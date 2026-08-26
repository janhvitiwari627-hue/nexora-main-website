import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORY_TAXONOMY } from '../data/categories';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  ShieldCheck,
  Award,
  BadgeCheck,
  FileCheck2,
  Phone,
  Send,
  MessageSquare,
  FolderDown,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  X,
  Grid,
  List as ListIcon,
  Map as MapIcon,
  Sparkles,
  ArrowRight,
  Factory,
  Mail,
  Lock,
  Unlock,
  Package,
  Clock,
  TrendingUp,
  Truck,
  Leaf,
  Building2,
  ExternalLink,
  CheckCircle2,
  Download,
  Info,
  Video,
  Star,
  Check,
  FlaskConical
} from 'lucide-react';
import { VerifiedSupplier } from '../types';
import { VERIFIED_SUPPLIERS } from '../data/mockData';
import { fetchSuppliers } from '../services/supplierService';
import { VerifiedBadge } from './VerifiedBadge';

interface SupplierDirectoryScreenProps {
  isSupplierSaved?: (id: string) => boolean;
  onToggleSaveSupplier?: (id: string, name?: string) => void;
  onOpenEnquiryModal: (item: any) => void;
  onOpenQuoteModal: (rfq?: any) => void;
  onOpenRFQModal: () => void;
  onOpenMapModal?: (supplier: VerifiedSupplier) => void;
  onOpenFacilityTour?: (supplier: VerifiedSupplier) => void;
  onNavigateToExplore?: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
  onNavigateToProductDetail?: (productId: string) => void;
  onOpenComparisonModal?: (selectedSuppliers: VerifiedSupplier[]) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const SupplierDirectoryScreen: React.FC<SupplierDirectoryScreenProps> = ({
  isSupplierSaved,
  onToggleSaveSupplier,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenMapModal,
  onOpenFacilityTour,
  onNavigateToExplore,
  onNavigateToSupplierProfile,
  onNavigateToProductDetail,
  onOpenComparisonModal,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  // Search & Top Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai, Maharashtra');
  const [distanceRadius, setDistanceRadius] = useState('+250 km');

  // Business Type Pill Tab
  const [activeBusinessType, setActiveBusinessType] = useState('All');

  // Quick Filters
  const [quickFilters, setQuickFilters] = useState<{ [key: string]: boolean }>({
    verifiedOnly: false,
    oemPrivateLabel: false,
    readyToSupply: false,
    topRated: false,
    fastResponse: false,
    lowMoq: false,
    panIndia: false
  });

  // Sidebar Filters State
  const [businessTypeFilters, setBusinessTypeFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [moqValue, setMoqValue] = useState<number>(5000);
  const [capacityFilter, setCapacityFilter] = useState('Any Capacity');
  const [leadTimeFilter, setLeadTimeFilter] = useState('Any Lead Time');

  // Compliance Checkboxes
  const [complianceFilters, setComplianceFilters] = useState<{ [key: string]: boolean }>({
    gst: false,
    iso: false,
    gmp: false,
    fda: false,
    organic: false,
    crueltyFree: false
  });

  // Layout View Mode & Sorting
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('Recommended');

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Service Supplier State
  const [remoteSuppliers, setRemoteSuppliers] = useState<VerifiedSupplier[]>(VERIFIED_SUPPLIERS);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSuppliers(true);

    fetchSuppliers({
      searchQuery,
      businessType: activeBusinessType,
      category: selectedCategory || 'All',
      verifiedOnly: quickFilters.verifiedOnly,
      limit: 50
    }).then(res => {
      if (isMounted && res.data && res.data.length > 0) {
        setRemoteSuppliers(res.data);
      }
    }).catch(err => {
      console.warn('Supplier service error, falling back to mock dataset:', err);
    }).finally(() => {
      if (isMounted) setIsLoadingSuppliers(false);
    });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, activeBusinessType, selectedCategory, quickFilters.verifiedOnly]);

  // Phone Reveal State (per supplier ID)
  const [revealedPhones, setRevealedPhones] = useState<{ [key: string]: boolean }>({});

  // Paywall & Sourcing Credit Reveal System States
  const [userCredits, setUserCredits] = useState<number>(120);
  const [paywallModalSupplier, setPaywallModalSupplier] = useState<any | null>(null);

  // Assets Dropdown Open State (per supplier ID)
  const [openAssetsId, setOpenAssetsId] = useState<string | null>(null);

  // Comparison Selection State
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>(['sup-1', 'sup-2']);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePhoneRevealClick = (sup: any) => {
    if (revealedPhones[sup.id]) {
      setRevealedPhones((prev) => ({
        ...prev,
        [sup.id]: false
      }));
    } else {
      setPaywallModalSupplier(sup);
    }
  };

  const confirmUnlockSupplier = (id: string, name: string) => {
    if (userCredits < 10) {
      showToast("❌ Insufficient Sourcing Credits! Please top up your wallet.");
      return;
    }
    setUserCredits(prev => prev - 10);
    setRevealedPhones(prev => ({
      ...prev,
      [id]: true
    }));
    setPaywallModalSupplier(null);
    showToast(`🔓 Successfully unlocked full contacts for ${name}! (-10 Credits)`);
  };

  const togglePhoneReveal = (id: string) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleComparisonSelection = (id: string) => {
    setSelectedComparisonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleQuickFilter = (key: string) => {
    setQuickFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleBusinessTypeFilter = (type: string) => {
    setBusinessTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleComplianceFilter = (key: string) => {
    setComplianceFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveBusinessType('All');
    setBusinessTypeFilters([]);
    setSelectedCategory('Haircare');
    setSelectedSubcategory('');
    setMoqValue(5000);
    setCapacityFilter('Any Capacity');
    setLeadTimeFilter('Any Lead Time');
    setComplianceFilters({
      gst: false,
      iso: false,
      gmp: false,
      fda: false,
      organic: false,
      crueltyFree: false
    });
    setQuickFilters({
      verifiedOnly: false,
      oemPrivateLabel: false,
      readyToSupply: false,
      topRated: false,
      fastResponse: false,
      lowMoq: false,
      panIndia: false
    });
    showToast('Filters reset to default');
  };

  // Filtered & Sorted Suppliers List
  const filteredSuppliers = useMemo(() => {
    const list = remoteSuppliers.filter((supplier) => {
      // Geographic City & Industrial Hub Filter
      if (selectedCity && selectedCity.trim() !== '') {
        const queryCity = selectedCity.toLowerCase();
        const matchesCity = supplier.city.toLowerCase().includes(queryCity) || 
                            supplier.state.toLowerCase().includes(queryCity) || 
                            (supplier.locationDetails?.industrialZone && supplier.locationDetails.industrialZone.toLowerCase().includes(queryCity));
        if (!matchesCity) return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = supplier.name.toLowerCase().includes(q);
        const matchesType = supplier.type.toLowerCase().includes(q);
        const matchesCity = supplier.city.toLowerCase().includes(q);
        const matchesCat = supplier.categories.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesType && !matchesCity && !matchesCat) return false;
      }

      // Business Type Tab
      if (activeBusinessType !== 'All') {
        if (activeBusinessType === 'Manufacturers' && !supplier.type.toLowerCase().includes('manufacturer') && !supplier.type.toLowerCase().includes('formulator')) {
          return false;
        }
        if (activeBusinessType === 'Wholesalers' && !supplier.type.toLowerCase().includes('wholesaler') && !supplier.type.toLowerCase().includes('stockist')) {
          return false;
        }
        if (activeBusinessType === 'Distributors' && !supplier.type.toLowerCase().includes('distributor')) {
          return false;
        }
        if (activeBusinessType === 'OEM / Private Label' && !supplier.type.toLowerCase().includes('oem') && !supplier.type.toLowerCase().includes('private label') && !supplier.type.toLowerCase().includes('formulator')) {
          return false;
        }
      }

      // Sidebar Business Type Checkboxes
      if (businessTypeFilters.length > 0) {
        const matchesAny = businessTypeFilters.some((bt) => {
          if (bt === 'Manufacturer' && (supplier.type.toLowerCase().includes('manufacturer') || supplier.type.toLowerCase().includes('formulator'))) return true;
          if (bt === 'Wholesaler' && (supplier.type.toLowerCase().includes('wholesaler') || supplier.type.toLowerCase().includes('stockist'))) return true;
          if (bt === 'Distributor' && supplier.type.toLowerCase().includes('distributor')) return true;
          if (bt === 'OEM/ODM' && (supplier.type.toLowerCase().includes('oem') || supplier.type.toLowerCase().includes('private label'))) return true;
          return supplier.type.toLowerCase().includes(bt.toLowerCase());
        });
        if (!matchesAny) return false;
      }

      // Category Selection
      if (selectedCategory) {
        const catMatch = supplier.categories.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!catMatch) return false;
      }

      // Quick Filter
      if (quickFilters.verifiedOnly && !supplier.isVerified) return false;
      if (quickFilters.oemPrivateLabel && !supplier.type.toLowerCase().includes('oem')) return false;

      // Sidebar Compliance
      if (complianceFilters.gst && !supplier.isGstVerified) return false;
      if (complianceFilters.iso && !supplier.isIsoCertified) return false;
      if (complianceFilters.gmp && !supplier.isGmpCertified) return false;
      if (complianceFilters.fda && !supplier.isFdaRegistered) return false;

      return true;
    });

    // Helper functions for sorting calculations
    const getSupplierRating = (sup: VerifiedSupplier) => {
      return sup.overallRating ?? sup.productQualityRating ?? (sup.trustScore ? sup.trustScore / 20 : 4.5);
    };

    const getSupplierEstablishedYear = (sup: VerifiedSupplier) => {
      if (sup.establishedYearNumber) return sup.establishedYearNumber;
      if (sup.establishedYear) {
        const match = sup.establishedYear.match(/\d{4}/);
        if (match) return parseInt(match[0], 10);
      }
      return 2015;
    };

    const getSupplierEmployeeCount = (sup: VerifiedSupplier) => {
      if (sup.employeeCountNumber) return sup.employeeCountNumber;
      if (sup.employeeCount) {
        const nums = sup.employeeCount.match(/\d+/g);
        if (nums && nums.length > 0) {
          const parsed = nums.map(n => parseInt(n, 10));
          return Math.max(...parsed);
        }
      }
      if (sup.facilityArea) {
        const areaMatch = sup.facilityArea.replace(/,/g, '').match(/\d+/);
        if (areaMatch) {
          return Math.round(parseInt(areaMatch[0], 10) / 250);
        }
      }
      if (sup.monthlyCapacity) {
        const capMatch = sup.monthlyCapacity.replace(/,/g, '').match(/\d+/);
        if (capMatch) {
          return Math.round(parseInt(capMatch[0], 10) / 1000);
        }
      }
      return 50;
    };

    return [...list].sort((a, b) => {
      if (sortBy === 'Rating') {
        const diff = getSupplierRating(b) - getSupplierRating(a);
        if (diff !== 0) return diff;
        return (b.trustScore || 0) - (a.trustScore || 0);
      }
      if (sortBy === 'Year Established') {
        // Order by oldest established manufacturer / industry longevity first
        return getSupplierEstablishedYear(a) - getSupplierEstablishedYear(b);
      }
      if (sortBy === 'Employee Count') {
        // Order by largest workforce / scale first
        return getSupplierEmployeeCount(b) - getSupplierEmployeeCount(a);
      }
      if (sortBy === 'Relevance' || sortBy === 'Recommended') {
        return (b.trustScore || 0) - (a.trustScore || 0);
      }
      return 0;
    });
  }, [remoteSuppliers, searchQuery, selectedCity, activeBusinessType, businessTypeFilters, selectedCategory, quickFilters, complianceFilters, sortBy]);

  const selectedSuppliersObjects = useMemo(() => {
    return VERIFIED_SUPPLIERS.filter((s) => selectedComparisonIds.includes(s.id));
  }, [selectedComparisonIds]);

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#1c1b1b] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Search & Location Header Bar */}
      <section className="bg-white border-b border-[#e8e8e8] sticky top-20 z-30 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center bg-[#f0edec] rounded-xl border border-[#e8e8e8] focus-within:ring-2 focus-within:ring-[#b90064] transition-all p-1.5 gap-2">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center px-3 gap-2.5 bg-transparent">
              <Search className="w-4 h-4 text-[#594047] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers, manufacturers, distributors or business categories"
                className="bg-transparent border-none text-[13.5px] text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none w-full py-2 font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#8c7077] hover:text-[#1c1b1b]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden lg:block w-px h-8 bg-[#e8e8e8]" />

            {/* Location Input */}
            <div className="flex items-center px-3 gap-2 w-full lg:w-64 bg-transparent">
              <MapPin className="w-4 h-4 text-[#b90064] shrink-0" />
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none text-[13px] text-[#1c1b1b] font-medium focus:outline-none w-full py-2"
                placeholder="City, State"
              />
            </div>

            <div className="hidden lg:block w-px h-8 bg-[#e8e8e8]" />

            {/* Distance Radius Selector */}
            <div className="flex items-center px-3 gap-2 w-full lg:w-36 bg-transparent">
              <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider shrink-0">Radius</span>
              <select
                value={distanceRadius}
                onChange={(e) => setDistanceRadius(e.target.value)}
                className="bg-transparent border-none text-[13px] font-semibold text-[#1c1b1b] focus:outline-none w-full py-2 cursor-pointer"
              >
                <option value="+250 km">+250 km</option>
                <option value="+500 km">+500 km</option>
                <option value="National">National</option>
              </select>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => showToast(`Searching suppliers around ${selectedCity}`)}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[13px] font-bold px-7 py-3 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Suppliers</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="max-w-[1440px] mx-auto w-full flex flex-col md:flex-row">
        
        {/* Left Sticky Sidebar Filters (Desktop) */}
        <aside className="hidden md:flex flex-col p-6 bg-white sticky top-[152px] h-[calc(100vh-152px)] w-72 border-r border-[#e8e8e8] shrink-0 overflow-y-auto">
          <div className="mb-5 flex justify-between items-center pb-3 border-b border-[#f0edec]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#b90064]" />
              <h2 className="text-[15px] font-bold text-[#1c1b1b] tracking-tight">Supplier Filters</h2>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[12px] text-[#b90064] font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Business Type Filter */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-[#1c1b1b] mb-3 uppercase tracking-widest text-[#8c7077]">
              Business Type
            </h3>
            <div className="flex flex-col gap-2.5">
              {['Manufacturer', 'Wholesaler', 'Distributor', 'Exporter', 'OEM/ODM'].map((type) => (
                <label key={type} className="flex items-center gap-2.5 text-[13px] text-[#1c1b1b] cursor-pointer hover:text-[#b90064] font-medium">
                  <input
                    type="checkbox"
                    checked={businessTypeFilters.includes(type)}
                    onChange={() => toggleBusinessTypeFilter(type)}
                    className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* City & Industrial Hubs Filter */}
          <div className="mb-6 pb-6 border-b border-[#f0edec]">
            <h3 className="text-[11px] font-bold text-[#1c1b1b] mb-3 uppercase tracking-widest text-[#8c7077] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#b90064]" />
              <span>City &amp; Industrial Hubs</span>
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { name: 'All India', value: '' },
                { name: 'Mumbai (Taloja MIDC)', value: 'Mumbai' },
                { name: 'Baddi (Himachal Hub)', value: 'Baddi' },
                { name: 'Delhi NCR (IMT Manesar)', value: 'Delhi' },
                { name: 'Ahmedabad (Sanand)', value: 'Ahmedabad' },
                { name: 'Bengaluru (Peenya Hub)', value: 'Bengaluru' }
              ].map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => {
                    setSelectedCity(hub.value);
                    showToast(`Filtering for suppliers in ${hub.name}`);
                  }}
                  className={`text-left px-2.5 py-1.5 rounded-lg text-[12px] transition-all font-bold flex justify-between items-center cursor-pointer ${
                    selectedCity === hub.value
                      ? 'bg-[#fde7f3] text-[#b90064] border border-[#e0bec6]'
                      : 'bg-transparent text-[#594047] hover:bg-[#f0edec] hover:text-[#1c1b1b]'
                  }`}
                >
                  <span>{hub.name}</span>
                  {selectedCity === hub.value && <Check className="w-3.5 h-3.5 text-[#b90064]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6 pb-6 border-b border-[#f0edec]">
            <h3 className="text-[11px] font-bold text-[#1c1b1b] mb-3 uppercase tracking-widest text-[#8c7077]">
              Categories
            </h3>
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {Object.entries(CATEGORY_TAXONOMY).map(([catName, subcategories]) => {
                const isSelected = selectedCategory === catName;
                return (
                  <div key={catName} className="space-y-1.5">
                    <label className="flex items-center justify-between text-[13px] text-[#1c1b1b] cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedCategory('');
                              setSelectedSubcategory('');
                            } else {
                              setSelectedCategory(catName);
                              setSelectedSubcategory('');
                            }
                          }}
                          className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4"
                        />
                        <span className={`font-medium transition-colors ${isSelected ? 'font-bold text-[#b90064]' : 'group-hover:text-[#b90064]'}`}>
                          {catName}
                        </span>
                      </div>
                    </label>

                    {/* Subcategories Tree */}
                    {isSelected && (
                      <div className="pl-6 flex flex-col gap-1.5 border-l-2 border-[#b90064]/30 ml-2 mt-1 py-1">
                        {subcategories.map((subName) => (
                          <label key={subName} className="flex items-center justify-between text-[12px] text-[#1c1b1b] cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedSubcategory === subName}
                                onChange={() => setSelectedSubcategory(selectedSubcategory === subName ? '' : subName)}
                                className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-3.5 h-3.5"
                              />
                              <span className={selectedSubcategory === subName ? 'font-semibold text-[#b90064]' : 'text-[#594047]'}>
                                {subName}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Production Scale Filters */}
          <div className="mb-6 pb-6 border-b border-[#f0edec]">
            <h3 className="text-[11px] font-bold text-[#1c1b1b] mb-3 uppercase tracking-widest text-[#8c7077]">
              Production Scale
            </h3>

            {/* Range slider for MOQ */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-[12px] text-[#594047] mb-1.5 font-medium">
                <span>Max Order Quantity</span>
                <span className="font-bold text-[#b90064]">{moqValue.toLocaleString()} units</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={moqValue}
                onChange={(e) => setMoqValue(Number(e.target.value))}
                className="w-full accent-[#b90064] h-1.5 bg-[#f0edec] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8c7077] mt-1 font-semibold">
                <span>100 Units</span>
                <span>10k+ Units</span>
              </div>
            </div>

            {/* Monthly Capacity Dropdown */}
            <div className="mb-3.5">
              <label className="block text-[11.5px] font-semibold text-[#594047] mb-1">Monthly Capacity</label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="w-full bg-white border border-[#e8e8e8] text-[12.5px] text-[#1c1b1b] rounded-lg p-2 focus:ring-1 focus:ring-[#b90064] font-medium cursor-pointer"
              >
                <option value="Any Capacity">Any Capacity</option>
                <option value="> 10,000 units">&gt; 10,000 units / mo</option>
                <option value="> 50,000 units">&gt; 50,000 units / mo</option>
                <option value="> 100,000 units">&gt; 100,000 units / mo</option>
              </select>
            </div>

            {/* Lead Time Dropdown */}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#594047] mb-1">Lead Time</label>
              <select
                value={leadTimeFilter}
                onChange={(e) => setLeadTimeFilter(e.target.value)}
                className="w-full bg-white border border-[#e8e8e8] text-[12.5px] text-[#1c1b1b] rounded-lg p-2 focus:ring-1 focus:ring-[#b90064] font-medium cursor-pointer"
              >
                <option value="Any Lead Time">Any Lead Time</option>
                <option value="< 15 Days">&lt; 15 Days</option>
                <option value="< 30 Days">&lt; 30 Days</option>
                <option value="< 60 Days">&lt; 60 Days</option>
              </select>
            </div>
          </div>

          {/* Compliance & Certifications */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-[#1c1b1b] mb-3 uppercase tracking-widest text-[#8c7077] flex justify-between items-center">
              <span>Compliance &amp; Certs</span>
              <Info className="w-3.5 h-3.5 text-[#8c7077] cursor-help" aria-label="3rd-party audited compliance status" />
            </h3>
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'gst', label: 'GST Registered' },
                { key: 'iso', label: 'ISO 9001:2015' },
                { key: 'gmp', label: 'WHO-GMP Certified' },
                { key: 'fda', label: 'US-FDA Registered' },
                { key: 'organic', label: 'Organic (COSMOS)' },
                { key: 'crueltyFree', label: 'Cruelty-Free / Leaping Bunny' }
              ].map((cert) => (
                <label key={cert.key} className="flex items-center gap-2.5 text-[13px] text-[#1c1b1b] cursor-pointer hover:text-[#b90064] font-medium">
                  <input
                    type="checkbox"
                    checked={complianceFilters[cert.key]}
                    onChange={() => toggleComplianceFilter(cert.key)}
                    className="rounded border-[#e8e8e8] text-[#b90064] focus:ring-[#b90064] w-4 h-4 cursor-pointer"
                  />
                  <span>{cert.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Directory Canvas */}
        <main className="flex-1 p-4 md:p-8 bg-[#fdf8f8] min-h-[calc(100vh-152px)]">
          
          {/* Top Sticky Business Type Pills & Quick Filters Bar */}
          <div className="sticky top-[152px] z-20 bg-[#fdf8f8]/95 backdrop-blur-md py-3 mb-6 border-b border-[#e8e8e8]">
            {/* Primary Business Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { label: 'All Suppliers', key: 'All', count: VERIFIED_SUPPLIERS.length },
                {
                  label: 'Verified Manufacturers',
                  key: 'Manufacturers',
                  count: VERIFIED_SUPPLIERS.filter((s) => s.type.toLowerCase().includes('manufacturer') || s.type.toLowerCase().includes('formulator')).length
                },
                {
                  label: 'Wholesalers & Stockists',
                  key: 'Wholesalers',
                  count: VERIFIED_SUPPLIERS.filter((s) => s.type.toLowerCase().includes('wholesaler') || s.type.toLowerCase().includes('stockist')).length
                },
                {
                  label: 'National Distributors',
                  key: 'Distributors',
                  count: VERIFIED_SUPPLIERS.filter((s) => s.type.toLowerCase().includes('distributor')).length
                },
                {
                  label: 'OEM / Private Label',
                  key: 'OEM / Private Label',
                  count: VERIFIED_SUPPLIERS.filter((s) => s.type.toLowerCase().includes('oem') || s.type.toLowerCase().includes('private label') || s.type.toLowerCase().includes('formulator')).length
                }
              ].map((typeTab) => {
                const isActive = activeBusinessType === typeTab.key;
                return (
                  <button
                    key={typeTab.key}
                    onClick={() => setActiveBusinessType(typeTab.key)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#b90064] text-white shadow-xs'
                        : 'bg-white border border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064]'
                    }`}
                  >
                    <span>{typeTab.label}</span>
                    <span
                      className={`text-[11px] px-2 py-0.2 rounded-full font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#f0edec] text-[#8c7077]'
                      }`}
                    >
                      {typeTab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-[12px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c7077] shrink-0">
                Quick Filters:
              </span>
              {[
                { key: 'verifiedOnly', label: 'Verified Only' },
                { key: 'oemPrivateLabel', label: 'OEM / Private Label' },
                { key: 'readyToSupply', label: 'Ready to Supply' },
                { key: 'topRated', label: 'Top Rated' },
                { key: 'fastResponse', label: 'Fast Response' },
                { key: 'lowMoq', label: 'Low MOQ' },
                { key: 'panIndia', label: 'Pan India' }
              ].map((qf) => {
                const isChecked = quickFilters[qf.key];
                return (
                  <button
                    key={qf.key}
                    onClick={() => toggleQuickFilter(qf.key)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      isChecked
                        ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064] font-bold'
                        : 'bg-[#f0edec] border-[#e8e8e8] text-[#594047] hover:border-[#b90064]'
                    }`}
                  >
                    {qf.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Geographic Hub Filter */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar text-[12px] md:hidden">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8c7077] shrink-0 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#b90064]" />
                <span>Hubs:</span>
              </span>
              {[
                { name: 'All India', value: '' },
                { name: 'Mumbai (Taloja)', value: 'Mumbai' },
                { name: 'Baddi (Himachal)', value: 'Baddi' },
                { name: 'Delhi NCR (Manesar)', value: 'Delhi' },
                { name: 'Ahmedabad (Sanand)', value: 'Ahmedabad' },
                { name: 'Bengaluru (Peenya)', value: 'Bengaluru' }
              ].map((hub) => {
                const isSelected = selectedCity === hub.value;
                return (
                  <button
                    key={hub.name}
                    onClick={() => {
                      setSelectedCity(hub.value);
                      showToast(`Filtering for suppliers in ${hub.name}`);
                    }}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-[#b90064] border-[#b90064] text-white font-extrabold shadow-sm'
                        : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064]'
                    }`}
                  >
                    {hub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Header Summary & Toolbar */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#1c1b1b] flex items-center gap-2.5 flex-wrap">
                  <span>
                    {filteredSuppliers.length} Verified Suppliers
                    {selectedCategory ? ` for '${selectedCategory}'` : ''}
                    {activeBusinessType !== 'All' ? ` (${activeBusinessType})` : ''}
                  </span>
                  <span className="bg-[#fde7f3] text-[#b90064] text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {activeBusinessType !== 'All' ? activeBusinessType : 'Verified Hub'}
                  </span>
                </h1>
                <p className="text-[13px] text-[#594047] mt-1 font-medium">
                  Verified beauty &amp; cosmetic manufacturers, wholesalers &amp; distributors across India
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Mobile Filter Toggle Trigger */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-[#e8e8e8] rounded-xl text-[13px] font-bold text-[#1c1b1b]"
                >
                  <Filter className="w-4 h-4 text-[#b90064]" />
                  <span>Filters</span>
                </button>

                {/* View Toggles */}
                <div className="flex items-center gap-1 border border-[#e8e8e8] rounded-xl bg-white p-1 shadow-2xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#f0edec] text-[#b90064]' : 'text-[#8c7077] hover:text-[#1c1b1b]'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#f0edec] text-[#b90064]' : 'text-[#8c7077] hover:text-[#1c1b1b]'
                    }`}
                    title="List View"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('map');
                      if (onOpenMapModal && filteredSuppliers[0]) {
                        onOpenMapModal(filteredSuppliers[0]);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'map' ? 'bg-[#f0edec] text-[#b90064]' : 'text-[#8c7077] hover:text-[#1c1b1b]'
                    }`}
                    title="Map View"
                  >
                    <MapIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative" id="supplier-sort-dropdown-container">
                  <label htmlFor="supplier-directory-sort-select" className="sr-only">
                    Sort Manufacturers
                  </label>
                  <select
                    id="supplier-directory-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[13px] font-semibold text-[#1c1b1b] rounded-xl py-2 pl-3.5 pr-8 focus:outline-none focus:ring-1 focus:ring-[#b90064] cursor-pointer shadow-2xs transition-colors"
                  >
                    <option value="Relevance">Sort: Relevance</option>
                    <option value="Rating">Sort: Rating</option>
                    <option value="Year Established">Sort: Year Established</option>
                    <option value="Employee Count">Sort: Employee Count</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c7077] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters Pill Strip */}
            <div className="flex flex-wrap gap-2 items-center text-[12px]">
              <span className="text-[#8c7077] font-semibold">Active:</span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e8e8e8] rounded-full text-[#1c1b1b] font-medium shadow-2xs">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory('')} className="hover:text-[#b90064] text-[#8c7077]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {activeBusinessType !== 'All' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#e8e8e8] rounded-full text-[#1c1b1b] font-medium shadow-2xs">
                  <span>Type: {activeBusinessType}</span>
                  <button onClick={() => setActiveBusinessType('All')} className="hover:text-[#b90064] text-[#8c7077]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <button
                onClick={handleResetFilters}
                className="text-[#b90064] font-bold hover:underline ml-2 cursor-pointer text-[12px]"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Sourcing Credit Wallet Banner */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between p-5 bg-white border border-[#e0bec6] rounded-2xl gap-5 shadow-3xs relative overflow-hidden">
            {/* Background subtle visual accent */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-[#fde7f3] opacity-20 rounded-r-2xl transform skew-x-12 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10 text-left">
              <div className="w-12 h-12 bg-[#fde7f3] rounded-full flex items-center justify-center shrink-0 border border-[#b90064]/20">
                <Unlock className="w-6 h-6 text-[#b90064] animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-[#b90064] uppercase tracking-widest bg-[#fde7f3] px-2.5 py-0.5 rounded-full inline-block">
                  Verified Buyer Wallet
                </p>
                <h4 className="text-[15px] font-extrabold text-[#1c1b1b] mt-1 flex items-center gap-2">
                  <span>Direct Contact Balance:</span>
                  <span className="text-[#b90064] text-lg font-black">{userCredits} Sourcing Credits</span>
                </h4>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10">
              <div className="text-right sm:pr-2 hidden sm:block">
                <p className="text-[11.5px] font-bold text-[#1c1b1b]">Unlock verified suppliers instantly</p>
                <p className="text-[10px] font-bold text-[#8c7077]">10 credits per verified contact unlock</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setUserCredits(prev => prev + 50);
                  showToast("⚡ Wallet Refilled! Added 50 Premium Sourcing Credits.");
                }}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[12px] px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer text-center whitespace-nowrap"
              >
                + Top-Up 50 Credits (Demo)
              </button>
            </div>
          </div>

          {/* Concierge Sourcing Header Banner */}
          <section className="mb-8 bg-white border border-[#e8e8e8] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex-1">
              <span className="bg-[#b90064] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                Concierge Sourcing
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-[#1c1b1b] mb-2 tracking-tight">
                Need a Manufacturing Partner?
              </h2>
              <p className="text-[13.5px] text-[#594047] mb-5 max-w-2xl leading-relaxed font-normal">
                Leverage our network of elite OEM partners for end-to-end support, from custom formulation R&amp;D to sustainable packaging design.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-[#fdf8f8] px-3.5 py-2 rounded-xl border border-[#e8e8e8]">
                  <Sparkles className="w-4 h-4 text-[#b90064]" />
                  <span className="text-[13px] font-semibold text-[#1c1b1b]">R&amp;D Support</span>
                </div>
                <div className="flex items-center gap-2 bg-[#fdf8f8] px-3.5 py-2 rounded-xl border border-[#e8e8e8]">
                  <Package className="w-4 h-4 text-[#b90064]" />
                  <span className="text-[13px] font-semibold text-[#1c1b1b]">Packaging Design</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={onOpenRFQModal}
                className="w-full md:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white font-bold px-7 py-3.5 rounded-xl hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-[14px]"
              >
                <span>Request Custom Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Supplier Cards List */}
          <div className="flex flex-col gap-6 mb-16">
            {filteredSuppliers.map((sup, index) => {
              const saved = isSupplierSaved ? isSupplierSaved(sup.id) : false;
              const isSelectedForCompare = selectedComparisonIds.includes(sup.id);
              const isPhoneRevealed = revealedPhones[sup.id];
              const isAssetsOpen = openAssetsId === sup.id;

              return (
                <React.Fragment key={sup.id}>
                  {/* Supplier Card */}
                  <article className="bg-white rounded-2xl p-6 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] relative group flex flex-col lg:flex-row gap-6">
                    
                    {/* Floating Save & Compare Quick Tools */}
                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (onToggleSaveSupplier) onToggleSaveSupplier(sup.id, sup.name);
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          saved
                            ? 'bg-[#fde7f3] text-[#b90064] border border-[#e0bec6]'
                            : 'bg-[#f0edec] text-[#8c7077] hover:text-[#b90064] hover:bg-[#fde7f3]'
                        }`}
                        title={saved ? 'Saved in My List' : 'Save Supplier'}
                      >
                        {saved ? <BookmarkCheck className="w-4 h-4 fill-[#b90064]" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <label
                        className={`flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-colors ${
                          isSelectedForCompare ? 'bg-[#dbe1ff]' : 'bg-[#f0edec] hover:bg-[#e6e1e1]'
                        }`}
                        title="Select for Comparison"
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => toggleComparisonSelection(sup.id)}
                          className="rounded border-[#e8e8e8] text-[#0050d6] focus:ring-[#0050d6] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Main Supplier Metadata Column */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header Row: Logo, Name, Badges */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-20 h-20 rounded-xl bg-[#fdf8f8] flex items-center justify-center border border-[#e8e8e8] shrink-0 overflow-hidden relative shadow-2xs">
                            <span className="font-extrabold text-xl text-[#b90064]">{sup.shortCode}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap pr-16">
                              <h3
                                onClick={() => onNavigateToSupplierProfile?.(sup.id)}
                                className="text-xl font-bold tracking-tight text-[#1c1b1b] hover:text-[#b90064] cursor-pointer transition-colors"
                              >
                                {sup.name}
                              </h3>
                              
                              {/* Rating Widget */}
                              <div className="flex items-center gap-1 bg-[#fff8e6] px-2 py-0.5 rounded-full border border-[#ffe082]">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span className="text-[11px] font-black text-amber-900">{sup.overallRating || 4.9}</span>
                              </div>

                              <VerifiedBadge
                                trustScore={sup.trustScore}
                                overallRating={sup.overallRating}
                                size="sm"
                              />
                              {sup.isVerified && (
                                <span className="flex items-center gap-1 text-[#b90064] text-[12px] font-bold" title="Nexora Verified Partner">
                                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                                  <span className="hidden sm:inline">Verified</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-2.5">
                              {/* Multiple descriptive B2B Business Type Tags */}
                              {(() => {
                                const t = sup.type.toLowerCase();
                                const tags = [];
                                
                                if (t.includes('manufacturer') || t.includes('formulator')) {
                                  tags.push(
                                    <span key="mfg" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-3xs uppercase tracking-wider">
                                      <Factory className="w-3.5 h-3.5 text-indigo-700" />
                                      Contract Manufacturer
                                    </span>
                                  );
                                }
                                if (t.includes('oem') || t.includes('private label') || sup.categories.some(c => c.toLowerCase().includes('oem') || c.toLowerCase().includes('private label'))) {
                                  tags.push(
                                    <span key="oem" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-purple-50 text-purple-800 border border-purple-200 shadow-3xs uppercase tracking-wider">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                                      OEM / Private Label
                                    </span>
                                  );
                                }
                                if (t.includes('wholesaler') || t.includes('stockist')) {
                                  tags.push(
                                    <span key="wh" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-3xs uppercase tracking-wider">
                                      <Package className="w-3.5 h-3.5 text-emerald-700" />
                                      Wholesaler &amp; Stockist
                                    </span>
                                  );
                                }
                                if (t.includes('raw material') || sup.categories.some(c => c.toLowerCase().includes('raw material') || c.toLowerCase().includes('actives'))) {
                                  tags.push(
                                    <span key="raw" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-3xs uppercase tracking-wider">
                                      <FlaskConical className="w-3.5 h-3.5 text-teal-700" />
                                      Raw Materials
                                    </span>
                                  );
                                }
                                if (t.includes('distributor')) {
                                  tags.push(
                                    <span key="dist" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-blue-50 text-[#0050d6] border border-blue-200 shadow-3xs uppercase tracking-wider">
                                      <Building2 className="w-3.5 h-3.5 text-[#0050d6]" />
                                      Distributor
                                    </span>
                                  );
                                }
                                
                                if (tags.length === 0) {
                                  tags.push(
                                    <span key="generic" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-rose-50 text-[#b90064] border border-rose-200 shadow-3xs uppercase tracking-wider">
                                      <Factory className="w-3.5 h-3.5 text-[#b90064]" />
                                      {sup.type}
                                    </span>
                                  );
                                }
                                return tags;
                              })()}

                              <span className="text-[#8c7077] hidden sm:inline">•</span>
                              
                              <span className="flex items-center gap-1 text-[11.5px] text-[#594047] font-bold bg-[#fcf9f8] border border-[#e8e8e8] px-2.5 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5 text-[#b90064]" />
                                <span className="text-[#1c1b1b] font-extrabold">{sup.city}</span>, {sup.state}
                              </span>
                            </div>
                          </div>
                        </div>

                            {/* Compliance Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {sup.isGstVerified && (
                                <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-[10.5px] font-bold rounded-md border border-green-200 flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" />
                                  GST Verified
                                </span>
                              )}
                              {sup.isIsoCertified && (
                                <span className="px-2.5 py-0.5 bg-[#fde7f3] text-[#b90064] text-[10.5px] font-bold rounded-md border border-[#e0bec6] flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  ISO 9001
                                </span>
                              )}
                              {sup.isGmpCertified && (
                                <span className="px-2.5 py-0.5 bg-[#e8f5e9] text-[#00875a] text-[10.5px] font-bold rounded-md border border-[#a5d6a7] flex items-center gap-1">
                                  <BadgeCheck className="w-3 h-3" />
                                  GMP Certified
                                </span>
                              )}
                              {sup.isFdaRegistered && (
                                <span className="px-2.5 py-0.5 bg-[#dbe1ff] text-[#0050d6] text-[10.5px] font-bold rounded-md border border-[#a5c0ff] flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  US-FDA
                                </span>
                              )}
                            </div>

                        {/* Performance Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 px-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl mb-4 text-[12px]">
                          <div>
                            <p className="text-[10px] text-[#8c7077] uppercase tracking-widest font-bold mb-0.5">Business</p>
                            <p className="font-bold text-[#1c1b1b]">12+ Years</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8c7077] uppercase tracking-widest font-bold mb-0.5">Response</p>
                            <p className="font-bold text-[#00875a]">{sup.responseRate || '98% (<2h)'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8c7077] uppercase tracking-widest font-bold mb-0.5">Capacity</p>
                            <p className="font-bold text-[#1c1b1b]">{sup.monthlyCapacity || '100k units/mo'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#8c7077] uppercase tracking-widest font-bold mb-0.5">Lead Time</p>
                            <p className="font-bold text-[#1c1b1b]">15-30 Days</p>
                          </div>
                        </div>

                        {/* Paywall Differentiated Contact UI Block */}
                        <div className="mt-3.5 mb-4 p-4 rounded-xl border border-dashed transition-all bg-[#fdfaf9] border-[#e8d4d8] flex flex-col md:flex-row flex-wrap md:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-[#594047]">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                              <span className="font-bold">Phone:</span>
                              {isPhoneRevealed ? (
                                <span className="font-semibold text-[#1c1b1b] font-mono select-all bg-white px-1.5 py-0.5 rounded border border-[#e8e8e8]">{sup.phone}</span>
                              ) : (
                                <span className="font-medium text-stone-400 select-none tracking-widest">+91 98201 •••••</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                              <span className="font-bold">Email:</span>
                              {isPhoneRevealed ? (
                                <span className="font-semibold text-[#1c1b1b] font-mono select-all bg-white px-1.5 py-0.5 rounded border border-[#e8e8e8]">
                                  {sup.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sourcing.nexoraluxe.com
                                </span>
                              ) : (
                                <span className="font-medium text-stone-400 select-none tracking-widest">contact@•••••••.com</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <MapPin className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                              <span className="font-bold">Plant Address:</span>
                              {isPhoneRevealed ? (
                                <span className="font-semibold text-[#1c1b1b]">{sup.locationDetails?.fullAddress || `${sup.city}, India`}</span>
                              ) : (
                                <span className="font-medium text-stone-400 select-none">MIDC Industrial Zone, Plot C-•••</span>
                              )}
                            </div>
                          </div>

                          {isPhoneRevealed ? (
                            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>Unlocked Contact Card</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePhoneRevealClick(sup)}
                              className="text-[11.5px] font-black text-[#b90064] hover:text-[#8e004b] bg-white border border-[#b90064] hover:bg-[#fde7f3] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                            >
                              <Lock className="w-3 h-3 text-[#b90064]" />
                              <span>Unlock Supplier Details (10 Credits)</span>
                            </button>
                          )}
                        </div>

                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          onClick={() =>
                            onOpenEnquiryModal({
                              title: `${sup.name} Direct Sourcing Enquiry`,
                              supplierName: sup.name,
                              type: sup.type,
                              city: sup.city,
                              state: sup.state
                            })
                          }
                          className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold px-4 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Direct Enquiry</span>
                        </button>

                        <button
                          onClick={() => onNavigateToSupplierProfile?.(sup.id)}
                          className="bg-stone-100 hover:bg-stone-200 text-[#1c1b1b] font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#b90064]" />
                          <span>View Profile</span>
                        </button>

                        <button
                          onClick={() => handlePhoneRevealClick(sup)}
                          className={`border font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isPhoneRevealed 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' 
                              : 'bg-white border-[#b90064] text-[#b90064] hover:bg-[#fde7f3]'
                          }`}
                        >
                          {isPhoneRevealed ? <Unlock className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                          <span>{isPhoneRevealed ? 'Hide Number' : 'Show Number'}</span>
                        </button>

                        {onOpenFacilityTour && (
                          <button
                            onClick={() => onOpenFacilityTour(sup)}
                            className="bg-[#fde7f3] border border-[#e0bec6] text-[#b90064] hover:bg-[#b90064] hover:text-white font-bold px-3.5 py-2 rounded-xl text-[13px] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Play 15-second virtual tour video of manufacturing plant"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>View Facility</span>
                          </button>
                        )}

                        <button
                          onClick={() => onWhatsAppSupplier(sup.name)}
                          className="bg-[#25D366]/10 text-[#075E54] border border-[#25D366]/30 px-3 py-2 rounded-xl hover:bg-[#25D366]/20 transition-colors flex items-center justify-center cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Assets Dropdown Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenAssetsId(isAssetsOpen ? null : sup.id)}
                            className="bg-white border border-[#e8e8e8] text-[#594047] font-bold px-3.5 py-2 rounded-xl hover:bg-[#f0edec] transition-colors text-[13px] flex items-center gap-1.5 cursor-pointer"
                          >
                            <FolderDown className="w-3.5 h-3.5 text-[#b90064]" />
                            <span>Assets</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {isAssetsOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-[#e8e8e8] rounded-xl shadow-lg z-30 py-1.5 animate-in fade-in-50 duration-150">
                              <button
                                onClick={() => {
                                  setOpenAssetsId(null);
                                  showToast(`Downloaded brochure for ${sup.name}`);
                                }}
                                className="w-full text-left px-3.5 py-2 text-[12px] font-semibold text-[#1c1b1b] hover:bg-[#fde7f3] hover:text-[#b90064] transition-colors flex items-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-[#b90064]" />
                                <span>Download Brochure</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenAssetsId(null);
                                  showToast(`Opened Product Catalog for ${sup.name}`);
                                }}
                                className="w-full text-left px-3.5 py-2 text-[12px] font-semibold text-[#1c1b1b] hover:bg-[#fde7f3] hover:text-[#b90064] transition-colors flex items-center gap-2 border-t border-[#f0edec]"
                              >
                                <Package className="w-3.5 h-3.5 text-[#0050d6]" />
                                <span>Product Catalog PDF</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenAssetsId(null);
                                  showToast(`Verified GST/ISO Documents for ${sup.name}`);
                                }}
                                className="w-full text-left px-3.5 py-2 text-[12px] font-semibold text-[#1c1b1b] hover:bg-[#fde7f3] hover:text-[#b90064] transition-colors flex items-center gap-2 border-t border-[#f0edec]"
                              >
                                <Award className="w-3.5 h-3.5 text-[#00875a]" />
                                <span>ISO/GST Status</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (onNavigateToSupplierProfile) {
                              onNavigateToSupplierProfile(sup.id);
                            } else {
                              onOpenEnquiryModal({
                                title: `${sup.name} Full Profile Inspection`,
                                supplierName: sup.name
                              });
                            }
                          }}
                          className="text-[#0050d6] hover:underline font-bold text-[12.5px] ml-auto flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Right Showcase: Product Catalog Thumbnails */}
                    <div className="w-full lg:w-80 shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#e8e8e8] pt-4 lg:pt-0 lg:pl-6 bg-[#fcf9f8] rounded-r-2xl">
                      <div className="flex justify-between items-center mb-2.5">
                        <h4 className="text-[13px] font-bold text-[#1c1b1b]">Product Catalog</h4>
                        <span className="text-[10px] text-[#8c7077] bg-white px-2 py-0.5 rounded-full border border-[#e8e8e8] font-bold uppercase tracking-wider">
                          MOQ: 500+
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 flex-1">
                        {(sup.portfolioProducts && sup.portfolioProducts.length > 0
                          ? sup.portfolioProducts.slice(0, 3)
                          : [
                              {
                                id: 'p1',
                                name: 'Vitamin C Serum Base',
                                image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
                                price: '₹450 / L',
                                moq: '50 Liters'
                              },
                              {
                                id: 'p2',
                                name: 'Night Cream Repair Base',
                                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
                                price: '₹380 / Unit',
                                moq: '100 Units'
                              },
                              {
                                id: 'p3',
                                name: 'Body Lotion Bulk Fl',
                                image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
                                price: '₹210 / Unit',
                                moq: '200 Units'
                              }
                            ]
                        ).map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (onNavigateToProductDetail) {
                                onNavigateToProductDetail(prod.id);
                              } else {
                                onOpenEnquiryModal({
                                  title: prod.name,
                                  supplierName: sup.name,
                                  image: prod.image,
                                  priceRange: prod.price,
                                  moq: prod.moq
                                });
                              }
                            }}
                            className="bg-white rounded-xl border border-[#e8e8e8] hover:border-[#b90064] aspect-square relative group/thumb overflow-hidden cursor-pointer p-1 transition-all"
                            title={`Enquire about ${prod.name}`}
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover rounded-lg group-hover/thumb:scale-108 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                              <p className="text-[11px] text-white font-bold truncate leading-tight">{prod.name}</p>
                              <p className="text-[9px] text-[#ffcbd9] font-semibold">{prod.price}</p>
                            </div>
                          </div>
                        ))}

                        <div
                          onClick={() =>
                            onOpenEnquiryModal({
                              title: `${sup.name} Entire Catalog`,
                              supplierName: sup.name
                            })
                          }
                          className="bg-white rounded-xl border border-[#e8e8e8] hover:border-[#b90064] aspect-square flex flex-col items-center justify-center transition-colors cursor-pointer group/more p-2"
                        >
                          <Package className="w-5 h-5 text-[#b90064] mb-1 group-hover/more:scale-110 transition-transform" />
                          <p className="text-[11px] text-[#b90064] font-bold text-center leading-tight">
                            View All 24+
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Interspersed In-Feed Formulation Banner (after second supplier) */}
                  {index === 1 && (
                    <div className="bg-[#b90064] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm my-2">
                      <div className="flex-1 z-10">
                        <h3 className="text-xl font-bold tracking-tight mb-1.5 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#ffcbd9]" />
                          <span>Need a Custom Formulation?</span>
                        </h3>
                        <p className="text-[#ffd9e2] text-[13px] mb-3 leading-relaxed font-medium">
                          Work with our expert chemists to develop, test, and package your unique cosmetic line from scratch.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">R&amp;D Lab Access</span>
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">Custom Packaging</span>
                          <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">Compliance Testing</span>
                        </div>
                      </div>
                      <div className="z-10 shrink-0 w-full md:w-auto">
                        <button
                          onClick={onOpenRFQModal}
                          className="w-full md:w-auto bg-white text-[#b90064] font-bold px-6 py-3 rounded-xl hover:bg-[#fde7f3] transition-colors flex items-center justify-center gap-2 cursor-pointer text-[13px]"
                        >
                          <span>Request Custom Quote</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Floating Bottom Comparison & Action Bar Tray */}
          {selectedComparisonIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#e8e8e8] rounded-full px-6 py-3 flex gap-4 items-center z-50 shadow-2xl transition-all animate-in slide-in-from-bottom-6">
              <div className="flex items-center gap-3 pr-4 border-r border-[#e8e8e8]">
                <span className="text-[13px] font-bold text-[#1c1b1b]">
                  {selectedComparisonIds.length} Suppliers Selected
                </span>
              </div>

              <button
                onClick={() => {
                  if (onOpenComparisonModal) {
                    onOpenComparisonModal(selectedSuppliersObjects);
                  } else {
                    showToast(`Comparing ${selectedComparisonIds.length} suppliers`);
                  }
                }}
                className="flex items-center gap-1.5 text-[#1c1b1b] hover:text-[#b90064] transition-colors font-bold text-[13px] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#b90064]" />
                <span>Compare Specs</span>
              </button>

              <div className="w-px h-5 bg-[#e8e8e8]" />

              <button
                onClick={() => {
                  const csvData = selectedSuppliersObjects.map((s) => `${s.name},${s.type},${s.city},${s.phone}`).join('\n');
                  const blob = new Blob([`Name,Type,City,Phone\n${csvData}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Nexora_Suppliers_Export.csv`;
                  a.click();
                  showToast('Exported selected suppliers to CSV');
                }}
                className="flex items-center gap-1.5 text-[#1c1b1b] hover:text-[#b90064] transition-colors font-bold text-[13px] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#0050d6]" />
                <span>Export CSV</span>
              </button>

              <div className="w-px h-5 bg-[#e8e8e8]" />

              <button
                onClick={() =>
                  onOpenEnquiryModal({
                    title: `Bulk Sourcing Request to ${selectedComparisonIds.length} Suppliers`,
                    supplierName: `${selectedComparisonIds.length} Selected Manufacturers`
                  })
                }
                className="bg-[#b90064] text-white font-bold px-5 py-2 rounded-full hover:bg-[#8e004b] transition-colors text-[13px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Bulk Enquiry</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end md:hidden">
          <div className="bg-white w-5/6 max-w-md h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#e8e8e8] mb-5">
                <h2 className="text-lg font-bold text-[#1c1b1b]">Filter Suppliers</h2>
                <button onClick={() => setIsMobileFilterOpen(false)} className="text-[#8c7077]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Sort By */}
              <div className="mb-5">
                <h3 className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mb-2.5">
                  Sort Manufacturers
                </h3>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-[#fcf9f8] border border-[#e8e8e8] text-[13px] font-semibold text-[#1c1b1b] rounded-xl py-2.5 pl-3.5 pr-8 focus:ring-1 focus:ring-[#b90064] cursor-pointer"
                  >
                    <option value="Relevance">Sort: Relevance</option>
                    <option value="Rating">Sort: Rating</option>
                    <option value="Year Established">Sort: Year Established</option>
                    <option value="Employee Count">Sort: Employee Count</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7077] pointer-events-none" />
                </div>
              </div>

              {/* Mobile Business Type */}
              <div className="mb-5">
                <h3 className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mb-2.5">
                  Business Type
                </h3>
                <div className="flex flex-col gap-2">
                  {['Manufacturer', 'Wholesaler', 'Distributor', 'Exporter', 'OEM/ODM'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-[13px] text-[#1c1b1b]">
                      <input
                        type="checkbox"
                        checked={businessTypeFilters.includes(type)}
                        onChange={() => toggleBusinessTypeFilter(type)}
                        className="rounded border-[#e8e8e8] text-[#b90064]"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e8e8e8] flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 border border-[#e8e8e8] rounded-xl text-[13px] font-bold text-[#594047]"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#b90064] text-white rounded-xl text-[13px] font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Contact Reveal Paywall Modal */}
      {paywallModalSupplier && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e8e8e8] shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 relative text-center">
            <button 
              type="button"
              onClick={() => setPaywallModalSupplier(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-[#fde7f3] text-[#b90064] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e0bec6]/30">
              <Lock className="w-6 h-6 text-[#b90064]" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#b90064] bg-[#fde7f3] px-3 py-1 rounded-full">
              Premium B2B Directory Unlock
            </span>

            <h3 className="text-lg font-black text-[#1c1b1b] mt-3 mb-2">
              Unlock Contact Details
            </h3>
            <p className="text-[12.5px] text-[#594047] leading-relaxed mb-5">
              Confirm spending credits to unlock the direct mobile sourcing lines, executive emails, and registered factory plant address for <strong className="text-[#1c1b1b] font-extrabold">{paywallModalSupplier.name}</strong>.
            </p>

            {/* Credit Ledger Breakdown */}
            <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl p-4 text-left mb-6 text-[12.5px] space-y-2.5">
              <div className="flex justify-between font-medium">
                <span className="text-[#594047]">Your Sourcing Wallet:</span>
                <span className="font-bold text-[#1c1b1b]">{userCredits} Credits</span>
              </div>
              <div className="flex justify-between font-medium text-amber-700">
                <span>Unlock Sourcing Fee:</span>
                <span className="font-extrabold">-10 Credits</span>
              </div>
              <div className="w-full h-px bg-[#e8e8e8]"></div>
              <div className="flex justify-between font-bold text-[#b90064]">
                <span>Remaining Balance:</span>
                <span>{userCredits - 10} Credits</span>
              </div>
            </div>

            {/* Benefits locked badges */}
            <div className="grid grid-cols-3 gap-2.5 mb-6 text-[10.5px] font-bold text-[#594047]">
              <div className="p-2 bg-[#fdfaf9] rounded-lg border border-[#e8d4d8] flex flex-col items-center">
                <Phone className="w-4 h-4 text-[#b90064] mb-1" />
                <span>Direct Mobile</span>
              </div>
              <div className="p-2 bg-[#fdfaf9] rounded-lg border border-[#e8d4d8] flex flex-col items-center">
                <Mail className="w-4 h-4 text-[#b90064] mb-1" />
                <span>Corp Email</span>
              </div>
              <div className="p-2 bg-[#fdfaf9] rounded-lg border border-[#e8d4d8] flex flex-col items-center">
                <MapPin className="w-4 h-4 text-[#b90064] mb-1" />
                <span>Full Address</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => confirmUnlockSupplier(paywallModalSupplier.id, paywallModalSupplier.name)}
                className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[13.5px] py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock with 10 Credits</span>
              </button>
              <button
                type="button"
                onClick={() => setPaywallModalSupplier(null)}
                className="w-full bg-white hover:bg-[#f0edec] text-[#594047] font-bold text-[13px] py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
