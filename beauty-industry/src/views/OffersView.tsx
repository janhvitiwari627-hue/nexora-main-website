import React, { useState } from 'react';
import { 
  Search, MapPin, ChevronDown, CheckCircle2, ChevronUp, 
  Sparkles, Filter, X, ArrowRight, Tag, ShieldCheck, Store, Calendar,
  TrendingUp, Clock, PackageCheck, Send, Layers, Check
} from 'lucide-react';
import { Product } from '../types';

interface OfferItem {
  id: string;
  title: string;
  supplier: string;
  isVerified: boolean;
  category: string;
  offerType: 'Wholesale Offers' | 'Bulk Discounts' | 'Seasonal Offers' | 'New Product Offers';
  discountText: string;
  moq: string;
  description: string;
  image: string;
  isFeatured?: boolean;
  isNew?: boolean;
  validUntil: string;
  originalPrice?: string;
  offerPrice?: string;
}

const INITIAL_OFFERS: OfferItem[] = [
  {
    id: 'off-featured',
    title: 'Luminous Peptide Serum - Bulk Launch Deal',
    supplier: 'Aura Beauty India',
    isVerified: true,
    category: 'Skincare',
    offerType: 'New Product Offers',
    discountText: '30% Off Wholesale',
    moq: '50 Units',
    description: 'Exclusive introductory rates on our new high-performance peptide complex. Designed for premium estheticians and luxury retail.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    isFeatured: true,
    validUntil: 'End of Month',
    originalPrice: '₹15,000 / unit',
    offerPrice: '₹10,500 / unit'
  },
  {
    id: 'off-1',
    title: 'Seasonal Glow Sale - Serum Collection',
    supplier: 'Aura Beauty India',
    isVerified: true,
    category: 'Skincare',
    offerType: 'Seasonal Offers',
    discountText: '30% Off',
    moq: '25 Units',
    description: 'Stock up on premium hydration serums for the dry season with guaranteed 48-hour salon delivery.',
    image: 'https://images.unsplash.com/photo-1608248597260-20e365021e10?auto=format&fit=crop&q=80&w=600',
    validUntil: '12 Days Left',
    originalPrice: '₹12,000 / unit',
    offerPrice: '₹8,400 / unit'
  },
  {
    id: 'off-2',
    title: 'Salon Equipment Clearance',
    supplier: 'Bharat Backbar Wholesalers',
    isVerified: true,
    category: 'Salon Tools & Eq.',
    offerType: 'Bulk Discounts',
    discountText: 'Tiered Savings',
    moq: '5 Units',
    description: 'End of year clearance on professional grade ionic dryers, steamers, and ergonomics styling chairs.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600',
    validUntil: '5 Days Left',
    originalPrice: '₹55,000 / set',
    offerPrice: 'From ₹35,500 / set'
  },
  {
    id: 'off-3',
    title: 'New Brand Launch: Velvet Matte Mask',
    supplier: 'Mumbai Beauty Imports',
    isVerified: false,
    category: 'Haircare',
    offerType: 'New Product Offers',
    discountText: '-20% Base Rate',
    moq: '10 Units',
    description: 'Exclusive introductory rates on our new intensive repair hair mask line enriched with argan & keratin.',
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    validUntil: '20 Days Left',
    originalPrice: '₹4,100 / unit',
    offerPrice: '₹3,280 / unit'
  },
  {
    id: 'off-4',
    title: 'Organic Botanical Elixir Masterpack',
    supplier: 'Kavya Ayurvedic Botanicals',
    isVerified: true,
    category: 'Skincare',
    offerType: 'Wholesale Offers',
    discountText: '25% Off + Free Shipping',
    moq: '15 Units',
    description: '100% cold-pressed organic face and body botanical oils. Certified eco-luxury packaging included.',
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=600',
    validUntil: '18 Days Left',
    originalPrice: '₹7,800 / unit',
    offerPrice: '₹5,850 / unit'
  },
  {
    id: 'off-5',
    title: 'Pro Ionic Dryer & Styler Bundle',
    supplier: 'Vertex Salon Technologies',
    isVerified: true,
    category: 'Salon Tools & Eq.',
    offerType: 'Bulk Discounts',
    discountText: 'Save ₹15,000 / Set',
    moq: '3 Sets',
    description: 'Ultra-silent brushless digital motor dryers paired with ceramic titanium straightening irons.',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=600',
    validUntil: '8 Days Left',
    originalPrice: '₹47,000 / set',
    offerPrice: '₹31,500 / set'
  },
  {
    id: 'off-6',
    title: 'Ayurvedic Hydration Mask Masterpack',
    supplier: 'Royal Glamour India Supplies',
    isVerified: true,
    category: 'Skincare',
    offerType: 'Wholesale Offers',
    discountText: 'Buy 50 Get 10 Free',
    moq: '50 Units',
    description: 'Saffron & aloe sheet masks engineered for post-peel aesthetic recovery and instant salon radiance.',
    image: 'https://images.unsplash.com/photo-1567928269937-ae146e45b428?auto=format&fit=crop&q=80&w=600',
    validUntil: '25 Days Left',
    originalPrice: '₹1,250 / pack',
    offerPrice: 'Effective ₹1,040 / pack'
  },
  {
    id: 'off-7',
    title: 'Rich Saffron Permanent Cream Color Bundle',
    supplier: 'Aura Beauty India',
    isVerified: true,
    category: 'Hair Color',
    offerType: 'Wholesale Offers',
    discountText: 'Buy 100 Tubes Get 20 Free',
    moq: '100 Units',
    description: 'Professional high-pigmentation hair color cream with active herbal extracts for radiant gray coverage.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600',
    validUntil: '15 Days Left',
    originalPrice: '₹35,000 / pack',
    offerPrice: '₹28,000 / pack'
  },
  {
    id: 'off-8',
    title: 'Luxe HD Matte Foundation Pro Pack',
    supplier: 'Royal Glamour India Supplies',
    isVerified: true,
    category: 'Makeup',
    offerType: 'New Product Offers',
    discountText: '25% Launch Discount',
    moq: '30 Units',
    description: 'Long-wear, high-definition foundations optimized for professional bridal makeup and photography studios.',
    image: 'https://images.unsplash.com/photo-1522335934-FE017a119951?auto=format&fit=crop&q=80&w=600',
    isNew: true,
    validUntil: '30 Days Left',
    originalPrice: '₹2,500 / unit',
    offerPrice: '₹1,875 / unit'
  },
  {
    id: 'off-9',
    title: 'Premium Gel Polish & UV Curing Lamp Starter Set',
    supplier: 'South India Salon Depot',
    isVerified: false,
    category: 'Nails',
    offerType: 'Seasonal Offers',
    discountText: 'Flat 15% Off Bulk',
    moq: '15 Sets',
    description: 'Professional salon-grade quick-dry soak-off gel polishes complete with dual light wavelength UV/LED curing lamp.',
    image: 'https://images.unsplash.com/photo-1604654894610-df4906b147c0?auto=format&fit=crop&q=80&w=600',
    validUntil: '10 Days Left',
    originalPrice: '₹12,000 / set',
    offerPrice: '₹10,200 / set'
  },
  {
    id: 'off-10',
    title: 'Pure Himalayan Herbal Spa Facial Kit',
    supplier: 'Kavya Ayurvedic Botanicals',
    isVerified: true,
    category: 'Spa',
    offerType: 'Wholesale Offers',
    discountText: '30% Off on 10+ Kits',
    moq: '10 Kits',
    description: 'Holistic 5-step spa treatment facial kits containing neem, organic turmeric, and active sandalwood oils.',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=600',
    validUntil: '22 Days Left',
    originalPrice: '₹8,500 / kit',
    offerPrice: '₹5,950 / kit'
  },
  {
    id: 'off-11',
    title: 'Therapeutic Aromatherapy Massage Oil Blend',
    supplier: 'Jaipur Luxury Beauty Hub',
    isVerified: true,
    category: 'Massage',
    offerType: 'Bulk Discounts',
    discountText: 'Free Shipping + 20% Off',
    moq: '20 Liters',
    description: 'Luxury backbar aromatherapy massage oil formulated with cold-pressed sweet almond, lavender, and eucalyptus oils.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600',
    validUntil: '14 Days Left',
    originalPrice: '₹4,500 / liter',
    offerPrice: '₹3,600 / liter'
  },
  {
    id: 'off-12',
    title: 'Professional Shader Needle Cartridges Pack',
    supplier: 'Vertex Salon Technologies',
    isVerified: true,
    category: 'Tattoo Studio',
    offerType: 'Seasonal Offers',
    discountText: 'Buy 5 Boxes Get 1 Free',
    moq: '5 Boxes',
    description: 'Disposable membrane safety tattoo cartridges with ultra-precise point round liners and soft edge magnums.',
    image: 'https://images.unsplash.com/photo-1598252577556-a17846c7d61b?auto=format&fit=crop&q=80&w=600',
    validUntil: '7 Days Left',
    originalPrice: '₹3,200 / box',
    offerPrice: '₹2,666 / box'
  },
  {
    id: 'off-13',
    title: 'Ergonomic Hydraulic Styling Backbar Chair',
    supplier: 'Vertex Salon Technologies',
    isVerified: true,
    category: 'Salon Furniture',
    offerType: 'Bulk Discounts',
    discountText: 'Save ₹8,000 per Chair',
    moq: '4 Units',
    description: 'Heavy duty luxury styling chair with high-density memory foam, polished chrome circular base, and premium eco-leather upholstery.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600',
    validUntil: '20 Days Left',
    originalPrice: '₹28,000 / unit',
    offerPrice: '₹20,000 / unit'
  }
];

interface OffersViewProps {
  onAddToQuote?: (product: Product, quantity: number) => void;
  onOpenRegister?: () => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  onAddToQuote,
  onOpenRegister
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Any Category');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<string>('All Offers');
  
  // Left Sidebar Category Checkboxes
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const [validityFilter, setValidityFilter] = useState<string>('all');
  const [moqFilter, setMoqFilter] = useState<string>('all');

  // Load More Simulation
  const [displayCount, setDisplayCount] = useState<number>(6);
  const [offersList, setOffersList] = useState<OfferItem[]>(INITIAL_OFFERS);

  // Selected Offer Modal
  const [selectedOfferModal, setSelectedOfferModal] = useState<OfferItem | null>(null);
  const [claimQuantity, setClaimQuantity] = useState<number>(25);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleCategoryFilter = (cat: string) => {
    setSelectedCategoryFilters(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Any Category');
    setLocationQuery('');
    setActiveTabFilter('All Offers');
    setSelectedCategoryFilters([]);
    setValidityFilter('all');
    setMoqFilter('all');
    showToast('Filters reset to default view');
  };

  // Filter Logic
  const filteredOffers = offersList.filter(item => {
    // Top bar search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = item.title.toLowerCase().includes(q) || 
                    item.supplier.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Top bar category dropdown
    if (selectedCategory !== 'Any Category') {
      if (item.category !== selectedCategory) return false;
    }

    // Chip filter
    if (activeTabFilter !== 'All Offers') {
      if (item.offerType !== activeTabFilter) return false;
    }

    // Left Sidebar category checkboxes
    if (selectedCategoryFilters.length > 0) {
      if (!selectedCategoryFilters.includes(item.category)) return false;
    }

    // Left Sidebar MOQ filter
    if (moqFilter === 'small') {
      const num = parseInt(item.moq);
      if (isNaN(num) || num > 15) return false;
    } else if (moqFilter === 'medium') {
      const num = parseInt(item.moq);
      if (isNaN(num) || num < 16 || num > 40) return false;
    } else if (moqFilter === 'large') {
      const num = parseInt(item.moq);
      if (isNaN(num) || num < 41) return false;
    }

    return true;
  });

  const featuredOffer = INITIAL_OFFERS.find(o => o.isFeatured) || INITIAL_OFFERS[0];
  const gridOffers = filteredOffers.filter(o => !o.isFeatured).slice(0, displayCount);

  const handleLoadMore = () => {
    if (displayCount < filteredOffers.length) {
      setDisplayCount(prev => prev + 3);
    } else {
      // Append additional mock items
      const newItems: OfferItem[] = [
        {
          id: `off-more-${Date.now()}-1`,
          title: 'Hydra-Repair Intensive Night Treatment Batch',
          supplier: 'Aura Beauty India',
          isVerified: true,
          category: 'Skincare',
          offerType: 'Wholesale Offers',
          discountText: '35% Off Bulk',
          moq: '30 Units',
          description: 'Cellular recovery night cream formatted for medical spas and luxury estheticians.',
          image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=600',
          validUntil: '15 Days Left',
          originalPrice: '₹14,000 / unit',
          offerPrice: '₹9,115 / unit'
        },
        {
          id: `off-more-${Date.now()}-2`,
          title: 'Titanium Ergonomic Shears Set Deal',
          supplier: 'South India Salon Depot',
          isVerified: true,
          category: 'Equipment',
          offerType: 'Bulk Discounts',
          discountText: 'Save ₹10,000 / Pack',
          moq: '5 Sets',
          description: 'Handcrafted Japanese stainless steel convex shears with gold ergonomic finger grips.',
          image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
          validUntil: '3 Days Left',
          originalPrice: '₹27,000 / set',
          offerPrice: '₹17,000 / set'
        }
      ];
      setOffersList(prev => [...prev, ...newItems]);
      setDisplayCount(prev => prev + 2);
      showToast('Loaded additional exclusive distributor deals!');
    }
  };

  const handleClaimDeal = (offer: OfferItem) => {
    if (onAddToQuote) {
      let mappedCategory: any = 'skincare';
      const offerCatLower = offer.category.toLowerCase();
      if (offerCatLower === 'haircare') mappedCategory = 'haircare';
      else if (offerCatLower === 'equipment') mappedCategory = 'tools';
      else if (offerCatLower === 'cosmetics') mappedCategory = 'makeup';
      else if (offerCatLower === 'fragrance') mappedCategory = 'skincare';

      const mockProduct: Product = {
        id: offer.id,
        name: offer.title,
        brand: offer.supplier,
        category: mappedCategory,
        categoryLabel: offer.category,
        tag: offer.isNew ? 'New' : 'Offer',
        isVerified: offer.isVerified,
        isWholesale: true,
        price: parseFloat((offer.offerPrice || '₹10000').replace(/[^0-9.]/g, '')) || 10000,
        unit: 'unit',
        moq: parseInt(offer.moq) || 10,
        stockStatus: 'In Stock',
        image: offer.image,
        description: offer.description,
        specifications: {},
        leadTimeDays: 3,
        certifications: ['GMP Certified', 'ISO 22716'],
        supplierId: 'sup-1',
        supplierName: offer.supplier,
        supplierLocation: 'Maharashtra',
        rating: 4.9,
        reviewsCount: 38,
        wholesaleTiers: [
          { minUnits: parseInt(offer.moq) || 10, pricePerUnit: parseFloat((offer.offerPrice || '₹10000').replace(/[^0-9.]/g, '')) || 10000 }
        ]
      };
      onAddToQuote(mockProduct, claimQuantity);
      showToast(`Added ${claimQuantity} units of "${offer.title}" to Wholesale Quote Cart!`);
    } else {
      showToast(`Claim request sent to ${offer.supplier}! A B2B rep will contact your business.`);
    }
    setSelectedOfferModal(null);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F8] text-[#1C1B1B] font-sans pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-[#1C1B1B] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header & Search */}
      <header className="w-full bg-[#F7F2F2] border-b border-[#E8E8E8] pt-10 pb-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1C1B1B] mb-2 font-serif">
              Beauty Offers & Wholesale Deals
            </h1>
            <p className="text-[#594047] text-sm sm:text-base font-medium">
              Discover exclusive bulk discounts, seasonal promotions, and introductory rates from premium beauty distributors worldwide.
            </p>
          </div>

          {/* Multi-input Search Bar */}
          <div className="mt-4 bg-white border border-[#E8E8E8] rounded-2xl p-2.5 flex flex-col md:flex-row gap-2 shadow-sm">
            {/* Search Query */}
            <div className="flex-1 flex items-center px-3 py-1 border-b md:border-b-0 md:border-r border-[#E8E8E8]">
              <Search className="w-5 h-5 text-[#8C7077] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offers, products, brands..."
                className="w-full bg-transparent border-none focus:outline-none text-sm text-[#1C1B1B] placeholder-[#8C7077] py-2"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Selector */}
            <div className="flex-1 flex items-center px-3 py-1 border-b md:border-b-0 md:border-r border-[#E8E8E8] relative">
              <Layers className="w-5 h-5 text-[#8C7077] mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-sm font-medium text-[#594047] py-2 appearance-none cursor-pointer pr-6"
              >
                <option value="Any Category">Any Category</option>
                <option value="Skincare">Skincare</option>
                <option value="Haircare">Haircare</option>
                <option value="Hair Color">Hair Color</option>
                <option value="Makeup">Makeup</option>
                <option value="Nails">Nails</option>
                <option value="Spa">Spa</option>
                <option value="Massage">Massage</option>
                <option value="Tattoo Studio">Tattoo Studio</option>
                <option value="Salon Furniture">Salon Furniture</option>
                <option value="Salon Tools & Eq.">Salon Tools & Eq.</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#8C7077] absolute right-3 pointer-events-none" />
            </div>

            {/* Location Input */}
            <div className="flex-1 flex items-center px-3 py-1">
              <MapPin className="w-5 h-5 text-[#8C7077] mr-2 shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City or Region (e.g., Mumbai, Jaipur)"
                className="w-full bg-transparent border-none focus:outline-none text-sm text-[#1C1B1B] placeholder-[#8C7077] py-2"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={() => showToast(`Filtered ${filteredOffers.length} beauty deals`)}
              className="bg-[#B90064] hover:bg-[#8E004B] text-white text-sm font-bold py-3 px-8 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 shrink-0"
            >
              Find Deals
            </button>
          </div>
        </div>
      </header>

      {/* Filter Chips Section */}
      <section className="w-full border-b border-[#E8E8E8] bg-[#FDF8F8] px-4 sm:px-8 py-3 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 min-w-max">
          {[
            'All Offers',
            'Wholesale Offers',
            'Bulk Discounts',
            'Seasonal Offers',
            'New Product Offers'
          ].map((chip) => {
            const isActive = activeTabFilter === chip;
            return (
              <button
                key={chip}
                onClick={() => setActiveTabFilter(chip)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#B90064] text-white shadow-sm'
                    : 'bg-white border border-[#E8E8E8] text-[#594047] hover:border-[#B90064] hover:text-[#B90064]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2-Column Layout Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar (Filters) */}
        <aside className="w-full lg:w-1/4 flex flex-col gap-6 bg-[#F7F2F2] p-5 rounded-2xl h-fit border border-[#E8E8E8]">
          <div className="flex justify-between items-center border-b border-[#E8E8E8] pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#B90064]" />
              <h2 className="text-base font-bold text-[#1C1B1B]">Filters</h2>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-[#8C7077] hover:text-[#B90064] transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Category Filter Checkboxes */}
          <div className="flex flex-col gap-3 border-b border-[#E8E8E8] pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#594047]">
              Category
            </h3>
            <div className="flex flex-col gap-2.5 pl-1 max-h-60 overflow-y-auto pr-1">
              {[
                { name: 'Skincare', count: INITIAL_OFFERS.filter(i => i.category === 'Skincare').length + 18 },
                { name: 'Haircare', count: INITIAL_OFFERS.filter(i => i.category === 'Haircare').length + 12 },
                { name: 'Hair Color', count: INITIAL_OFFERS.filter(i => i.category === 'Hair Color').length + 6 },
                { name: 'Makeup', count: INITIAL_OFFERS.filter(i => i.category === 'Makeup').length + 8 },
                { name: 'Nails', count: INITIAL_OFFERS.filter(i => i.category === 'Nails').length + 10 },
                { name: 'Spa', count: INITIAL_OFFERS.filter(i => i.category === 'Spa').length + 5 },
                { name: 'Massage', count: INITIAL_OFFERS.filter(i => i.category === 'Massage').length + 4 },
                { name: 'Tattoo Studio', count: INITIAL_OFFERS.filter(i => i.category === 'Tattoo Studio').length + 3 },
                { name: 'Salon Furniture', count: INITIAL_OFFERS.filter(i => i.category === 'Salon Furniture').length + 4 },
                { name: 'Salon Tools & Eq.', count: INITIAL_OFFERS.filter(i => i.category === 'Salon Tools & Eq.').length + 14 }
              ].map((cat) => {
                const isChecked = selectedCategoryFilters.includes(cat.name);
                return (
                  <label key={cat.name} className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategoryFilter(cat.name)}
                      className="rounded border-[#8C7077] text-[#B90064] focus:ring-[#B90064] h-4 w-4 bg-white cursor-pointer"
                    />
                    <span className="text-xs font-medium text-[#594047] group-hover:text-[#1C1B1B] transition-colors">
                      {cat.name} ({cat.count})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Offer Validity Filter */}
          <div className="flex flex-col gap-3 border-b border-[#E8E8E8] pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#594047]">
              Offer Validity
            </h3>
            <div className="flex flex-col gap-2 pl-1">
              {[
                { label: 'All Active Promotions', value: 'all' },
                { label: 'Ending This Week', value: 'ending' },
                { label: 'Long-term Stock Rates', value: 'longterm' }
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="validity"
                    checked={validityFilter === item.value}
                    onChange={() => setValidityFilter(item.value)}
                    className="text-[#B90064] focus:ring-[#B90064] h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#594047]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* MOQ Threshold Filter */}
          <div className="flex flex-col gap-3 border-b border-[#E8E8E8] pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#594047]">
              Minimum Order Quantity (MOQ)
            </h3>
            <div className="flex flex-col gap-2 pl-1">
              {[
                { label: 'Any MOQ', value: 'all' },
                { label: 'Low MOQ (≤ 15 Units)', value: 'small' },
                { label: 'Medium MOQ (16 - 40 Units)', value: 'medium' },
                { label: 'Bulk Only (41+ Units)', value: 'large' }
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="moq"
                    checked={moqFilter === item.value}
                    onChange={() => setMoqFilter(item.value)}
                    className="text-[#B90064] focus:ring-[#B90064] h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#594047]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => showToast(`Applied sidebar filters (${filteredOffers.length} matching)`)}
            className="w-full bg-white border border-[#B90064] text-[#B90064] font-bold text-xs py-3 rounded-xl hover:bg-[#FDE7F3] transition-colors"
          >
            Apply Filters
          </button>
        </aside>

        {/* Main Grid Section */}
        <section className="w-full lg:w-3/4 flex flex-col gap-8 bg-[#F7F2F2]/60 p-4 sm:p-6 rounded-2xl border border-[#E8E8E8]">
          {/* Featured Offer Editorial Card */}
          {featuredOffer && (
            <div className="w-full bg-white rounded-2xl border border-[#E8E8E8] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row group">
              <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-gray-100">
                <img
                  src={featuredOffer.image}
                  alt={featuredOffer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#FDE7F3] text-[#B90064] text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Featured Deal
                </div>
              </div>

              <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#B90064]" />
                    <span className="text-xs font-bold text-[#8C7077] uppercase tracking-wider">
                      {featuredOffer.supplier}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-[#1C1B1B] mb-3 group-hover:text-[#B90064] transition-colors">
                    {featuredOffer.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#594047] mb-6 leading-relaxed line-clamp-3">
                    {featuredOffer.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E8E8E8] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-[#8C7077] uppercase tracking-wider">
                      MOQ: {featuredOffer.moq}
                    </p>
                    <p className="text-lg font-extrabold text-[#B90064]">
                      {featuredOffer.discountText}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOfferModal(featuredOffer);
                      setClaimQuantity(parseInt(featuredOffer.moq) || 50);
                    }}
                    className="bg-[#B90064] text-white text-xs font-bold py-2.5 px-6 rounded-xl hover:bg-[#8E004B] transition-colors shadow-sm"
                  >
                    View Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gridOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => {
                  setSelectedOfferModal(offer);
                  setClaimQuantity(parseInt(offer.moq) || 25);
                }}
                className="bg-white rounded-2xl border border-[#E8E8E8] shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group cursor-pointer"
              >
                {/* Image Container */}
                <div className="h-48 w-full relative overflow-hidden bg-gray-100">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1C1B1B] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                    {offer.category}
                  </div>

                  {offer.isNew && (
                    <div className="absolute top-3 right-3 bg-[#FDE7F3] text-[#B90064] text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                      New
                    </div>
                  )}
                </div>

                {/* Details Container */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 text-[#594047]">
                      {offer.isVerified ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0150D6]" />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-[#8C7077]" />
                      )}
                      <span className="text-xs font-semibold">{offer.supplier}</span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1B1B] mb-2 group-hover:text-[#B90064] transition-colors line-clamp-2">
                      {offer.title}
                    </h3>

                    <p className="text-xs text-[#594047] mb-4 line-clamp-2">
                      {offer.description}
                    </p>
                  </div>

                  {/* Footer Metrics */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-[#E8E8E8]">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#8C7077] uppercase">Discount Rate</span>
                        <span className="text-sm font-bold text-[#B90064]">{offer.discountText}</span>
                      </div>

                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-[#8C7077] uppercase">Min Order</span>
                        <span className="text-xs font-bold text-[#1C1B1B]">{offer.moq}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOfferModal(offer);
                        setClaimQuantity(parseInt(offer.moq) || 25);
                      }}
                      className="w-full bg-[#FDF8F8] border border-[#E8E8E8] text-[#1C1B1B] text-xs font-bold py-2 rounded-xl group-hover:border-[#B90064] group-hover:text-[#B90064] transition-colors"
                    >
                      View Offer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {gridOffers.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E8E8E8] text-center">
              <Tag className="w-12 h-12 text-[#8C7077] mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-[#1C1B1B] mb-1">No offers match your criteria</h3>
              <p className="text-xs text-[#594047] mb-4">Try clearing filters or searching for broader terms.</p>
              <button
                onClick={handleClearFilters}
                className="bg-[#B90064] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Load More Offers */}
          <div className="w-full flex justify-center mt-4">
            <button
              onClick={handleLoadMore}
              className="bg-white border border-[#E8E8E8] text-[#594047] text-xs font-bold py-3 px-8 rounded-full hover:bg-[#F7F2F2] hover:border-[#B90064] hover:text-[#B90064] transition-colors shadow-sm"
            >
              Load More Offers
            </button>
          </div>
        </section>
      </div>

      {/* Offer Detail Modal */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-[#E8E8E8]">
            <button
              onClick={() => setSelectedOfferModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#FDE7F3] text-[#B90064] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                {selectedOfferModal.offerType}
              </span>
              <span className="text-xs text-gray-400 font-medium">Valid: {selectedOfferModal.validUntil}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1C1B1B] mb-2">
              {selectedOfferModal.title}
            </h2>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#594047] mb-4">
              <ShieldCheck className="w-4 h-4 text-[#0150D6]" />
              <span>Offered by {selectedOfferModal.supplier}</span>
              <span className="text-gray-300">•</span>
              <span>Category: {selectedOfferModal.category}</span>
            </div>

            <div className="h-56 w-full rounded-2xl overflow-hidden mb-6 bg-gray-100">
              <img
                src={selectedOfferModal.image}
                alt={selectedOfferModal.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F7F2F2] rounded-2xl mb-6 border border-[#E8E8E8]">
              <div>
                <p className="text-[10px] font-bold text-[#8C7077] uppercase">Discount</p>
                <p className="text-sm font-extrabold text-[#B90064]">{selectedOfferModal.discountText}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8C7077] uppercase">Min Order (MOQ)</p>
                <p className="text-sm font-extrabold text-[#1C1B1B]">{selectedOfferModal.moq}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#8C7077] uppercase">Est. Unit Price</p>
                <p className="text-sm font-extrabold text-[#0150D6]">{selectedOfferModal.offerPrice || '₹10,500 / unit'}</p>
              </div>
            </div>

            <p className="text-sm text-[#594047] leading-relaxed mb-6">
              {selectedOfferModal.description} Full wholesale batch testing certification and compliance reports available upon quote request.
            </p>

            <div className="mb-6 p-4 rounded-2xl bg-[#FFF0F5] border border-[#FFD1E3] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#B90064]">Select Claim Quantity:</span>
                <p className="text-[11px] text-[#594047]">Must meet or exceed minimum order quantity ({selectedOfferModal.moq})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setClaimQuantity(prev => Math.max(parseInt(selectedOfferModal.moq) || 5, prev - 5))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#FFD1E3] font-bold text-sm text-[#B90064] flex items-center justify-center hover:bg-[#FDE7F3]"
                >
                  -
                </button>
                <span className="text-sm font-extrabold text-[#1C1B1B] min-w-[32px] text-center">
                  {claimQuantity}
                </span>
                <button
                  onClick={() => setClaimQuantity(prev => prev + 5)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#FFD1E3] font-bold text-sm text-[#B90064] flex items-center justify-center hover:bg-[#FDE7F3]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleClaimDeal(selectedOfferModal)}
                className="flex-1 bg-[#B90064] hover:bg-[#8E004B] text-white font-bold text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Add to Wholesale Quote List</span>
              </button>

              <button
                onClick={() => {
                  showToast(`Sample inquiry sent to ${selectedOfferModal.supplier}`);
                  setSelectedOfferModal(null);
                }}
                className="bg-white border border-[#E8E8E8] hover:border-[#B90064] text-[#1C1B1B] hover:text-[#B90064] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Request Sample Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
