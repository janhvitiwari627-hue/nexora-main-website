import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, MapPin, ShieldCheck, ArrowLeft, Star, ExternalLink, 
  Calendar, Users, Award, Briefcase, Sparkles, Building2, 
  ChevronRight, ChevronLeft, Check, MessageSquare, FileText, Bookmark, 
  BookmarkCheck, CheckCircle2, SlidersHorizontal, ArrowUpDown, PlusCircle
} from 'lucide-react';

interface BrandDirectoryDetailScreenProps {
  onOpenEnquiryModal: (productName: string, supplierName: string) => void;
  onOpenRFQModal: () => void;
  onOpenFacilityTour: (supplierName: string) => void;
  onNavigateToSuppliers: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
}

const MOCK_BRANDS = [
  {
    id: 'b1',
    name: 'Aura Beauty Labs',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJ-JsV4RQ8_6O3skDxu1yeXyZ1uDoVdkrXJrKEoc-REI6s2Ctt8DGBLz04mevk1QLqNmbiTD0JYu4S1KxBueueVl1mfIgwsQOPMwE_6mglJWbRg0UCnRp6beBhwek581NsXfBCDDSZ-hzcmoB9zopoUSnnjyKA6yrqFDum4CshWSOC_WC-zDmMRAfo4i-ak3zXm93SP089UxrNBZMum0V62zNazRMj6pH2GvlhXLjTN8AYAV8SWw6L',
    type: 'OEM & Contract Manufacturer',
    rating: 4.9,
    reviewsCount: 42,
    location: 'Mumbai, Maharashtra',
    established: '2012',
    establishedYearNum: 2012,
    employees: '150-200',
    employeeCountNum: 200,
    capacity: '50,000 units / day',
    responseRate: '98%',
    gstVerified: true,
    certifications: ['ISO 22716', 'GMP', 'Cruelty-Free', 'Halal'],
    about: 'Aura Beauty Labs is a state-of-the-art beauty brand developer and contract manufacturer. We specialize in high-efficacy skincare, premium haircare formulations, and vegan cosmetics. Partnering with top-tier global beauty brands for private label execution.',
    categories: ['Skincare', 'Haircare', 'Cosmetics'],
    products: [
      { id: 'bp1', name: 'Peptide Skin Barrier Repair Cream', price: '₹145 - ₹180', moq: '2,000 Units', image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp2', name: 'Clinical Vitamin C Infused Glow Serum', price: '₹190 - ₹220', moq: '3,000 Units', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp3', name: 'Salicylic Acid Overnight Blemish Gel', price: '₹110 - ₹135', moq: '5,000 Units', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Quality Control Lab', desc: 'Rigorous batch testing and stability protocols' },
      { title: 'Class 10,000 Cleanroom', desc: 'ISO 7 certified packaging and automated filling lines' },
      { title: 'High-Shear Mixing Suite', desc: 'Undergoing strict molecular-emulsion quality controls' }
    ]
  },
  {
    id: 'b2',
    name: 'Dermaglow India Ltd',
    logo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&auto=format&fit=crop&q=60',
    type: 'Derma-Cosmetic Supplier',
    rating: 4.8,
    reviewsCount: 31,
    location: 'Delhi NCR',
    established: '2008',
    establishedYearNum: 2008,
    employees: '100-150',
    employeeCountNum: 150,
    capacity: '35,000 units / day',
    responseRate: '96%',
    gstVerified: true,
    certifications: ['GMP', 'ISO 9001', 'FDA Approved'],
    about: 'Dermaglow India manufactures medical-grade cosmetics and clinically tested skincare solutions. We work closely with clinical dermatologists to supply salons, spas, and premium dermo-cosmetic brands nationwide.',
    categories: ['Skincare', 'Professional Derma'],
    products: [
      { id: 'bp4', name: 'Dermatological Barrier Repair Fluid', price: '₹220 - ₹260', moq: '1,000 Units', image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp5', name: 'Advanced Ceramide Hydrating Cleanser', price: '₹125 - ₹150', moq: '2,500 Units', image: 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Dermatological Testing Lab', desc: 'In-vitro efficacy testing & skin irritation profiling' },
      { title: 'High-Capacity Cold Storage', desc: 'Preserving active biological enzymes & botanical extracts' }
    ]
  },
  {
    id: 'b3',
    name: 'LuxeForm Organics',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&auto=format&fit=crop&q=60',
    type: 'Eco-Luxe Private Labeler',
    rating: 4.7,
    reviewsCount: 19,
    location: 'Bengaluru, Karnataka',
    established: '2016',
    establishedYearNum: 2016,
    employees: '50-80',
    employeeCountNum: 80,
    capacity: '20,000 units / day',
    responseRate: '94%',
    gstVerified: true,
    certifications: ['Ecocert Organic', 'ISO 22716', '100% Vegan'],
    about: 'LuxeForm Organics is dedicated to green chemistry and clean beauty. We offer turn-key solutions from botanical extraction to custom biodegradable packaging for organic beauty startups.',
    categories: ['Skincare', 'Bodycare', 'Haircare'],
    products: [
      { id: 'bp6', name: 'Cold-Pressed Marula Infused Facial Oil', price: '₹280 - ₹340', moq: '500 Units', image: 'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp7', name: 'Organic Rosemary & Bamboo Volumizing Shampoo', price: '₹140 - ₹175', moq: '2,000 Units', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Supercritical CO2 Extraction Unit', desc: 'For high-purity natural and botanical oils' },
      { title: 'Post-Consumer Recycled Packaging Line', desc: 'Advanced zero-waste bottle design facility' }
    ]
  },
  {
    id: 'b4',
    name: 'CosmoPack Packaging Solutions',
    logo: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=200&auto=format&fit=crop&q=60',
    type: 'Packaging & Container Manufacturer',
    rating: 4.85,
    reviewsCount: 56,
    location: 'Ahmedabad, Gujarat',
    established: '2005',
    establishedYearNum: 2005,
    employees: '250-300',
    employeeCountNum: 300,
    capacity: '120,000 units / day',
    responseRate: '99%',
    gstVerified: true,
    certifications: ['ISO 9001', 'GMP', 'Sedex Audited'],
    about: 'Leading manufacturer of luxury cosmetic glass bottles, PCR acrylic containers, airless pump dispensers, and customized anodized caps with precision tooling.',
    categories: ['Packaging', 'Cosmetics'],
    products: [
      { id: 'bp8', name: 'Frosted Glass Dropper Bottle (30ml)', price: '₹18 - ₹24', moq: '5,000 Units', image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp9', name: 'Double-Walled Acrylic Cream Jar (50g)', price: '₹28 - ₹36', moq: '3,000 Units', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Automated Injection Molding', desc: 'High-precision molds with sub-micron tolerances' },
      { title: 'Cleanroom Assembly Area', desc: 'Dust-free environment for medical and salon grade packaging' }
    ]
  },
  {
    id: 'b5',
    name: 'Radiant Cosmeceuticals Plant',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=60',
    type: 'Color Cosmetics & Makeup OEM',
    rating: 4.75,
    reviewsCount: 28,
    location: 'Hyderabad, Telangana',
    established: '2014',
    establishedYearNum: 2014,
    employees: '120-160',
    employeeCountNum: 160,
    capacity: '40,000 units / day',
    responseRate: '97%',
    gstVerified: true,
    certifications: ['GMP', 'FDA Approved', 'Cruelty-Free'],
    about: 'Specialized in clean-label decorative makeup, liquid lipsticks, high-coverage foundations, and mineral pigmented eyeshadow palettes.',
    categories: ['Cosmetics', 'Clean Makeup'],
    products: [
      { id: 'bp10', name: 'Ultra-Matte Longwear Liquid Lip', price: '₹65 - ₹85', moq: '2,500 Units', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&auto=format&fit=crop&q=60' },
      { id: 'bp11', name: 'Micro-Fine Mineral Setting Powder', price: '₹95 - ₹120', moq: '2,000 Units', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop&q=60' }
    ],
    facilities: [
      { title: 'Color Matching Spectrometry Lab', desc: 'Digital Pantone precision color replication' },
      { title: 'Sterile Powder Pressing Suite', desc: 'Automated hydraulic press for pressed powders' }
    ]
  }
];

export const BrandDirectoryDetailScreen: React.FC<BrandDirectoryDetailScreenProps> = ({
  onOpenEnquiryModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToSuppliers,
  onNavigateToSupplierProfile
}) => {
  const [selectedBrand, setSelectedBrand] = useState<typeof MOCK_BRANDS[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Relevance');
  const [savedBrandIds, setSavedBrandIds] = useState<string[]>(['b1']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scroll indicator state for categories bar
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const categories = [
    'All', 'Skincare', 'Haircare', 'Cosmetics', 
    'Professional Derma', 'Packaging', 'Clean Beauty', 
    'Ayurvedic & Herbal', 'Fragrance & Deos', 'Salon Equipment'
  ];

  const checkScroll = () => {
    if (filterScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      filterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const toggleSaveBrand = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedBrandIds(prev => {
      const isSaved = prev.includes(id);
      if (isSaved) {
        showToast(`Removed ${name} from your saved shortlist`);
        return prev.filter(item => item !== id);
      } else {
        showToast(`Saved ${name} to your sourcing shortlist`);
        return [...prev, id];
      }
    });
  };

  // Filter & Sort logic
  const filteredBrands = useMemo(() => {
    const list = MOCK_BRANDS.filter(brand => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            brand.about.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            brand.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || brand.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'Rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'Year Established') {
        return a.establishedYearNum - b.establishedYearNum;
      }
      if (sortBy === 'Employee Count') {
        return b.employeeCountNum - a.employeeCountNum;
      }
      return 0; // Default Relevance
    });
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bg-[#fdf8f8] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1c1b1b] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Banner / Navigation Header */}
      <div className="bg-white border-b border-[#e8e8e8] py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#b90064] uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Nexora Partner Brands &amp; Contract Formulators</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1c1b1b] tracking-tight">
              {selectedBrand ? selectedBrand.name : 'Brand Directory & OEM Manufacturers'}
            </h1>
            <p className="text-xs text-[#594047] mt-1">
              {selectedBrand 
                ? `${selectedBrand.type} • GST Registered Manufacturer`
                : 'Directly connect with audited beauty brands, contract formulators, and GMP certified manufacturing plants.'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedBrand ? (
              <button 
                onClick={() => setSelectedBrand(null)}
                className="flex items-center gap-1.5 px-4 py-2 border border-[#e8e8e8] hover:bg-neutral-50 rounded-lg text-xs font-bold text-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>
            ) : (
              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Post Custom Brand RFQ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {!selectedBrand ? (
          /* ================== DIRECTORY VIEW ================== */
          <div className="space-y-8 pb-12">
            
            {/* Filters & Sorting Bar */}
            <div className="bg-white p-4 border border-[#e8e8e8] rounded-xl flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 shadow-2xs">
              
              {/* Search Bar */}
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search brands, formulators, active ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none rounded-lg pl-10 pr-4 py-2 text-xs text-[#1c1b1b] font-medium"
                />
              </div>

              {/* Category Filter Tabs with Gradient Fade & Scroll Indicators */}
              <div className="relative flex-1 min-w-0 max-w-full overflow-hidden flex items-center">
                
                {/* Left Fade Gradient */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollLeft ? 'opacity-100' : 'opacity-0'
                  }`} 
                />

                {/* Left Scroll Button */}
                {canScrollLeft && (
                  <button
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll Left"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white shadow-md border border-[#e8e8e8] flex items-center justify-center text-[#594047] hover:text-[#b90064] hover:border-[#b90064] cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Scrollable Container */}
                <div 
                  ref={filterScrollRef}
                  onScroll={checkScroll}
                  className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none scroll-smooth w-full"
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-[#b90064] text-white shadow-3xs'
                          : 'bg-[#f7f2f2] text-[#594047] hover:bg-[#e8e8e8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  
                  {/* Category Count Indicator */}
                  <span className="text-[10px] text-[#8c7077] font-bold bg-[#fcf9f8] border border-[#e8e8e8] px-2 py-1 rounded-full shrink-0 whitespace-nowrap ml-1">
                    +{categories.length - 4} more
                  </span>
                </div>

                {/* Right Fade Gradient */}
                <div 
                  className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                    canScrollRight ? 'opacity-100' : 'opacity-0'
                  }`} 
                />

                {/* Right Scroll Button */}
                {canScrollRight && (
                  <button
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll Right"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white shadow-md border border-[#e8e8e8] flex items-center justify-center text-[#594047] hover:text-[#b90064] hover:border-[#b90064] cursor-pointer transition-all"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#f0edec]">
                <div className="flex items-center gap-1.5 text-xs text-[#594047] font-bold">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#b90064]" />
                  <span>Sort by:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#fcf9f8] border border-[#e8e8e8] text-xs font-semibold text-[#1c1b1b] rounded-lg px-3 py-2 focus:outline-none focus:border-[#b90064] cursor-pointer"
                >
                  <option value="Relevance">Relevance</option>
                  <option value="Rating">Rating (Highest First)</option>
                  <option value="Year Established">Year Established (Oldest First)</option>
                  <option value="Employee Count">Employee Count (Largest First)</option>
                </select>
              </div>

            </div>

            {/* Inline Sourcing RFQ CTA Banner */}
            <div className="bg-gradient-to-r from-[#fff5f8] via-[#fdf8f8] to-[#fbf0f4] border border-[#f5d0de] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0 border border-[#f5d0de]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs md:text-sm text-zinc-900 leading-tight">
                    Looking for custom beauty formulations, private label batches, or bespoke packaging?
                  </h4>
                  <p className="text-[11px] md:text-xs text-[#594047] mt-0.5">
                    Post your requirement once to receive custom quotes, lab trial terms, and verified MOQ offers from audited GMP factories within 24 hours.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenRFQModal}
                className="bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap self-stretch md:self-auto justify-center"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Post Custom Brand RFQ</span>
              </button>
            </div>

            {/* Brands & Manufacturers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredBrands.map((brand) => {
                const isSaved = savedBrandIds.includes(brand.id);

                return (
                  <div 
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand)}
                    className="bg-white border border-[#e8e8e8] hover:border-[#b90064] hover:shadow-md rounded-2xl p-5 md:p-6 transition-all flex flex-col justify-between cursor-pointer group relative"
                  >
                    <div className="space-y-4">
                      
                      {/* Brand Banner / Logo & Bookmark Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={brand.logo} 
                            alt={brand.name} 
                            className="w-13 h-13 rounded-xl object-cover border border-[#e8e8e8] shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#b90064] transition-colors flex items-center gap-1 truncate">
                              <span className="truncate">{brand.name}</span>
                              <ShieldCheck className="w-4 h-4 text-[#b90064] fill-[#fde7f3] shrink-0" />
                            </h3>
                            <span className="text-[11px] text-[#594047] font-semibold truncate block">{brand.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => toggleSaveBrand(brand.id, brand.name, e)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isSaved 
                                ? 'bg-[#fde7f3] text-[#b90064] border border-[#e0bec6]' 
                                : 'bg-[#f7f2f2] text-zinc-400 hover:text-[#b90064] hover:bg-[#fde7f3]'
                            }`}
                            title={isSaved ? "Saved in Shortlist" : "Bookmark / Save"}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4 fill-[#b90064]" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                          <span className="text-[10px] bg-[#fde7f3] text-[#b90064] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                            GST Verified
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#594047] leading-relaxed line-clamp-3">
                        {brand.about}
                      </p>

                      {/* Key Verified Sourcing Metrics Grid (Unclipped, clean responsive layout) */}
                      <div className="bg-[#fcf9f8] p-3.5 rounded-xl border border-[#e8e8e8] space-y-2.5 my-2">
                        <div className="grid grid-cols-2 gap-2.5 text-[11px] text-[#594047]">
                          <div className="flex items-center gap-1.5 min-w-0" title={`Location: ${brand.location}`}>
                            <MapPin className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                            <span className="truncate font-semibold">{brand.location}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 min-w-0" title={`Established: ${brand.established}`}>
                            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">Est: <span className="font-bold text-zinc-900">{brand.established}</span></span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0" title={`Employees: ${brand.employees}`}>
                            <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">Team: <span className="font-bold text-zinc-900">{brand.employees}</span></span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0" title={`Rating: ${brand.rating} out of 5 (${brand.reviewsCount} verified audits)`}>
                            <div className="bg-[#fff8e6] text-[#92400e] border border-[#ffe082] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-black shrink-0">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                              <span>{brand.rating}</span>
                            </div>
                            <span className="text-[10.5px] text-[#8c7077] font-semibold">({brand.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#e8e8e8] flex items-center justify-between text-[10px] text-[#8c7077]">
                          <span className="font-semibold">Capacity: <span className="text-zinc-900 font-bold">{brand.capacity}</span></span>
                          <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">Response: {brand.responseRate}</span>
                        </div>
                      </div>

                      {/* Certification chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {brand.certifications.map((cert) => (
                          <span key={cert} className="text-[9.5px] bg-[#f7f2f2] text-zinc-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide border border-[#e8e8e8]/50">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Direct Contact & Quick Action CTAs Row */}
                    <div className="mt-5 pt-4 border-t border-[#e8e8e8] space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEnquiryModal(`Direct Manufacturing Enquiry`, brand.name);
                          }}
                          className="bg-white border border-[#b90064] text-[#b90064] hover:bg-[#fde7f3] font-bold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Direct Message</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRFQModal();
                          }}
                          className="bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Request Quote</span>
                        </button>
                      </div>

                      {/* Primary Navigation Action */}
                      <div className="flex items-center justify-between text-xs font-bold text-[#b90064] group-hover:text-[#8e004b] pt-1">
                        <span>View Formulations &amp; Facility</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredBrands.length === 0 && (
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto shadow-2xs space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center mx-auto border border-[#f5d0de]">
                  <Building2 className="w-7 h-7" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-base md:text-lg text-zinc-950">
                    No formulation brands found
                  </h3>
                  <p className="text-xs text-[#594047] leading-relaxed max-w-md mx-auto">
                    {searchQuery 
                      ? `We couldn't find an existing listed manufacturer matching "${searchQuery}". Submit a custom RFQ to have our verified supplier network quote your exact specifications.`
                      : `No manufacturers found in the "${selectedCategory}" category. Post a custom RFQ to connect with unlisted certified formulators.`
                    }
                  </p>
                </div>

                {/* Prominent RFQ Placement for Empty State */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button 
                    onClick={onOpenRFQModal}
                    className="w-full sm:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Post Custom Brand RFQ</span>
                  </button>

                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSortBy('Relevance'); }}
                    className="w-full sm:w-auto bg-[#f7f2f2] hover:bg-[#e8e8e8] text-zinc-700 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Clear all search filters
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ================== BRAND DETAIL VIEW ================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
            
            {/* Left: Brand Story & Manufacturing capacity (col-span-8) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Cover Card */}
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedBrand.logo} 
                      alt={selectedBrand.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-[#e8e8e8]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-xl font-extrabold text-zinc-900">{selectedBrand.name}</h2>
                        <ShieldCheck className="w-5 h-5 text-[#b90064] fill-[#fde7f3]" />
                      </div>
                      <p className="text-xs text-[#594047] font-semibold">{selectedBrand.type}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#b90064]" /> {selectedBrand.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onNavigateToSupplierProfile?.(selectedBrand.id)}
                      className="bg-white border border-[#b90064] text-[#b90064] hover:bg-[#fde7f3] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Visit Mini-Website</span>
                    </button>
                    <button
                      onClick={() => onOpenFacilityTour(selectedBrand.name)}
                      className="border border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064] text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Audit Facility</span>
                    </button>
                    <button
                      onClick={() => onOpenEnquiryModal('Custom Product Development', selectedBrand.name)}
                      className="bg-[#b90064] hover:bg-[#8e004b] text-white text-xs font-extrabold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Enquire Custom Batch</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-zinc-900">About Manufacturer / Brand Owner</h3>
                  <p className="text-xs text-[#594047] leading-relaxed">
                    {selectedBrand.about}
                  </p>
                </div>

                {/* Key specs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-center">
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Established</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.established}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Daily Capacity</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block">{selectedBrand.capacity}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Response Rate</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-emerald-600">{selectedBrand.responseRate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">GST Verified</span>
                    <span className="text-sm font-extrabold text-zinc-900 mt-1 block text-[#b90064]">Yes</span>
                  </div>
                </div>
              </div>

              {/* Private Label Showcase */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-[#1c1b1b] flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-[#b90064]" />
                  <span>Available Private Label Formulations</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedBrand.products.map((prod) => (
                    <div key={prod.id} className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden flex flex-col justify-between shadow-3xs">
                      <div className="flex gap-4 p-4">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-20 h-20 rounded-lg object-cover border border-[#e8e8e8] shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-xs text-zinc-900 leading-tight">{prod.name}</h4>
                          <p className="text-[11px] text-[#b90064] font-bold">Estimated Cost: {prod.price} <span className="text-zinc-400 font-normal">/ unit</span></p>
                          <p className="text-[10px] text-[#594047] font-semibold">Min Order Qty: {prod.moq}</p>
                        </div>
                      </div>

                      <div className="px-4 py-2.5 bg-[#fcf9f8] border-t border-[#e8e8e8] flex items-center justify-between">
                        <span className="text-[9.5px] bg-[#fde7f3] text-[#b90064] px-1.5 py-0.5 rounded font-bold uppercase">Formulation Ready</span>
                        <button
                          onClick={() => onOpenEnquiryModal(prod.name, selectedBrand.name)}
                          className="text-xs font-bold text-[#b90064] hover:underline cursor-pointer"
                        >
                          Get Best Price Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facility & GMP Compliance details */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-6 space-y-4 shadow-3xs">
                <h3 className="font-extrabold text-sm text-zinc-900 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#b90064]" />
                  <span>State of the Art Facilities &amp; Standards</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedBrand.facilities.map((fac, i) => (
                    <div key={i} className="p-4 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg">
                      <h4 className="font-bold text-xs text-zinc-900 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b90064]" />
                        {fac.title}
                      </h4>
                      <p className="text-[11px] text-[#594047] leading-relaxed">{fac.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Supplier trust check sidebar (col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sourcing credentials check */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4 shadow-3xs">
                <h3 className="font-extrabold text-xs text-zinc-900 uppercase tracking-wider text-[#8c7077]">Trust &amp; Verification Signals</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">GST Registration Confirmed</span>
                      <span className="block text-[10.5px] text-[#594047]">Corporate tax filings fully checked &amp; active.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">GMP &amp; ISO 22716 Audited</span>
                      <span className="block text-[10.5px] text-[#594047]">Maintains pristine hygienic and quality compliance standards.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900">Stable Response rate (98%)</span>
                      <span className="block text-[10.5px] text-[#594047]">Usually responds within 2-4 business hours.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Consultation contact widget */}
              <div className="bg-gradient-to-br from-[#b90064] to-[#8e004b] text-white rounded-xl p-6 space-y-4 shadow-sm text-center md:text-left">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#f5ced8]">Turn-Key Service</h3>
                <h4 className="font-black text-lg leading-tight">Need custom beauty formulation?</h4>
                <p className="text-xs text-[#f5ced8] leading-relaxed">
                  Let us connect you directly with Aura formulation specialists to build your private label brand catalogs from scratch.
                </p>
                <button
                  onClick={() => onOpenEnquiryModal('Beauty private label consulting', selectedBrand.name)}
                  className="w-full py-3 bg-white hover:bg-neutral-50 text-[#b90064] font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Request Consultation Call
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
};
