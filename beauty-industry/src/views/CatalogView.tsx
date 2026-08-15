import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  SlidersHorizontal, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Grid, 
  List, 
  ShieldCheck, 
  Search, 
  X, 
  Tag, 
  ArrowLeftRight,
  TrendingUp,
  BarChart3,
  Flame,
  Calendar,
  Users,
  Award,
  Zap,
  Plus,
  Upload,
  Camera,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  AlertCircle,
  Trash2,
  Boxes,
  Layers,
  Smartphone,
  Monitor,
  Share2,
  RotateCcw,
  Eye,
  Edit2,
  Archive,
  MoreVertical,
  Package,
  EyeOff,
  Globe,
  Store,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { Product, CategoryId, SupplierPartner } from '../types';
import { CATEGORIES } from '../data/mockData';
import { StarRating } from '../components/StarRating';

// Trending Data for Premium Buyers (Category Query Analytics)
const TRENDING_CATEGORY_METRICS = {
  '30d': [
    { name: 'Skincare', categoryId: 'skincare', queries: 4850, growth: 34.2, salons: 420, avgOrder: 1950, color: '#B8005A' },
    { name: 'Haircare', categoryId: 'haircare', queries: 3920, growth: 28.5, salons: 380, avgOrder: 1650, color: '#D91B73' },
    { name: 'Salon Tools', categoryId: 'tools', queries: 2840, growth: 42.1, salons: 290, avgOrder: 2400, color: '#931248' },
    { name: 'Hair Color', categoryId: 'haircolor', queries: 2150, growth: 18.4, salons: 240, avgOrder: 1400, color: '#C026D3' },
    { name: 'Spa & Wellness', categoryId: 'spa', queries: 1890, growth: 22.0, salons: 185, avgOrder: 2800, color: '#8B5CF6' },
    { name: 'Cosmetics', categoryId: 'makeup', queries: 1420, growth: 15.8, salons: 160, avgOrder: 1200, color: '#EC4899' },
    { name: 'Nail Care', categoryId: 'nails', queries: 1180, growth: 19.3, salons: 130, avgOrder: 950, color: '#F43F5E' },
  ],
  '7d': [
    { name: 'Skincare', categoryId: 'skincare', queries: 1240, growth: 38.0, salons: 190, avgOrder: 1920, color: '#B8005A' },
    { name: 'Haircare', categoryId: 'haircare', queries: 980, growth: 24.1, salons: 160, avgOrder: 1680, color: '#D91B73' },
    { name: 'Salon Tools', categoryId: 'tools', queries: 790, growth: 46.5, salons: 140, avgOrder: 2450, color: '#931248' },
    { name: 'Hair Color', categoryId: 'haircolor', queries: 540, growth: 16.2, salons: 110, avgOrder: 1380, color: '#C026D3' },
    { name: 'Spa & Wellness', categoryId: 'spa', queries: 480, growth: 20.8, salons: 95, avgOrder: 2820, color: '#8B5CF6' },
    { name: 'Cosmetics', categoryId: 'makeup', queries: 360, growth: 14.1, salons: 75, avgOrder: 1180, color: '#EC4899' },
    { name: 'Nail Care', categoryId: 'nails', queries: 310, growth: 18.0, salons: 65, avgOrder: 940, color: '#F43F5E' },
  ],
  '90d': [
    { name: 'Skincare', categoryId: 'skincare', queries: 13900, growth: 31.4, salons: 890, avgOrder: 1980, color: '#B8005A' },
    { name: 'Haircare', categoryId: 'haircare', queries: 11200, growth: 26.8, salons: 780, avgOrder: 1620, color: '#D91B73' },
    { name: 'Salon Tools', categoryId: 'tools', queries: 8100, growth: 39.8, salons: 620, avgOrder: 2380, color: '#931248' },
    { name: 'Hair Color', categoryId: 'haircolor', queries: 6300, growth: 17.9, salons: 510, avgOrder: 1410, color: '#C026D3' },
    { name: 'Spa & Wellness', categoryId: 'spa', queries: 5400, growth: 21.2, salons: 420, avgOrder: 2790, color: '#8B5CF6' },
    { name: 'Cosmetics', categoryId: 'makeup', queries: 4100, growth: 14.9, salons: 340, avgOrder: 1220, color: '#EC4899' },
    { name: 'Nail Care', categoryId: 'nails', queries: 3300, growth: 17.5, salons: 290, avgOrder: 960, color: '#F43F5E' },
  ],
};

const PRESET_HIGHLIGHT_CATEGORIES = [
  {
    category: "Usage",
    presets: ["Professional Grade", "Salon Use", "Daily Care"]
  },
  {
    category: "Ingredients & Formula",
    presets: ["Paraben Free", "Sulfate Free", "Organic", "Ammonia Free", "Dermatologically Tested"]
  },
  {
    category: "Certifications",
    presets: ["Vegan", "Cruelty Free", "FDA Approved"]
  },
  {
    category: "Results / Benefits",
    presets: ["Long Lasting", "Instant Shine", "Deep Hydration", "Anti-Frizz"]
  }
];

// Product Discovery Catalog view
interface CatalogViewProps {
  products: Product[];
  partners: SupplierPartner[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdatePartners: (partners: SupplierPartner[]) => void;
  onSelectPartner: (partner: SupplierPartner) => void;
  selectedCategory: CategoryId | 'all';
  searchQuery: string;
  compareProductIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onOpenCompareModal?: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (cat: CategoryId | 'all') => void;
  currentUser?: any;
  onOpenOnboarding?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  partners,
  onUpdateProducts,
  onUpdatePartners,
  onSelectPartner,
  selectedCategory,
  searchQuery: initialSearchQuery,
  compareProductIds = [],
  onToggleCompare,
  onOpenCompareModal,
  onSelectProduct,
  onSelectCategory,
  currentUser,
  onOpenOnboarding
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>(selectedCategory);
  const [localSearch, setLocalSearch] = useState(initialSearchQuery || '');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'moq'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Phase 8: Product Management States
  const [catalogTab, setCatalogTab] = useState<'discovery' | 'manage'>('discovery');
  const [managementFilter, setManagementFilter] = useState<'all' | 'published' | 'draft' | 'archived' | 'in-stock' | 'out-of-stock' | 'on-request'>('all');
  const [managementSearch, setManagementSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [archiveConfirmProduct, setArchiveConfirmProduct] = useState<Product | null>(null);
  
  // Trending Analytics Chart States
  const [chartTimeframe, setChartTimeframe] = useState<'30d' | '7d' | '90d'>('30d');
  const [chartMetric, setChartMetric] = useState<'queries' | 'growth'>('queries');

  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Skincare',
    price: '',
    moq: '',
    imageUrl: ''
  });

  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Phase 2 Product Basic Information states
  const [brand, setBrand] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [subcategory, setSubcategory] = useState('');
  const [productType, setProductType] = useState('Professional Use');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<{ name: string; size: string; unit: string }[]>([]);
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [customHighlight, setCustomHighlight] = useState('');

  // Phase 4 Pricing & MOQ states
  const [mrp, setMrp] = useState('');
  const [priceType, setPriceType] = useState<'Fixed Price' | 'Starting From' | 'Price on Request'>('Fixed Price');
  const [moqUnit, setMoqUnit] = useState('Piece');
  const [moqNotes, setMoqNotes] = useState('');
  const [bulkDiscountToggle, setBulkDiscountToggle] = useState(false);
  const [showPricePublicly, setShowPricePublicly] = useState(true);
  const [variantPricing, setVariantPricing] = useState<Record<number, { price: string; moq: string; active: boolean }>>({});

  // Phase 5 Stock Status & Product Availability states
  const [availabilityStatus, setAvailabilityStatus] = useState<'In Stock' | 'Out of Stock' | 'Available on Request'>('In Stock');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [variantAvailability, setVariantAvailability] = useState<Record<number, 'In Stock' | 'Out of Stock' | 'Available on Request'>>({});

  // Phase 6 Product Review states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [newlyCreatedProduct, setNewlyCreatedProduct] = useState<Product | null>(null);

  // Auto-set subcategory when category changes
  useEffect(() => {
    const defaultSubs: Record<string, string[]> = {
      'Skincare': ['Serums & Ampoules', 'Cleansers', 'Moisturizers', 'Sun Protection', 'Chemical Peels', 'Facial Kits'],
      'Haircare': ['Shampoo', 'Conditioner', 'Hair Treatment', 'Hair Mask', 'Hair Serum'],
      'Hair Color': ['Permanent Hair Color', 'Demi-Permanent', 'Bleach & Lightener', 'Color Developers'],
      'Makeup': ['Primers', 'Foundations & Concealers', 'Setting Sprays & Powders', 'Eye Makeup', 'Lip Products'],
      'Nails': ['Gel Polishes', 'Acrylic Systems', 'Nail Art Accessories', 'Nail Primers & Dehydrators', 'Nail Tools'],
      'Spa & Massage': ['Massage Oils & Lotions', 'Essential Oils', 'Body Scrubs', 'Detox Wraps', 'Steam & Sauna Supplies'],
      'Tattoo Studio': ['Tattoo Inks', 'Needles & Cartridges', 'Tattoo Machines', 'Aftercare Creams', 'Stencil Transfer Solutions'],
      'Salon Furniture': ['Styling Chairs', 'Shampoo Stations', 'Massage Tables', 'Manicure Tables', 'Reception Desks'],
      'Salon Tools & Equipment': ['Hair Dryers', 'Straighteners & Curlers', 'Clippers & Trimmers', 'Sterilizers', 'Facial Steamers'],
      'Professional Beauty Products': ['Professional Kits', 'Wholesale Bundles', 'Cabin-use Refills', 'Disposables']
    };
    const subs = defaultSubs[newProduct.category] || [];
    if (subs.length > 0 && !subs.includes(subcategory)) {
      setSubcategory(subs[0]);
    }
  }, [newProduct.category]);

  const resetAddProductForm = () => {
    setModalStep(1);
    setEditingProduct(null);
    setBrand('');
    setSearchBrand('');
    setBrandDropdownOpen(false);
    setSubcategory('Serums & Ampoules');
    setProductType('Professional Use');
    setHasVariants(false);
    setVariants([]);
    setDescription('');
    setHighlights([]);
    setCustomHighlight('');
    setMrp('');
    setPriceType('Fixed Price');
    setMoqUnit('Piece');
    setMoqNotes('');
    setBulkDiscountToggle(false);
    setShowPricePublicly(true);
    setVariantPricing({});
    setAvailabilityStatus('In Stock');
    setAvailabilityNote('');
    setVariantAvailability({});
    setPublishSuccess(false);
    setNewlyCreatedProduct(null);
    setPreviewDevice('desktop');
    setNewProduct({
      name: '',
      sku: '',
      category: 'Skincare',
      price: '',
      moq: '',
      imageUrl: ''
    });
  };

  useEffect(() => {
    if (isAddProductOpen) {
      resetAddProductForm();
      setActionNotice(null);
    }
  }, [isAddProductOpen]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a photo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const hdDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setNewProduct({ ...newProduct, imageUrl: hdDataUrl });
          setActionNotice('Photo auto-resized, converted to HD, and fitted into frame!');
          setTimeout(() => setActionNotice(null), 4000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddProductSubmit = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    // Phase 7.1: Validation
    if (!isDraft) {
      if (!newProduct.name || !brand || !newProduct.category || !newProduct.imageUrl || (!newProduct.price && priceType !== 'Price on Request') || !newProduct.moq) {
        let missingSection = '';
        if (!newProduct.name || !brand || !newProduct.category) missingSection = 'Phase 2: Product Info';
        else if (!newProduct.imageUrl) missingSection = 'Phase 3: Media';
        else if (!newProduct.price && priceType !== 'Price on Request') missingSection = 'Phase 4: Pricing';
        else if (!newProduct.moq) missingSection = 'Phase 4: MOQ';

        setActionNotice(`Incomplete Section: ${missingSection}. Please fill all required fields before publishing.`);
        setTimeout(() => setActionNotice(null), 5000);
        return;
      }
    }

    const categoryMapping: Record<string, { id: CategoryId; label: string }> = {
      'Skincare': { id: 'skincare', label: 'Skincare' },
      'Haircare': { id: 'haircare', label: 'Haircare' },
      'Hair Color': { id: 'haircolor', label: 'Hair Color' },
      'Makeup': { id: 'makeup', label: 'Makeup' },
      'Nails': { id: 'nails', label: 'Nails' },
      'Spa & Massage': { id: 'spa', label: 'Spa & Massage' },
      'Tattoo Studio': { id: 'tattoo', label: 'Tattoo Studio' },
      'Salon Furniture': { id: 'furniture', label: 'Salon Furniture' },
      'Salon Tools & Equipment': { id: 'tools', label: 'Salon Tools & Equipment' },
      'Professional Beauty Products': { id: 'skincare', label: 'Professional Beauty' }
    };

    const catInfo = categoryMapping[newProduct.category] || { id: 'skincare', label: 'Skincare' };

    const created: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name: newProduct.name || 'Untitled Draft',
      brand: brand || currentUser?.companyName || 'Nexora Verified',
      category: catInfo.id,
      categoryLabel: catInfo.label,
      tag: highlights.length > 0 ? highlights[0] : (productType || 'Professional Use'),
      isVerified: currentUser?.isVerified ?? true,
      isWholesale: true,
      price: parseFloat(newProduct.price) || 0,
      unit: moqUnit || 'Units',
      moq: parseInt(newProduct.moq, 10) || 1,
      stockStatus: isDraft ? 'Draft' as any : availabilityStatus,
      status: isDraft ? 'Draft' : 'Published',
      image: newProduct.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=300',
      description: description || 'Verified professional salon-grade premium formulation.',
      specifications: { 
        'SKU': newProduct.sku || 'N/A', 
        'Grade': 'Professional B2B',
        'Subcategory': subcategory || 'N/A',
        'Product Type': productType || 'N/A',
        'Variants': variants.length > 0 ? variants.map(v => `${v.name} (${v.size}${v.unit})`).join(', ') : 'Standard size',
        'MRP': mrp ? `₹${parseFloat(mrp).toLocaleString('en-IN')}` : 'N/A',
        'Price Type': priceType,
        'MOQ Unit': moqUnit,
        'MOQ Notes': moqNotes || 'Standard MOQ terms apply.',
        'Bulk Discount Available': bulkDiscountToggle ? 'Yes' : 'No',
        'Show Price Publicly': showPricePublicly ? 'Yes' : 'No',
        'Variant Pricing': Object.keys(variantPricing).length > 0 ? JSON.stringify(variantPricing) : 'N/A',
        'Availability Note': availabilityNote || 'Ready for immediate enquiry.',
        'Variant Availability': Object.keys(variantAvailability).length > 0 ? JSON.stringify(variantAvailability) : 'N/A'
      },
      leadTimeDays: 3,
      certifications: ['GMP Certified', 'FDA Approved'],
      supplierId: currentUser?.id || 'aura-beauty',
      supplierName: currentUser?.companyName || 'Aura Beauty India',
      supplierLocation: currentUser?.city || 'Mumbai',
      rating: 5.0,
      reviewsCount: 1
    };

    // Phase 7.2: Business Profile Connection & Product Count Update
    if (!isDraft && !editingProduct) {
      const supplierId = currentUser?.id || 'aura-beauty';
      const updatedPartners = partners.map(p => {
        if (p.id === supplierId) {
          return {
            ...p,
            stats: {
              ...p.stats,
              listings: (p.stats?.listings || 0) + 1
            }
          };
        }
        return p;
      });
      onUpdatePartners(updatedPartners);
    }

    // Phase 7.5: Discovery Connection
    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === created.id ? created : p));
    } else {
      onUpdateProducts([created, ...products]);
    }
    
    setNewlyCreatedProduct(created);
    setPublishSuccess(true);
    
    // Clear editing state
    setEditingProduct(null);

    setActionNotice(isDraft ? '✅ Draft saved successfully!' : '✅ Product successfully published to Nexora Discovery!');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    
    // Populate form states from product
    setNewProduct({
      name: product.name,
      sku: product.specifications['SKU'] || '',
      category: product.categoryLabel || 'Skincare',
      price: product.price.toString(),
      moq: product.moq.toString(),
      imageUrl: product.image
    });

    setBrand(product.brand);
    setSubcategory(product.specifications['Subcategory'] || '');
    setProductType(product.specifications['Product Type'] || 'Professional Use');
    
    // Variants
    const variantStr = product.specifications['Variants'];
    if (variantStr && variantStr !== 'Standard size') {
      setHasVariants(true);
      const vArray = variantStr.split(', ').map(v => {
        const match = v.match(/(.+) \((.+)(.+)\)/);
        if (match) return { name: match[1], size: match[2], unit: match[3] };
        return { name: v, size: '', unit: '' };
      });
      setVariants(vArray);
    } else {
      setHasVariants(false);
      setVariants([]);
    }

    setDescription(product.description);
    
    // Highlights
    setHighlights([]); // Logic to extract from tag or description if needed
    
    // Pricing
    setMrp(product.specifications['MRP']?.replace(/[^0-9.]/g, '') || '');
    setPriceType(product.specifications['Price Type'] as any || 'Fixed Price');
    setMoqUnit(product.specifications['MOQ Unit'] || 'Piece');
    setMoqNotes(product.specifications['MOQ Notes'] || '');
    setBulkDiscountToggle(product.specifications['Bulk Discount Available'] === 'Yes');
    setShowPricePublicly(product.specifications['Show Price Publicly'] === 'Yes');
    
    // Availability
    setAvailabilityStatus(product.status === 'Draft' ? 'In Stock' : (product.stockStatus as any || 'In Stock'));
    setAvailabilityNote(product.specifications['Availability Note'] || '');

    setModalStep(1);
    setIsAddProductOpen(true);
  };

  const handleArchiveProduct = (product: Product) => {
    const updated = products.map(p => 
      p.id === product.id ? { ...p, status: 'Archived' as const } : p
    );
    onUpdateProducts(updated);
    setArchiveConfirmProduct(null);
    setActionNotice(`Product "${product.name}" has been archived and removed from discovery.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleUpdateAvailability = (product: Product, status: 'In Stock' | 'Out of Stock' | 'Available on Request') => {
    const updated = products.map(p => 
      p.id === product.id ? { ...p, stockStatus: status } : p
    );
    onUpdateProducts(updated);
    setActionNotice(`Updated availability for "${product.name}" to ${status}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteDraft = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    onUpdateProducts(updated);
    setActionNotice('Draft deleted successfully.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setLocalSearch(initialSearchQuery || '');
  }, [initialSearchQuery]);

  const filteredProducts = useMemo(() => {
    return localProducts
      .filter((p) => {
        if (activeCategory !== 'all' && p.category !== activeCategory) return false;
        if (verifiedOnly && !p.isVerified) return false;
        if (wholesaleOnly && !p.isWholesale) return false;
        if (localSearch.trim()) {
          const q = localSearch.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesBrand = p.brand.toLowerCase().includes(q);
          const matchesTag = p.tag.toLowerCase().includes(q);
          const matchesSupplier = p.supplierName.toLowerCase().includes(q);
          if (!matchesName && !matchesBrand && !matchesTag && !matchesSupplier) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'moq') return a.moq - b.moq;
        return 0;
      });
  }, [localProducts, activeCategory, verifiedOnly, wholesaleOnly, localSearch, sortBy]);

  // Phase 8: Management View Filtering
  const myProducts = useMemo(() => {
    return localProducts.filter(p => p.supplierId === (currentUser?.id || 'aura-beauty'));
  }, [localProducts, currentUser]);

  const filteredMyProducts = useMemo(() => {
    return myProducts.filter(p => {
      // Search
      if (managementSearch.trim()) {
        const q = managementSearch.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
      }

      // Filter
      const status = p.status || (p.stockStatus === 'Draft' ? 'Draft' : 'Published');
      if (managementFilter === 'published' && status !== 'Published') return false;
      if (managementFilter === 'draft' && status !== 'Draft') return false;
      if (managementFilter === 'archived' && status !== 'Archived') return false;
      if (managementFilter === 'in-stock' && p.stockStatus !== 'In Stock') return false;
      if (managementFilter === 'out-of-stock' && p.stockStatus !== 'Out of Stock') return false;
      if (managementFilter === 'on-request' && p.stockStatus !== 'Available on Request') return false;

      return true;
    });
  }, [myProducts, managementFilter, managementSearch]);

  const managementStats = useMemo(() => {
    return {
      published: myProducts.filter(p => (p.status || (p.stockStatus === 'Draft' ? 'Draft' : 'Published')) === 'Published').length,
      drafts: myProducts.filter(p => (p.status || (p.stockStatus === 'Draft' ? 'Draft' : 'Published')) === 'Draft').length,
      archived: myProducts.filter(p => (p.status || (p.stockStatus === 'Draft' ? 'Draft' : 'Published')) === 'Archived').length
    };
  }, [myProducts]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#1A1A1A] text-white p-3.5 rounded-2xl border border-[#FFD1E3]/40 shadow-2xl text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
            <span className="font-extrabold text-[#FFD700] text-sm">{item.name}</span>
            <span className="bg-[#B8005A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              +{item.growth}% MoM
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-300">
            <span>Inquiry / RFQ Volume:</span>
            <strong className="text-white font-black">{item.queries.toLocaleString()} RFQs</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-300">
            <span>Active Premium Salons:</span>
            <strong className="text-white font-bold">{item.salons} Salons</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-300">
            <span>Avg Wholesale PO:</span>
            <strong className="text-[#10B981] font-bold">₹{(item.avgOrder * 100).toLocaleString()}</strong>
          </div>
          <div className="text-[10px] text-gray-400 pt-1.5 border-t border-white/10 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-[#B8005A]" />
            <span>Click bar to filter catalog products</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFF5F8] via-[#FFF0F5] to-white border border-[#FFD6E5] rounded-3xl p-6 sm:p-10 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#FFD1E3] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Factory & Distributor Wholesale
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
              {catalogTab === 'discovery' ? 'Product Discovery Catalog' : 'Manage Your Listings'}
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-1.5 max-w-xl">
              {catalogTab === 'discovery' 
                ? 'Source verified luxury salon backbar essentials, aesthetic devices, and retail-ready cosmetics with tiered bulk pricing.'
                : 'Maintain your professional beauty listings, update availability, and track your product discovery performance on Nexora.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle for Suppliers */}
            {currentUser && (
              <div className="flex items-center bg-[#F5F5F5] p-1 rounded-2xl border border-[#EAE5DE] mr-2">
                <button
                  onClick={() => setCatalogTab('discovery')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    catalogTab === 'discovery' ? 'bg-white text-[#B8005A] shadow-sm' : 'text-[#737373] hover:text-[#B8005A]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Discovery</span>
                </button>
                <button
                  onClick={() => setCatalogTab('manage')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    catalogTab === 'manage' ? 'bg-white text-[#B8005A] shadow-sm' : 'text-[#737373] hover:text-[#B8005A]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Manage</span>
                </button>
              </div>
            )}

            <span className="text-xs font-bold text-[#4A4A4A] bg-white border border-[#EAE5DE] px-4 py-2 rounded-xl shadow-2xs">
              {catalogTab === 'discovery' ? (
                <>Showing <strong className="text-[#B8005A]">{filteredProducts.length}</strong> verified items</>
              ) : (
                <div className="flex items-center gap-3">
                  <span><strong className="text-[#B8005A]">{managementStats.published}</strong> Published</span>
                  <span className="w-1 h-1 rounded-full bg-[#EAE5DE]" />
                  <span><strong className="text-amber-600">{managementStats.drafts}</strong> Drafts</span>
                  <span className="w-1 h-1 rounded-full bg-[#EAE5DE]" />
                  <span><strong className="text-gray-500">{managementStats.archived}</strong> Archived</span>
                </div>
              )}
            </span>
            <button
              onClick={() => {
                resetAddProductForm();
                setIsAddProductOpen(true);
              }}
              className="bg-[#B8005A] hover:bg-[#8E004B] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {catalogTab === 'discovery' ? (
        <>
          {/* Strict Category-Only Cards Grid Section */}
      <div className="mb-8 bg-white border border-[#EAE5DE] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E1E1E]">B2B Salon & Clinic Categories</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#B8005A] text-[10px] font-bold">12 Verified Categories</span>
          </div>
          {activeCategory !== 'all' && (
            <button
              onClick={() => {
                setActiveCategory('all');
                onSelectCategory('all');
              }}
              className="text-xs font-bold text-[#B8005A] hover:underline cursor-pointer"
            >
              Reset Filter (Show All)
            </button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-2 scrollbar-thin scrollbar-thumb-rose-900/20 hover:scrollbar-thumb-rose-900/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* All Categories Card */}
            <button
              onClick={() => {
                setActiveCategory('all');
                onSelectCategory('all');
              }}
              className={`relative group rounded-2xl overflow-hidden h-28 p-3 flex flex-col justify-between text-left transition-all cursor-pointer border-2 ${
                activeCategory === 'all'
                  ? 'border-[#B8005A] ring-2 ring-[#B8005A]/20 shadow-md'
                  : 'border-transparent hover:border-[#B8005A]/50 shadow-xs'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E1E1E] to-[#3A3A3A]" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Browse</span>
                <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-white block leading-tight">All Categories</span>
                <span className="text-[10px] text-white/70 mt-0.5 block">Full Inventory</span>
              </div>
            </button>

            {/* 12 Primary Categories */}
            {CATEGORIES.map((cat) => {
              const bgImg = cat.featuredImg || 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800';
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    onSelectCategory(cat.id);
                  }}
                  className={`relative group rounded-2xl overflow-hidden h-28 p-3 flex flex-col justify-between text-left transition-all cursor-pointer border-2 ${
                    isSelected
                      ? 'border-[#FFD700] ring-2 ring-[#FFD700]/30 shadow-md scale-[1.02] bg-black/20'
                      : 'border-transparent hover:border-[#FFD700]/60 shadow-xs'
                  }`}
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${bgImg})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
                      {cat.itemCount || 150}+ items
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#B8005A] animate-ping" />
                    )}
                  </div>

                  <div className="relative z-10">
                    <span className="text-xs font-bold text-white block leading-tight group-hover:text-[#FFD700] transition-colors drop-shadow-xs">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-white/80 mt-0.5 block truncate">
                      {cat.subtext || 'Wholesale Catalog'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter & Sorting Control Bar */}
      <div className="bg-white border border-[#EAE5DE] rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        {/* Quick Search within Catalog */}
        <div className="relative w-full md:w-72 flex items-center bg-[#F9F9FB] border border-[#E8E8EE] focus-within:border-[#B8005A] focus-within:bg-white rounded-xl px-3 py-1.5 transition-all">
          <Search className="w-4 h-4 text-[#8E8E93] mr-2 shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter catalog products..."
            className="w-full bg-transparent text-xs text-[#1A1A1A] placeholder:text-[#8E8E93] font-medium focus:outline-none"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Verified Toggle */}
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              verifiedOnly
                ? 'bg-[#FFF0F5] text-[#B8005A] border-[#FFD1E3]'
                : 'bg-[#FAFAFA] text-[#737373] border-[#EAE5DE]'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
              verifiedOnly ? 'bg-[#B8005A] border-[#B8005A] text-white' : 'border-[#CCCCCC]'
            }`}>
              {verifiedOnly && <Check className="w-2.5 h-2.5" />}
            </div>
            <span>Nexora Verified Only</span>
          </button>

          {/* Wholesale Toggle */}
          <button
            onClick={() => setWholesaleOnly(!wholesaleOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              wholesaleOnly
                ? 'bg-[#FFF0F5] text-[#B8005A] border-[#FFD1E3]'
                : 'bg-[#FAFAFA] text-[#737373] border-[#EAE5DE]'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
              wholesaleOnly ? 'bg-[#B8005A] border-[#B8005A] text-white' : 'border-[#CCCCCC]'
            }`}>
              {wholesaleOnly && <Check className="w-2.5 h-2.5" />}
            </div>
            <span>Wholesale Pricing</span>
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Quick Compare Trigger if items selected */}
          {compareProductIds.length > 0 && onOpenCompareModal && (
            <button
              onClick={onOpenCompareModal}
              className="bg-[#FFF0F5] hover:bg-[#FFE5EE] border border-[#FFD1E3] text-[#B8005A] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer animate-in fade-in"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare ({compareProductIds.length}/3)</span>
            </button>
          )}

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#737373]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8E8E93]" />
            <span className="font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl px-2.5 py-1 text-xs font-medium text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
            >
              <option value="featured">Featured / Trending</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="moq">Lowest MOQ</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#EAE5DE] rounded-xl p-0.5 bg-[#FAFAFA]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-[#B8005A]' : 'text-[#8E8E93]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-[#B8005A]' : 'text-[#8E8E93]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid / List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#EAE5DE] p-8">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F5] text-[#B8005A] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1A1A1A]">No products match your filter criteria</h3>
          <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
            Try resetting your category or search filters to discover more items in the catalog.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setVerifiedOnly(false);
              setWholesaleOnly(false);
            }}
            className="mt-4 bg-[#B8005A] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7'
              : 'space-y-4'
          }
        >
          {filteredProducts.map((product) => {
            const isCompared = compareProductIds.includes(product.id);

            return (
              <motion.div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`bg-white border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 group cursor-pointer ${
                  isCompared 
                    ? 'border-[#B8005A] ring-2 ring-[#B8005A]/20 bg-[#FFFDFE]' 
                    : 'border-[#EAE5DE] hover:border-[#B8005A]/40'
                } ${
                  viewMode === 'list' ? 'flex flex-col sm:flex-row items-center p-4 gap-6' : 'flex flex-col'
                }`}
              >
                {/* Image */}
                <div
                  className={`relative bg-[#F7F5F0] overflow-hidden ${
                    viewMode === 'list'
                      ? 'w-full sm:w-48 aspect-square rounded-2xl shrink-0'
                      : 'w-full aspect-[4/3]'
                  }`}
                >
                  <img
                    src={product.image || undefined}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  {product.stockStatus === 'Out of Stock' && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-3 text-center">
                      <span className="bg-rose-600 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-md border border-rose-500 animate-pulse">
                        Currently Out of Stock
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 z-10">
                    <span className="bg-white/95 backdrop-blur-md text-[#1A1A1A] text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-white/40">
                      {product.tag}
                    </span>
                    {product.isVerified && (
                      <span className="bg-gradient-to-r from-[#B8005A] to-[#931248] text-white text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3" />
                        VERIFIED
                      </span>
                    )}
                  </div>

                  {/* Compare Toggle Pill on Image */}
                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(product);
                      }}
                      className={`absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-md cursor-pointer ${
                        isCompared
                          ? 'bg-[#B8005A] text-white border border-[#B8005A]'
                          : 'bg-white/95 hover:bg-[#FFF0F5] text-[#4A4A4A] hover:text-[#B8005A] border border-white/60 hover:border-[#FFD1E3]'
                      }`}
                      title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                    </button>
                  )}
                </div>

                {/* Info Body */}
                <div className="p-6 flex-1 flex flex-col justify-between w-full">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        {product.brand} • {product.supplierName}
                      </span>
                      {product.isWholesale && (
                        <span className="text-[11px] font-bold text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3] px-2.5 py-0.5 rounded-full">
                          Wholesale B2B
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A] group-hover:text-[#B8005A] transition-colors line-clamp-1">
                      {product.name}
                    </h3>

                    {/* Star Rating */}
                    <div className="mt-2 flex items-center">
                      <StarRating rating={product.rating || 4.9} reviewsCount={product.reviewsCount || 42} size="xs" compact={true} />
                    </div>

                    <p className="text-xs text-[#525252] mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-4 pt-3.5 border-t border-[#F5F2EB] flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        {product.price === 0 || 
                         product.specifications?.['Show Price Publicly'] === 'No' || 
                         product.specifications?.['Price Type'] === 'Price on Request' ? (
                          <span className="text-sm font-extrabold text-[#B8005A] tracking-tight bg-[#FFF0F5] px-2.5 py-1 rounded-lg border border-[#FFD1E3]">
                            Price on Request
                          </span>
                        ) : (
                          <>
                            <span className="text-xl sm:text-2xl font-extrabold text-[#1A1A1A] tracking-tight">
                              {product.specifications?.['Price Type'] === 'Starting From' ? 'Starting ₹' : '₹'}
                              {product.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-[#8E8E93] font-semibold">
                              / {product.specifications?.['MOQ Unit'] || product.unit || 'Unit'}
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-xs font-bold text-[#4A4A4A] bg-[#F5F2EB] border border-[#EAE5DE] px-3 py-1 rounded-lg">
                        MOQ: {product.moq} {product.specifications?.['MOQ Unit'] || 'units'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#F5F2EB] flex items-center justify-between text-xs">
                    <div className="relative flex items-center gap-1.5 font-semibold group/status">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const statuses: ('In Stock' | 'Out of Stock' | 'Available on Request')[] = ['In Stock', 'Out of Stock', 'Available on Request'];
                          const currentStatus = product.stockStatus || 'In Stock';
                          const currentIndex = statuses.indexOf(currentStatus as any);
                          const nextStatus = statuses[currentIndex === -1 ? 0 : (currentIndex + 1) % statuses.length];
                          
                          // Update this product status in local state
                          setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, stockStatus: nextStatus } : p));
                          
                          // Display a sleek action notice
                          setActionNotice(`Updated stock status to "${nextStatus}" for ${product.name}!`);
                          setTimeout(() => setActionNotice(null), 3000);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#FFF0F5] border border-transparent hover:border-[#FFD1E3] transition-all cursor-pointer text-left z-25"
                        title="Click to instantly toggle availability status (Supplier Quick Action)"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.stockStatus === 'In Stock'
                              ? 'bg-[#10B981] animate-pulse'
                              : product.stockStatus === 'Out of Stock'
                              ? 'bg-[#EF4444]'
                              : 'bg-[#F59E0B]'
                          }`}
                        />
                        <span
                          className={
                            product.stockStatus === 'In Stock'
                              ? 'text-[#059669]'
                              : product.stockStatus === 'Out of Stock'
                              ? 'text-[#DC2626]'
                              : 'text-[#D97706]'
                          }
                        >
                          {product.stockStatus || 'In Stock'}
                        </span>
                        <span className="text-[9px] text-[#B8005A] font-semibold opacity-0 group-hover/status:opacity-100 transition-opacity ml-1 bg-[#FFF0F5] px-1.5 py-0.5 rounded border border-[#FFD1E3]">
                          Toggle 🔄
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleCompare) onToggleCompare(product);
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                          isCompared
                            ? 'text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3]'
                            : 'text-[#737373] hover:text-[#B8005A] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{isCompared ? 'In Compare' : '+ Compare'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 font-bold text-[#B8005A] group-hover:translate-x-1 transition-transform">
                        <span>Details & RFQ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  ) : (
    <div className="space-y-6 animate-in fade-in duration-300">
          {/* Management Filters */}
          <div className="bg-white border border-[#EAE5DE] rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'published', 'draft', 'archived'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setManagementFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      managementFilter === filter 
                        ? 'bg-[#B8005A] text-white border-[#B8005A]' 
                        : 'bg-white text-[#737373] border-[#EAE5DE] hover:border-[#B8005A]/40'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
                <div className="w-px h-6 bg-[#EAE5DE] mx-1 hidden md:block" />
                <select
                  value={managementFilter}
                  onChange={(e) => setManagementFilter(e.target.value as any)}
                  className="bg-white border border-[#EAE5DE] rounded-xl px-3 py-2 text-xs font-bold text-[#4A4A4A] focus:outline-none focus:border-[#B8005A]"
                >
                  <option value="all">All Availability</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="on-request">Available on Request</option>
                </select>
              </div>

              <div className="relative flex-1 md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your listings..."
                  value={managementSearch}
                  onChange={(e) => setManagementSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EAE5DE] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#B8005A]"
                />
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          {filteredMyProducts.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#EAE5DE] rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-[#FAF8F5] text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">No listings found</h3>
              <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
                {managementFilter === 'all' 
                  ? "You haven't created any products yet. Click 'Add Product' to get started."
                  : "No products match the selected management filters."}
              </p>
              {managementFilter === 'all' && (
                <button
                  onClick={() => {
                    resetAddProductForm();
                    setIsAddProductOpen(true);
                  }}
                  className="mt-6 bg-[#B8005A] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyProducts.map((product) => {
                const status = product.status || (product.stockStatus === 'Draft' ? 'Draft' : 'Published');
                return (
                  <div key={product.id} className="bg-white border border-[#EAE5DE] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col h-full">
                    {/* Card Header with Status */}
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                          status === 'Published'
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : status === 'Draft'
                            ? 'bg-amber-500 text-white border-amber-400'
                            : 'bg-gray-500 text-white border-gray-400'
                        }`}>
                          {status}
                        </span>
                        {product.isVerified && (
                          <span className="bg-white/95 backdrop-blur-md text-[#B8005A] text-[9px] font-black px-2 py-1 rounded-full shadow-sm border border-[#FFD1E3] flex items-center gap-1 uppercase tracking-wider w-fit">
                            <ShieldCheck className="w-3 h-3" /> Nexora Verified
                          </span>
                        )}
                      </div>
                      
                      {/* Quick Availability Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold shadow-sm border ${
                          product.stockStatus === 'In Stock'
                            ? 'bg-white text-emerald-600 border-emerald-100'
                            : product.stockStatus === 'Out of Stock'
                            ? 'bg-white text-rose-600 border-rose-100'
                            : 'bg-white text-amber-600 border-amber-100'
                        }`}>
                          {product.stockStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">
                            {product.brand} • {product.categoryLabel}
                          </p>
                          <h4 className="text-base font-bold text-[#1A1A1A] line-clamp-1 group-hover:text-[#B8005A] transition-colors">{product.name}</h4>
                        </div>
                        <div className="relative group/actions ml-2">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-[#EAE5DE] rounded-xl shadow-xl w-48 py-1.5 z-20 hidden group-hover/actions:block animate-in fade-in slide-in-from-top-1 duration-150">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-[#4A4A4A] hover:bg-[#FFF0F5] hover:text-[#B8005A] flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Listing
                            </button>
                            <button 
                              onClick={() => onSelectProduct(product)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-[#4A4A4A] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Listing
                            </button>
                            {status === 'Draft' && (
                              <button 
                                onClick={() => handleDeleteDraft(product.id)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                              </button>
                            )}
                            <div className="h-px bg-[#EAE5DE]/60 my-1.5 mx-2" />
                            <div className="px-4 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Stock Status</div>
                            <button 
                              onClick={() => handleUpdateAvailability(product, 'In Stock')}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Mark In Stock
                            </button>
                            <button 
                              onClick={() => handleUpdateAvailability(product, 'Out of Stock')}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Mark Out of Stock
                            </button>
                            {status !== 'Archived' && (
                              <>
                                <div className="h-px bg-[#EAE5DE]/60 my-1.5 mx-2" />
                                <button 
                                  onClick={() => setArchiveConfirmProduct(product)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5" /> Archive Product
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 py-3 border-y border-[#F5F2EB] my-4">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 truncate">Wholesale Price</p>
                          <p className="text-sm font-black text-[#1A1A1A]">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-px h-6 bg-[#EAE5DE]" />
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 truncate">Min Order (MOQ)</p>
                          <p className="text-sm font-black text-[#1A1A1A]">{product.moq} {product.unit}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center gap-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 bg-[#FAF8F5] hover:bg-[#FFF0F5] text-[#594047] hover:text-[#B8005A] border border-[#EAE5DE] hover:border-[#FFD1E3] py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/listing/${product.id}`);
                            setActionNotice('Listing Link Copied!');
                            setTimeout(() => setActionNotice(null), 3000);
                          }}
                          className="p-2.5 bg-white border border-[#EAE5DE] hover:border-[#B8005A] text-[#737373] hover:text-[#B8005A] rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Share Listing"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-[#E8E8E8] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Archive className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-[#1C1B1B] text-center mb-2">Archive Product Listing?</h3>
            <p className="text-gray-500 text-sm text-center mb-8">
              Are you sure you want to archive <span className="font-bold text-[#1C1B1B]">"{archiveConfirmProduct.name}"</span>? 
              Archived products are hidden from Nexora Discovery but remain in your database.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setArchiveConfirmProduct(null)}
                className="w-full py-3.5 bg-[#FAF8F5] text-[#594047] font-bold rounded-2xl border border-[#EAE5DE] hover:bg-[#FDFBF9] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleArchiveProduct(archiveConfirmProduct)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                Archive Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className={`bg-white rounded-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E8E8] my-8 max-h-[90vh] overflow-y-auto transition-all duration-300 ${publishSuccess ? 'max-w-xl' : (modalStep >= 2 ? 'max-w-4xl' : 'max-w-lg')}`}>
            
            {publishSuccess ? (
              /* Phase 7.8: Success State UI */
              <div className="py-8 text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-emerald-50">
                  <Check className="w-10 h-10" />
                </div>
                
                <h2 className="text-2xl font-black text-[#1C1B1B] mb-2">Product Listed Successfully!</h2>
                <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
                  Your product is now connected to <span className="text-[#1C1B1B] font-bold">"{currentUser?.companyName || brand}"</span> business profile and visible to buyers across Nexora Discovery.
                </p>

                <div className="bg-[#FAF8F5] p-5 rounded-3xl border border-[#EAE5DE] mb-8 text-left space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE5DE] flex items-center justify-center">
                      <Store className="w-5 h-5 text-[#B8005A]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Business Connection</p>
                      <p className="text-xs font-bold text-[#1C1B1B]">{currentUser?.companyName || brand}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest">Status</p>
                      <p className="text-xs font-bold text-emerald-600">Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE5DE]/60">
                    <div className="bg-white p-3 rounded-2xl border border-[#EAE5DE]/40">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Listings Count</p>
                      <p className="text-lg font-black text-[#B8005A]">
                        {partners.find(p => p.id === (currentUser?.id || 'aura-beauty'))?.stats?.listings || '1'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[#EAE5DE]/40">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Visibility</p>
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                        <Globe className="w-3.5 h-3.5" /> High Discovery
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (newlyCreatedProduct) onSelectProduct(newlyCreatedProduct);
                      setIsAddProductOpen(false);
                      resetAddProductForm();
                    }}
                    className="w-full py-4 bg-[#B8005A] hover:bg-[#8E004B] text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Product Listing
                  </button>
                  <button 
                    onClick={() => {
                      const supplierId = currentUser?.id || 'aura-beauty';
                      const partner = partners.find(p => p.id === supplierId);
                      if (partner) onSelectPartner(partner);
                      setIsAddProductOpen(false);
                      resetAddProductForm();
                    }}
                    className="w-full py-4 bg-white border-2 border-[#EAE5DE] hover:border-[#B8005A] text-[#1C1B1B] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    View Business Profile
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://nexora.com/listing/${newlyCreatedProduct?.id}`);
                      setActionNotice('Listing Link Copied!');
                      setTimeout(() => setActionNotice(null), 3000);
                    }}
                    className="w-full py-3.5 bg-[#FAF8F5] text-[#594047] font-bold rounded-2xl border border-[#EAE5DE] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Listing
                  </button>
                  <button 
                    onClick={() => resetAddProductForm()}
                    className="w-full py-3.5 bg-emerald-50 text-emerald-700 font-bold rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Another Product
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E8] mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF0F5] text-[#B8005A] flex items-center justify-center font-bold">
                      {modalStep}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1C1B1B]">Add New Product Listing</h3>
                      <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Step {modalStep} of 6</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step Progress Tracker */}
                <div className="flex flex-wrap items-center gap-2 mb-6 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  <span className={modalStep === 1 ? 'text-[#B8005A]' : 'text-emerald-600'}>1. Business</span>
                  <span className="text-gray-300">/</span>
                  <span className={modalStep === 2 ? 'text-[#B8005A]' : modalStep > 2 ? 'text-emerald-600' : ''}>2. Product Info</span>
                  <span className="text-gray-300">/</span>
                  <span className={modalStep === 3 ? 'text-[#B8005A]' : modalStep > 3 ? 'text-emerald-600' : ''}>3. Media Upload</span>
                  <span className="text-gray-300">/</span>
                  <span className={modalStep === 4 ? 'text-[#B8005A]' : modalStep > 4 ? 'text-emerald-600' : ''}>4. Pricing & MOQ</span>
                  <span className="text-gray-300">/</span>
                  <span className={modalStep === 5 ? 'text-[#B8005A]' : modalStep > 5 ? 'text-emerald-600' : ''}>5. Stock & Availability</span>
                  <span className="text-gray-300">/</span>
                  <span className={modalStep === 6 ? 'text-[#B8005A]' : ''}>6. Product Review</span>
                </div>

            {modalStep === 1 && (
              <div className="space-y-5 py-2 animate-in fade-in duration-200 text-xs">
                {/* Heading & Supporting Text */}
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE]">
                  <h4 className="text-sm font-bold text-[#1C1B1B] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#B8005A]" />
                    Business Identity
                  </h4>
                  <p className="text-xs text-[#737373] mt-1">
                    Connect this listing to your verified salon/beauty supply profile on Nexora.
                  </p>
                </div>

                {/* Business Onboarding Check & Warning */}
                {!currentUser?.companyName || currentUser?.companyName === 'Jaipur Luxury Beauty Hub' ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-bold text-amber-800 text-xs">Profile Verification Pending</h5>
                        <p className="text-amber-700 text-[11px] leading-relaxed mt-0.5">
                          You are listing using demo supplier credentials. Complete your official supplier onboarding to publish verified listings and respond to RFQs.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenOnboarding?.()}
                      className="w-full text-center py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-[11px]"
                    >
                      Complete Business Profile
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      <span className="font-bold text-emerald-800 text-[11px]">Supplier Account Verified</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenOnboarding?.()}
                      className="text-[11px] font-bold text-[#B8005A] underline hover:text-[#8E004B] cursor-pointer bg-none border-none"
                    >
                      Update Profile
                    </button>
                  </div>
                )}

                {/* Business Information Section */}
                <div className="space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Business / Brand Name *</label>
                    <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border border-[#B8005A]/30 rounded-xl">
                      <span className="font-semibold text-sm text-[#1C1B1B]">
                        {currentUser?.companyName || 'Jaipur Luxury Beauty Hub'}
                      </span>
                      <span className="text-[10px] bg-[#B8005A]/10 text-[#B8005A] px-2.5 py-1 rounded-full font-bold">
                        Connected
                      </span>
                    </div>
                  </div>

                  {/* Business Type & Contact Person */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#FAFAFA] border border-[#EAE5DE] rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Business Type</span>
                      <span className="text-xs font-bold text-[#1C1B1B]">
                        {currentUser?.role === 'buyer' ? 'Wholesaler / Stockist' : currentUser?.role === 'supplier' ? 'Manufacturer / OEM' : 'Company / Brand Owner'}
                      </span>
                    </div>
                    <div className="bg-[#FAFAFA] border border-[#EAE5DE] rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Contact Person</span>
                      <div className="text-xs">
                        <p className="font-bold text-[#1C1B1B]">{currentUser?.name || 'Ananya Sharma'}</p>
                        <p className="text-[10px] text-[#737373] font-medium">Wholesale Representative</p>
                      </div>
                    </div>
                  </div>

                  {/* Business Location */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Business Location</label>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1B1B] bg-[#FAFAFA] p-3.5 border border-[#EAE5DE] rounded-xl">
                      <MapPin className="w-4 h-4 text-[#B8005A]" />
                      <span>{currentUser?.city ? `${currentUser.city}, Rajasthan, India` : 'Jaipur, Rajasthan, India'}</span>
                    </div>
                  </div>

                  {/* Business Listing Status Card */}
                  <div className="bg-[#FAFAFA] border border-[#EAE5DE] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#EAE5DE] pb-2">
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Business Listing Status</span>
                      <span className="text-[#10B981] font-bold text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                        Verified
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-[#EAE5DE]/60 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-[#737373] uppercase font-semibold">Verification</span>
                        <span className="text-xs font-bold text-[#10B981] mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Verified Profile
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-[#EAE5DE]/60 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-[#737373] uppercase font-semibold">Listing Status</span>
                        <span className="text-xs font-bold text-[#B8005A] mt-1">
                          Ready to List
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAddProductSubmit(e, true);
                      setIsAddProductOpen(false);
                    }}
                    className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer transition-colors"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="px-5 py-2.5 bg-[#B8005A] hover:bg-[#8E004B] text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Continue to Product Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {modalStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2 animate-in fade-in duration-200">
                {/* Form Fields Column */}
                <div className="md:col-span-7 space-y-4 text-xs">
                  {/* Product Title */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Enter product name (e.g. Professional Keratin Hair Treatment)"
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                    />
                  </div>

                  {/* Brand Selection with Autocomplete */}
                  <div className="relative">
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Brand Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={searchBrand}
                        onFocus={() => setBrandDropdownOpen(true)}
                        onChange={(e) => {
                          setSearchBrand(e.target.value);
                          setBrand(e.target.value);
                          setBrandDropdownOpen(true);
                        }}
                        placeholder="Search brand or type to create a new one"
                        className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                      />
                      {searchBrand && (
                        <button
                          type="button"
                          onClick={() => { setSearchBrand(''); setBrand(''); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {brandDropdownOpen && (
                      <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-[#EAE5DE] rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {['Aura Beauty', 'Jaipur Luxury Gold', 'Kalyan Cosmetics', 'Ornate Herbal', 'Saffron Radiance', 'Vedic Glow', 'L\'Oreal Professionnel', 'O.P.I', 'Wella', 'Schwarzkopf', 'MAC Cosmetics', 'Dyson Professional']
                          .filter(b => b.toLowerCase().includes(searchBrand.toLowerCase()))
                          .map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                setBrand(b);
                                setSearchBrand(b);
                                setBrandDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[#FFF0F5] hover:text-[#B8005A] font-bold text-xs border-b border-gray-50 last:border-none transition-colors"
                            >
                              {b}
                            </button>
                          ))
                        }
                        {searchBrand.trim() !== '' && !['Aura Beauty', 'Jaipur Luxury Gold', 'Kalyan Cosmetics', 'Ornate Herbal', 'Saffron Radiance', 'Vedic Glow', 'L\'Oreal Professionnel', 'O.P.I', 'Wella', 'Schwarzkopf', 'MAC Cosmetics', 'Dyson Professional'].some(b => b.toLowerCase() === searchBrand.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBrand(searchBrand);
                              setBrandDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 bg-[#FFF0F5] text-[#B8005A] font-bold text-xs"
                          >
                            + Use "{searchBrand}" as custom brand name
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category & Subcategory Dynamic Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#1C1B1B] mb-1.5">Category *</label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => {
                          setNewProduct({ ...newProduct, category: e.target.value });
                        }}
                        className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] font-bold text-xs"
                      >
                        <option value="Skincare">Skincare</option>
                        <option value="Haircare">Haircare</option>
                        <option value="Hair Color">Hair Color</option>
                        <option value="Makeup">Makeup</option>
                        <option value="Nails">Nails</option>
                        <option value="Spa & Massage">Spa & Massage</option>
                        <option value="Tattoo Studio">Tattoo Studio</option>
                        <option value="Salon Furniture">Salon Furniture</option>
                        <option value="Salon Tools & Equipment">Salon Tools & Equipment</option>
                        <option value="Professional Beauty Products">Professional Beauty Products</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#1C1B1B] mb-1.5">Subcategory *</label>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] font-bold text-xs"
                      >
                        {(
                          {
                            'Skincare': ['Serums & Ampoules', 'Cleansers', 'Moisturizers', 'Sun Protection', 'Chemical Peels', 'Facial Kits'],
                            'Haircare': ['Shampoo', 'Conditioner', 'Hair Treatment', 'Hair Mask', 'Hair Serum'],
                            'Hair Color': ['Permanent Hair Color', 'Demi-Permanent', 'Bleach & Lightener', 'Color Developers'],
                            'Makeup': ['Primers', 'Foundations & Concealers', 'Setting Sprays & Powders', 'Eye Makeup', 'Lip Products'],
                            'Nails': ['Gel Polishes', 'Acrylic Systems', 'Nail Art Accessories', 'Nail Primers & Dehydrators', 'Nail Tools'],
                            'Spa & Massage': ['Massage Oils & Lotions', 'Essential Oils', 'Body Scrubs', 'Detox Wraps', 'Steam & Sauna Supplies'],
                            'Tattoo Studio': ['Tattoo Inks', 'Needles & Cartridges', 'Tattoo Machines', 'Aftercare Creams', 'Stencil Transfer Solutions'],
                            'Salon Furniture': ['Styling Chairs', 'Shampoo Stations', 'Massage Tables', 'Manicure Tables', 'Reception Desks'],
                            'Salon Tools & Equipment': ['Hair Dryers', 'Straighteners & Curlers', 'Clippers & Trimmers', 'Sterilizers', 'Facial Steamers'],
                            'Professional Beauty Products': ['Professional Kits', 'Wholesale Bundles', 'Cabin-use Refills', 'Disposables']
                          }[newProduct.category] || ['Standard Formulation']
                        ).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Type Options */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Product Type *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Professional Use', 'Retail Pack', 'Salon Cabin Size', 'Consumable/Disposable'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setProductType(type)}
                          className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                            productType === type 
                              ? 'border-[#B8005A] bg-[#FFF0F5] text-[#B8005A]' 
                              : 'border-[#EAE5DE] bg-[#FAFAFA] text-[#594047] hover:bg-[#FDFBF9]'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SKU Code Code */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">SKU Code (Optional)</label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="e.g. SLN-KER-500"
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-mono font-semibold"
                    />
                  </div>

                  {/* Variants Toggles & Form list */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-[#1C1B1B]">Does this listing have size/volume variants?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setHasVariants(true)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold ${hasVariants ? 'bg-[#B8005A] text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => { setHasVariants(false); setVariants([]); }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold ${!hasVariants ? 'bg-[#B8005A] text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {hasVariants && (
                      <div className="space-y-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EAE5DE]">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4">
                            <input
                              type="text"
                              id="variantNameInput"
                              placeholder="e.g. Standard / Travel"
                              className="w-full p-2 text-xs border border-[#EAE5DE] rounded-lg focus:outline-none focus:border-[#B8005A] bg-white font-semibold"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              id="variantSizeInput"
                              placeholder="Size (e.g. 500)"
                              className="w-full p-2 text-xs border border-[#EAE5DE] rounded-lg focus:outline-none focus:border-[#B8005A] bg-white font-semibold"
                            />
                          </div>
                          <div className="col-span-3">
                            <select
                              id="variantUnitInput"
                              className="w-full p-2 text-xs border border-[#EAE5DE] rounded-lg focus:outline-none bg-white font-bold"
                            >
                              <option value="ml">ml</option>
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="L">L</option>
                              <option value="pcs">pcs</option>
                              <option value="Units">Units</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nameEl = document.getElementById('variantNameInput') as HTMLInputElement;
                              const sizeEl = document.getElementById('variantSizeInput') as HTMLInputElement;
                              const unitEl = document.getElementById('variantUnitInput') as HTMLSelectElement;
                              if (nameEl && sizeEl) {
                                const name = nameEl.value.trim() || 'Standard';
                                const size = sizeEl.value.trim();
                                const unit = unitEl.value;
                                if (size) {
                                  setVariants([...variants, { name, size, unit }]);
                                  nameEl.value = '';
                                  sizeEl.value = '';
                                } else {
                                  setActionNotice('⚠️ Please enter size value.');
                                  setTimeout(() => setActionNotice(null), 3000);
                                }
                              }
                            }}
                            className="col-span-2 py-2 bg-[#B8005A] text-white font-bold rounded-lg hover:bg-[#8E004B] flex items-center justify-center cursor-pointer text-xs"
                          >
                            Add
                          </button>
                        </div>
                        {variants.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[#EAE5DE]/60">
                            {variants.map((v, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EAE5DE] text-[10px] font-bold text-[#1C1B1B]">
                                <span>{v.name}: {v.size} {v.unit}</span>
                                <button
                                  type="button"
                                  onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description with characters limit */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-[#1C1B1B]">Product Description *</label>
                      <span className={`text-[10px] font-bold ${description.length > 950 ? 'text-red-500' : 'text-gray-400'}`}>
                        {description.length} / 1000 characters
                      </span>
                    </div>
                    <textarea
                      maxLength={1000}
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the product formula, salon use instructions, active ingredients and benefits..."
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] font-semibold text-xs leading-relaxed"
                    />
                  </div>

                  {/* Highlights list with Presets */}
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1.5">Product Highlights / USPs (Max 8)</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={customHighlight}
                        onChange={(e) => setCustomHighlight(e.target.value)}
                        placeholder="Type highlight (e.g. Paraben Free)"
                        className="flex-1 p-2 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customHighlight.trim() && highlights.length < 8) {
                              setHighlights([...highlights, customHighlight.trim()]);
                              setCustomHighlight('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customHighlight.trim() && highlights.length < 8) {
                            setHighlights([...highlights, customHighlight.trim()]);
                            setCustomHighlight('');
                          }
                        }}
                        className="px-4 py-2 bg-[#FAF8F5] border border-[#EAE5DE] hover:bg-[#FDFBF9] rounded-xl font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Presets Chips */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Categorized USPs & Presets</span>
                        {!(newProduct.name.trim() !== '' && newProduct.category.trim() !== '' && description.trim() !== '') && (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100 animate-pulse">
                            🔒 Complete details above to unlock presets
                          </span>
                        )}
                      </div>

                      {newProduct.name.trim() !== '' && newProduct.category.trim() !== '' && description.trim() !== '' ? (
                        <div className="space-y-3.5 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] animate-in fade-in duration-200">
                          {PRESET_HIGHLIGHT_CATEGORIES.map((group) => (
                            <div key={group.category} className="space-y-1.5">
                              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">
                                {group.category}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {group.presets.map((p) => {
                                  const isActive = highlights.includes(p);
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        if (isActive) {
                                          setHighlights(highlights.filter(h => h !== p));
                                        } else if (highlights.length < 8) {
                                          setHighlights([...highlights, p]);
                                        } else {
                                          setActionNotice('⚠️ Maximum of 8 highlights allowed.');
                                          setTimeout(() => setActionNotice(null), 3000);
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                                        isActive 
                                          ? 'bg-[#B8005A] border border-[#A4004F] text-white shadow-2xs' 
                                          : 'bg-white hover:bg-gray-100 border border-[#EAE5DE] text-gray-600'
                                      }`}
                                    >
                                      {isActive && <Check className="w-3 h-3 text-white" />}
                                      <span>{p}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center space-y-1.5">
                          <p className="text-[11px] font-bold text-gray-500">
                            🔒 Auto-suggestion Presets Locked
                          </p>
                          <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                            Complete the <span className="font-bold text-gray-600">Product Name</span>, <span className="font-bold text-gray-600">Category</span>, and <span className="font-bold text-gray-600">Description</span> above to unlock high-conversion beauty USPs.
                          </p>
                        </div>
                      )}
                    </div>

                    {highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE5DE]">
                        {highlights.map((h, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#EAE5DE] text-[10px] font-bold text-[#B8005A]">
                            <span>{h}</span>
                            <button
                              type="button"
                              onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-700 font-extrabold cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Preview Column */}
                <div className="md:col-span-5 flex flex-col justify-start">
                  <div className="sticky top-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B8005A]" /> Live B2B Preview
                      </span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                        Auto-updates
                      </span>
                    </div>

                    <div className="bg-[#FAF8F5] rounded-3xl border border-[#EAE5DE] shadow-xs overflow-hidden group">
                      {/* Product Image preview frame - Interactive Click to Upload */}
                      <label className="relative h-44 bg-[#F2EDE9] flex items-center justify-center overflow-hidden cursor-pointer group/img block">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                        {newProduct.imageUrl ? (
                          <>
                            <img 
                              src={newProduct.imageUrl} 
                              alt="Live Listing Preview" 
                              className="w-full h-full object-cover animate-in fade-in duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                              <Camera className="w-5 h-5 text-pink-200 animate-pulse" />
                              <span>Click to Change Photo</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4">
                            <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-[#B8005A] mb-2 shadow-2xs group-hover/img:scale-110 transition-transform duration-300">
                              <Camera className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold block">No image uploaded yet</span>
                            <span className="text-[10px] text-[#B8005A] font-extrabold underline block mt-1 animate-pulse">Click here to Upload Photo</span>
                            <span className="text-[8px] text-gray-400 block mt-0.5">Media will also be asked in Step 3</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#B8005A] text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs uppercase tracking-wider">
                          {brand || 'Unspecified Brand'}
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED B2B
                        </div>
                      </label>

                      {/* Info Area */}
                      <div className="p-4 space-y-3 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] bg-[#B8005A]/10 text-[#B8005A] px-2 py-0.5 rounded-md font-bold">
                              {newProduct.category}
                            </span>
                            <span className="text-gray-300 text-[10px] font-extrabold">/</span>
                            <span className="text-[9px] text-[#737373] font-bold">
                              {subcategory || 'Standard Category'}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#1C1B1B] leading-snug line-clamp-2">
                            {newProduct.name || 'Untitled Premium Product'}
                          </h4>
                        </div>

                        {/* Specs overview */}
                        <div className="bg-white p-2.5 rounded-xl border border-[#EAE5DE]/60 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-semibold">Product Type:</span>
                            <span className="text-[#1C1B1B] font-bold">{productType}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-semibold">SKU Code:</span>
                            <span className="text-[#1C1B1B] font-mono font-bold">{newProduct.sku || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-dashed border-gray-100">
                            <span className="text-gray-500 font-semibold">Availability Status:</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${
                              availabilityStatus === 'In Stock' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : availabilityStatus === 'Out of Stock' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {availabilityStatus}
                            </span>
                          </div>
                          {availabilityNote && (
                            <div className="text-[10px] bg-gray-50 p-1.5 rounded-lg border border-gray-100/60 mt-1">
                              <span className="text-gray-400 font-bold block text-[8px] uppercase tracking-wider">Availability Note:</span>
                              <span className="text-gray-600 font-bold block mt-0.5 leading-snug">{availabilityNote}</span>
                            </div>
                          )}
                          {variants.length > 0 && (
                            <div className="text-[10px] pt-1.5 border-t border-dashed border-gray-100">
                              <span className="text-gray-500 font-semibold block mb-1">Configured Variants:</span>
                              <div className="flex flex-wrap gap-1">
                                {variants.slice(0, 3).map((v, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded-sm bg-[#FAF8F5] border border-gray-100 text-[9px] font-bold text-gray-700">
                                    {v.name} ({v.size}{v.unit})
                                  </span>
                                ))}
                                {variants.length > 3 && (
                                  <span className="text-[9px] text-gray-400 font-bold">+{variants.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Live Price and MOQ visual display */}
                        <div className="bg-white p-3 rounded-2xl border border-[#EAE5DE]/60 flex items-center justify-between shadow-2xs">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Wholesale Price</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {!showPricePublicly || priceType === 'Price on Request' || !newProduct.price ? (
                                <span className="text-[10px] font-extrabold text-[#B8005A] bg-[#FFF0F5] px-2 py-0.5 rounded-md border border-[#FFD1E3]">
                                  Price on Request
                                </span>
                              ) : (
                                <div className="flex flex-col">
                                  {mrp && (
                                    <span className="text-[9px] text-gray-400 line-through font-bold">
                                      MRP: ₹{parseFloat(mrp).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                  <span className="text-xs font-black text-[#1C1B1B]">
                                    {priceType === 'Starting From' ? 'Starting ' : ''}₹{parseFloat(newProduct.price).toLocaleString('en-IN')}
                                    <span className="text-[9px] font-semibold text-gray-500"> / {moqUnit}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Min. Order</span>
                            <span className="text-[10px] font-extrabold text-gray-700 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md mt-0.5">
                              {newProduct.moq || '0'} {moqUnit}s
                            </span>
                          </div>
                        </div>

                        {/* Bulk Offer Badge if Yes */}
                        {bulkDiscountToggle && (
                          <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-1.5 text-emerald-800 text-[10px] font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>Contact supplier for bulk pricing discounts!</span>
                          </div>
                        )}

                        {/* Description Preview */}
                        <div>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block mb-0.5">Discovery Description:</span>
                          <p className="text-[#737373] text-[10px] leading-relaxed line-clamp-3 font-semibold italic">
                            {description || '"Add a premium, informative description to help domestic salon owners and beauty wholesalers discover your items."'}
                          </p>
                        </div>

                        {/* Highlights pills */}
                        {highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {highlights.slice(0, 4).map((h, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-extrabold border border-emerald-100/60">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal footer actions */}
                <div className="col-span-1 md:col-span-12 flex justify-between gap-3 pt-4 border-t border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="px-4 py-2.5 border border-[#EAE5DE] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Business</span>
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionNotice('✅ Draft saved successfully!');
                        setTimeout(() => setActionNotice(null), 4000);
                        setIsAddProductOpen(false);
                      }}
                      className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer transition-colors"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newProduct.name || !brand || !newProduct.category) {
                          setActionNotice('⚠️ Name, Brand, and Category are required to continue.');
                          setTimeout(() => setActionNotice(null), 4000);
                          return;
                        }
                        setModalStep(3);
                      }}
                      className="px-5 py-2.5 bg-[#B8005A] hover:bg-[#8E004B] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Continue to Media Upload</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalStep === 3 && (
              <div className="mt-5 space-y-4 text-xs animate-in fade-in duration-200">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] mb-4">
                  <h4 className="text-xs font-extrabold text-[#1C1B1B] flex items-center gap-1.5 uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-[#B8005A]" />
                    Product Media & Catalog Photos
                  </h4>
                  <p className="text-[11px] text-[#737373] mt-1">
                    Upload official product catalog photographs or paste a web-hosted image URL to showcase your products on Nexora.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1">Product Photo / Image URL (Max 5MB, Auto HD Resize & Frame Fit)</label>
                    {actionNotice && (
                      <div className="mb-2 p-2 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{actionNotice}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={newProduct.imageUrl}
                          onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                          placeholder="Paste image URL or click upload to resize photo"
                          className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                        />
                      </div>
                      <label className="cursor-pointer px-4 py-3 bg-[#FFF0F5] hover:bg-[#FFE0EC] text-[#B8005A] font-bold rounded-xl border border-[#FFD1E3] flex items-center gap-2 shrink-0 transition-colors shadow-2xs">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    {newProduct.imageUrl && (
                      <div className="mt-3 relative w-full h-44 bg-[#F6F3F2] rounded-xl overflow-hidden border border-[#EAE5DE] flex items-center justify-center group">
                        <img 
                          src={newProduct.imageUrl} 
                          alt="Preview Frame" 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Camera className="w-4 h-4" /> HD Fitted in Frame
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="px-4 py-2.5 border border-[#EAE5DE] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Details</span>
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionNotice('✅ Draft saved successfully!');
                        setTimeout(() => setActionNotice(null), 4000);
                        setIsAddProductOpen(false);
                      }}
                      className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer transition-colors"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(4)}
                      className="px-5 py-2.5 bg-[#B8005A] hover:bg-[#8E004B] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Continue to Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {modalStep === 4 && (
              <form onSubmit={handleAddProductSubmit} className="mt-5 space-y-4 text-xs animate-in fade-in duration-200">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] mb-4">
                  <h4 className="text-xs font-extrabold text-[#1C1B1B] flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-4 h-4 text-[#B8005A]" />
                    Commercial Pricing & Minimum Order Quantity (MOQ)
                  </h4>
                  <p className="text-[11px] text-[#737373] mt-1">
                    Define your wholesale conditions, Indian tax values (MRP), variant-specific pricing, and bulk terms.
                  </p>
                </div>

                {/* Pricing Toggles and Inputs */}
                <div>
                  <label className="block font-bold text-[#1C1B1B] mb-1.5">Wholesale Price Type *</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Fixed Price', 'Starting From', 'Price on Request'] as const).map((type) => {
                      const isSelected = priceType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPriceType(type)}
                          className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF0F5] border-[#B8005A] text-[#B8005A]'
                              : 'bg-[#FAFAFA] border-[#EAE5DE] text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="block text-[11px]">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1">MRP (₹) <span className="text-[10px] font-normal text-gray-400">(Optional)</span></label>
                    <input
                      type="number"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Indian standard retail price. Wholesale price must be lower than MRP.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1">
                      Wholesale Price (₹) {priceType !== 'Price on Request' && '*'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      required={priceType !== 'Price on Request'}
                      disabled={priceType === 'Price on Request'}
                      value={priceType === 'Price on Request' ? '' : newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder={priceType === 'Price on Request' ? 'Price on Request (Hidden)' : 'e.g. 2500'}
                      className={`w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none bg-[#FAFAFA] text-xs font-semibold ${
                        priceType === 'Price on Request' ? 'opacity-50 cursor-not-allowed border-[#F0ECE7]' : 'focus:border-[#B8005A]'
                      }`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {priceType === 'Price on Request' 
                        ? 'Pricing is hidden from discovery list and set on custom enquiry.' 
                        : 'Wholesale price per unit listed for business-to-business discovery.'}
                    </p>
                  </div>
                </div>

                {/* MRP Exceed Warning */}
                {mrp && priceType !== 'Price on Request' && newProduct.price && parseFloat(newProduct.price) > parseFloat(mrp) && (
                  <div className="p-3 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Trade Warning: Wholesale price (₹{parseFloat(newProduct.price).toLocaleString('en-IN')}) is set higher than Retail MRP (₹{parseFloat(mrp).toLocaleString('en-IN')}). Standard wholesale margins should typically be lower.</span>
                  </div>
                )}

                {/* Variants Pricing override list */}
                {variants.length > 0 && (
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] space-y-3">
                    <h5 className="font-extrabold text-[#1C1B1B] text-xs uppercase tracking-wide">Variant-Specific overrides</h5>
                    <p className="text-[10px] text-gray-500 font-semibold">Enable checkboxes below to set custom wholesale price and MOQ requirements for each variant.</p>
                    <div className="space-y-2.5">
                      {variants.map((v, i) => {
                        const vp = variantPricing[i] || { price: '', moq: '', active: false };
                        return (
                          <div key={i} className="p-3 bg-white rounded-xl border border-[#EAE5DE] flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={vp.active}
                                onChange={(e) => {
                                  setVariantPricing(prev => ({
                                    ...prev,
                                    [i]: {
                                      ...prev[i] || { price: '', moq: '' },
                                      active: e.target.checked
                                    }
                                  }));
                                }}
                                className="w-4 h-4 accent-[#B8005A] rounded cursor-pointer"
                              />
                              <span className="font-bold text-[#1C1B1B]">
                                {v.name} ({v.size} {v.unit})
                              </span>
                            </div>

                            {vp.active && (
                              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-gray-500">Price: ₹</span>
                                  <input 
                                    type="number"
                                    placeholder="e.g. 2400"
                                    value={vp.price}
                                    onChange={(e) => {
                                      setVariantPricing(prev => ({
                                        ...prev,
                                        [i]: {
                                          ...prev[i] || { active: true, moq: '' },
                                          price: e.target.value
                                        }
                                      }));
                                    }}
                                    className="w-24 p-1.5 border border-[#EAE5DE] rounded-lg bg-[#FAFAFA] text-[11px] font-semibold focus:outline-none focus:border-[#B8005A]"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-gray-500">MOQ:</span>
                                  <input 
                                    type="number"
                                    placeholder="e.g. 40"
                                    value={vp.moq}
                                    onChange={(e) => {
                                      setVariantPricing(prev => ({
                                        ...prev,
                                        [i]: {
                                          ...prev[i] || { active: true, price: '' },
                                          moq: e.target.value
                                        }
                                      }));
                                    }}
                                    className="w-20 p-1.5 border border-[#EAE5DE] rounded-lg bg-[#FAFAFA] text-[11px] font-semibold focus:outline-none focus:border-[#B8005A]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Minimum Order quantity structure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1">Minimum Order Qty (MOQ) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.moq}
                      onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Minimum quantity required to place a wholesale order.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1C1B1B] mb-1">MOQ Unit *</label>
                    <select
                      value={moqUnit}
                      onChange={(e) => setMoqUnit(e.target.value)}
                      className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                    >
                      <option value="Piece">Piece(s)</option>
                      <option value="Box">Box(es)</option>
                      <option value="Pack">Pack(s)</option>
                      <option value="Set">Set(s)</option>
                      <option value="Kit">Kit(s)</option>
                      <option value="Case">Case(s)</option>
                      <option value="Carton">Carton(s)</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">Select the standard unit metric for wholesale trade.</p>
                  </div>
                </div>

                {/* MOQ Notes Optional input with 250 max limit characters count */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-[#1C1B1B]">MOQ Notes <span className="text-[10px] font-normal text-gray-400">(Optional)</span></label>
                    <span className="text-[10px] font-semibold text-gray-400">{moqNotes.length}/250</span>
                  </div>
                  <textarea
                    maxLength={250}
                    value={moqNotes}
                    onChange={(e) => setMoqNotes(e.target.value)}
                    placeholder="e.g. Free delivery on orders above 100 pieces. Custom formulation variants may require additional lead times."
                    rows={2}
                    className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Maximum 250 characters. Mention custom delivery or packaging criteria.</p>
                </div>

                {/* Toggle Swaps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-[#EAE5DE]">
                    <div>
                      <span className="block font-bold text-[#1C1B1B]">Bulk Discount Available</span>
                      <span className="block text-[10px] text-gray-400">Toggle ON if you offer tier-wise discounts for large-volume orders.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkDiscountToggle(!bulkDiscountToggle)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                        bulkDiscountToggle ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
                      }`}
                    >
                      <motion.div 
                        layout 
                        className="w-5 h-5 rounded-full bg-white shadow-xs" 
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl border border-[#EAE5DE]">
                    <div>
                      <span className="block font-bold text-[#1C1B1B]">Show Wholesale Price Publicly</span>
                      <span className="block text-[10px] text-gray-400">If OFF, listing will show "Price on Request" to protect your commercial privacy.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPricePublicly(!showPricePublicly)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                        showPricePublicly ? 'bg-[#B8005A] justify-end' : 'bg-gray-200 justify-start'
                      }`}
                    >
                      <motion.div 
                        layout 
                        className="w-5 h-5 rounded-full bg-white shadow-xs" 
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                {/* Step Actions */}
                <div className="flex justify-between gap-3 pt-4 border-t border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    className="px-4 py-2.5 border border-[#EAE5DE] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Media</span>
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionNotice('✅ Draft saved successfully!');
                        setTimeout(() => setActionNotice(null), 4000);
                        setIsAddProductOpen(false);
                      }}
                      className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#B8005A] hover:bg-[#8E004B] text-white font-bold rounded-xl shadow-xs cursor-pointer transition-colors font-extrabold uppercase tracking-wide flex items-center gap-1.5"
                    >
                      <span>Continue to Stock</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}

            {modalStep === 5 && (
              <form onSubmit={(e) => { e.preventDefault(); setModalStep(6); }} className="mt-5 space-y-4 text-xs animate-in fade-in duration-200">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] mb-4">
                  <h4 className="text-xs font-extrabold text-[#1C1B1B] flex items-center gap-1.5 uppercase tracking-wider">
                    <Boxes className="w-4 h-4 text-[#B8005A]" />
                    Product Availability & Stock Status
                  </h4>
                  <p className="text-[11px] text-[#737373] mt-1">
                    This section is ONLY for displaying the current availability status of the listed product to buyers.
                  </p>
                </div>

                {/* Stock Status Selection Card UI */}
                <div className="space-y-2">
                  <label className="block font-bold text-[#1C1B1B]">Availability Status *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['In Stock', 'Out of Stock', 'Available on Request'] as const).map((status) => {
                      const isSelected = availabilityStatus === status;
                      let colorClasses = '';
                      if (status === 'In Stock') {
                        colorClasses = isSelected 
                          ? 'border-[#B8005A] bg-[#FFF0F5] text-[#B8005A]' 
                          : 'border-[#EAE5DE] bg-white text-gray-700 hover:bg-gray-50';
                      } else if (status === 'Out of Stock') {
                        colorClasses = isSelected 
                          ? 'border-rose-600 bg-rose-50/70 text-rose-700' 
                          : 'border-[#EAE5DE] bg-white text-gray-700 hover:bg-gray-50';
                      } else {
                        colorClasses = isSelected 
                          ? 'border-amber-600 bg-amber-50/70 text-amber-700' 
                          : 'border-[#EAE5DE] bg-white text-gray-700 hover:bg-gray-50';
                      }

                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setAvailabilityStatus(status)}
                          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative ${colorClasses} shadow-2xs`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs">{status}</span>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#B8005A] flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[9px] text-gray-500 mt-1 leading-normal font-semibold">
                            {status === 'In Stock' && 'Item is currently available for dispatch.'}
                            {status === 'Out of Stock' && 'Item is temporarily unavailable, but enquiry lines stay open.'}
                            {status === 'Available on Request' && 'Supplier can produce or acquire on client demand.'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Availability Message */}
                <div className="space-y-1.5 mt-4">
                  <div className="flex justify-between items-center">
                    <label className="block font-bold text-[#1C1B1B]">
                      Availability Note <span className="text-[10px] font-normal text-[#737373]">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-gray-400">{availabilityNote.length}/200</span>
                  </div>
                  <input
                    type="text"
                    maxLength={200}
                    value={availabilityNote}
                    onChange={(e) => setAvailabilityNote(e.target.value)}
                    placeholder="e.g., Ready for immediate enquiry, or Available against advance enquiry"
                    className="w-full p-3 border border-[#EAE5DE] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] text-xs font-semibold text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Maximum 200 characters. Help salon buyers understand delivery timelines.</p>
                </div>

                {/* Variant-specific Availability Overrides */}
                {variants.length > 0 && (
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] mt-4 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#B8005A]" />
                      <span className="font-extrabold text-[#1C1B1B] text-xs uppercase tracking-wider">Configure Availability Per Variant</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      Fine-tune individual variant listings. Leave as is to inherit default availability.
                    </p>
                    
                    <div className="space-y-2.5 pt-1">
                      {variants.map((v, i) => {
                        const currentVal = variantAvailability[i] || 'In Stock';
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#EAE5DE]/60">
                            <span className="font-bold text-gray-800 text-[11px]">{v.name} ({v.size}{v.unit})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(['In Stock', 'Out of Stock', 'Available on Request'] as const).map((opt) => {
                                const isSel = currentVal === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setVariantAvailability({ ...variantAvailability, [i]: opt })}
                                    className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                                      isSel 
                                        ? 'bg-[#B8005A] border-[#B8005A] text-white' 
                                        : 'bg-gray-50 border-[#EAE5DE] text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5 Navigation Actions */}
                <div className="flex justify-between gap-3 pt-4 border-t border-[#E8E8E8] mt-6">
                  <button
                    type="button"
                    onClick={() => setModalStep(4)}
                    className="px-4 py-2.5 border border-[#EAE5DE] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Pricing</span>
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActionNotice('✅ Draft saved successfully!');
                        setTimeout(() => setActionNotice(null), 4000);
                        setIsAddProductOpen(false);
                      }}
                      className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#B8005A] hover:bg-[#8E004B] text-white font-black rounded-xl shadow-xs cursor-pointer transition-colors uppercase tracking-wide flex items-center gap-1.5"
                    >
                      <span>Continue to Product Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}

            {modalStep === 6 && (
              <div className="mt-5 space-y-6 animate-in fade-in duration-200 text-xs">
                {/* Form Review Section */}
                <div className="space-y-6">
                    {/* Step Intro Header */}
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE]">
                      <h4 className="text-xs font-extrabold text-[#1C1B1B] flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#B8005A]" />
                        Review Product Listing
                      </h4>
                      <p className="text-[11px] text-[#737373] mt-1">
                        Verify your product listing details exactly as buyers will see them on Nexora. Make any adjustments before publishing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Summary Cards and Checklist (7 cols) */}
                      <div className="lg:col-span-7 space-y-5">
                        
                        {/* 1. Listing Completeness Checklist */}
                        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DE] space-y-3.5 shadow-xs">
                          <h5 className="font-extrabold text-[#1C1B1B] text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#EAE5DE] pb-2">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Listing Completeness Checklist
                          </h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Required fields */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="font-semibold text-gray-700 text-[10px]">Business Connected</span>
                              {currentUser?.companyName ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">✓ Ready</span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">⚠️ Missing</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="font-semibold text-gray-700 text-[10px]">Product Info</span>
                              {newProduct.name && brand && newProduct.category ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">✓ Ready</span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">⚠️ Missing</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="font-semibold text-gray-700 text-[10px]">Product Image</span>
                              {newProduct.imageUrl ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">✓ Ready</span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">⚠️ Missing</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="font-semibold text-gray-700 text-[10px]">Pricing & MOQ</span>
                              {(priceType === 'Price on Request' || newProduct.price) && newProduct.moq ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">✓ Ready</span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">⚠️ Missing</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="font-semibold text-gray-700 text-[10px]">Stock Status</span>
                              {availabilityStatus ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">✓ Ready</span>
                              ) : (
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">⚠️ Missing</span>
                              )}
                            </div>

                            {/* Optional fields status */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE]/40 col-span-1 sm:col-span-2">
                              <span className="font-extrabold text-[#B8005A] text-[9px] uppercase tracking-wider">Optional Enrichment Checklist:</span>
                              <div className="flex flex-wrap gap-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${newProduct.sku ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-gray-100 text-gray-400'}`}>
                                  SKU: {newProduct.sku ? 'Yes' : 'No'}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${mrp ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-gray-100 text-gray-400'}`}>
                                  MRP: {mrp ? 'Yes' : 'No'}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${variants.length > 0 ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-gray-100 text-gray-400'}`}>
                                  Variants: {variants.length > 0 ? `${variants.length}` : 'No'}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${availabilityNote ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-gray-100 text-gray-400'}`}>
                                  Availability Note: {availabilityNote ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Business Information Preview */}
                        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DE] space-y-3 shadow-xs">
                          <div className="flex justify-between items-center border-b border-[#EAE5DE] pb-2">
                            <h5 className="font-extrabold text-[#1C1B1B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#B8005A]" />
                              Business Information Preview
                            </h5>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddProductOpen(false);
                                if (onOpenOnboarding) onOpenOnboarding();
                              }}
                              className="text-[10px] text-[#B8005A] font-extrabold hover:underline"
                            >
                              Edit Profile
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] border border-[#FFD1E3] flex items-center justify-center text-[#B8005A] font-extrabold shrink-0">
                              {(currentUser?.companyName || 'Jaipur').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h6 className="font-black text-[#1C1B1B] text-xs truncate">
                                  {currentUser?.companyName || 'Jaipur Luxury Beauty Hub'}
                                </h6>
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-black rounded bg-emerald-50 text-emerald-700 shrink-0">
                                  VERIFIED
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                                {currentUser?.businessType || 'Wholesale Beauty Distributor'} • {currentUser?.city || 'Jaipur'}, {currentUser?.state || 'Rajasthan'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Product Information Preview */}
                        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DE] space-y-4 shadow-xs">
                          <div className="flex justify-between items-center border-b border-[#EAE5DE] pb-2">
                            <h5 className="font-extrabold text-[#1C1B1B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Tag className="w-4 h-4 text-[#B8005A]" />
                              Product Details
                            </h5>
                            <button
                              type="button"
                              onClick={() => setModalStep(2)}
                              className="text-[10px] text-[#B8005A] font-extrabold hover:underline"
                            >
                              Edit Details
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Brand Name</span>
                                <span className="font-extrabold text-gray-800 text-xs">{brand || 'Not Added'}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Product Name</span>
                                <span className="font-extrabold text-gray-800 text-xs">{newProduct.name || 'Not Added'}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Category</span>
                                <span className="font-extrabold text-gray-800 text-xs">{newProduct.category || 'Not Added'}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Subcategory</span>
                                <span className="font-extrabold text-gray-800 text-xs">{subcategory || 'Not Added'}</span>
                              </div>
                            </div>

                            {description && (
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Product Description</span>
                                <p className="text-[11px] text-[#594047] font-semibold mt-1 leading-relaxed line-clamp-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  {description}
                                </p>
                              </div>
                            )}

                            {highlights.length > 0 && (
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold mb-1">Product Highlights</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {highlights.map((tag, idx) => (
                                    <span key={idx} className="bg-[#FFF0F5] text-[#B8005A] px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4. Pricing, MOQ & Availability Preview */}
                        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DE] space-y-4 shadow-xs">
                          <div className="flex justify-between items-center border-b border-[#EAE5DE] pb-2">
                            <h5 className="font-extrabold text-[#1C1B1B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-[#B8005A]" />
                              Pricing, MOQ & Stock Availability
                            </h5>
                            <button
                              type="button"
                              onClick={() => setModalStep(4)}
                              className="text-[10px] text-[#B8005A] font-extrabold hover:underline"
                            >
                              Edit Pricing & Stock
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                              <span className="block text-[10px] text-gray-400 font-bold">Wholesale Price</span>
                              {priceType === 'Price on Request' ? (
                                <span className="font-extrabold text-[#B8005A] text-xs">Price on Request</span>
                              ) : (
                                <span className="font-extrabold text-gray-800 text-xs">
                                  {showPricePublicly 
                                    ? `₹${parseFloat(newProduct.price).toLocaleString('en-IN')}/${moqUnit}` 
                                    : 'Encrypted / Private'
                                  }
                                </span>
                              )}
                            </div>

                            {mrp && (
                              <div>
                                <span className="block text-[10px] text-gray-400 font-bold">Retail MRP</span>
                                <span className="font-extrabold text-gray-800 text-xs">₹{parseFloat(mrp).toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            <div>
                              <span className="block text-[10px] text-gray-400 font-bold">Minimum Order Qty</span>
                              <span className="font-extrabold text-gray-800 text-xs">{newProduct.moq} {moqUnit}s</span>
                            </div>

                            <div>
                              <span className="block text-[10px] text-gray-400 font-bold">Availability Status</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black mt-0.5 uppercase tracking-wider ${
                                availabilityStatus === 'In Stock' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : availabilityStatus === 'Out of Stock' 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {availabilityStatus}
                              </span>
                            </div>

                            {availabilityNote && (
                              <div className="col-span-2">
                                <span className="block text-[10px] text-gray-400 font-bold">Availability Note</span>
                                <span className="font-semibold text-gray-600 text-[10px] line-clamp-1">{availabilityNote}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 5. Media & Gallery Preview */}
                        <div className="bg-white p-5 rounded-2xl border border-[#EAE5DE] space-y-3.5 shadow-xs">
                          <div className="flex justify-between items-center border-b border-[#EAE5DE] pb-2">
                            <h5 className="font-extrabold text-[#1C1B1B] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                              <Boxes className="w-4 h-4 text-[#B8005A]" />
                              Media Uploaded ({newProduct.imageUrl ? 1 : 0}/1)
                            </h5>
                            <button
                              type="button"
                              onClick={() => setModalStep(3)}
                              className="text-[10px] text-[#B8005A] font-extrabold hover:underline"
                            >
                              Edit Media
                            </button>
                          </div>

                          {newProduct.imageUrl ? (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <img 
                                src={newProduct.imageUrl} 
                                alt="Main preview" 
                                className="w-14 h-14 rounded-xl object-cover border border-[#EAE5DE] bg-white shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 uppercase tracking-wider">
                                  ✓ Primary Product Image Verified
                                </span>
                                <p className="text-[9px] text-gray-400 font-bold mt-0.5">High-resolution listing thumbnail ready for search & discovery grids.</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-center rounded-xl font-bold">
                              No product image found. Click Edit Media to upload a product thumbnail.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Device Switcher & Live Interactive Public Listing Card Preview (5 cols) */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DE] space-y-3 shadow-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-[#1C1B1B] text-xs uppercase tracking-wider">Device Preview Switcher</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewDevice('desktop')}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-extrabold ${
                                  previewDevice === 'desktop' 
                                    ? 'bg-[#B8005A] border-[#B8005A] text-white shadow-xs' 
                                    : 'bg-white border-[#EAE5DE] text-[#594047] hover:bg-[#F1EDEC]'
                                }`}
                              >
                                <Monitor className="w-3.5 h-3.5" />
                                <span>Desktop</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewDevice('mobile')}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-extrabold ${
                                  previewDevice === 'mobile' 
                                    ? 'bg-[#B8005A] border-[#B8005A] text-white shadow-xs' 
                                    : 'bg-white border-[#EAE5DE] text-[#594047] hover:bg-[#F1EDEC]'
                                }`}
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Mobile</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-[10px] text-gray-500 font-bold">
                            Live render of the Nexora discovery listing card. Scroll to interact with mock direct connection actions.
                          </p>
                        </div>

                        {/* Interactive Live Frame Container */}
                        <div className="flex justify-center items-center">
                          {previewDevice === 'mobile' ? (
                            /* Physical phone-like border frame container */
                            <div className="w-full max-w-[310px] border-[8px] border-slate-900 bg-slate-950 rounded-[2.5rem] shadow-xl overflow-hidden relative aspect-[9/16] flex flex-col my-2">
                              {/* Notch */}
                              <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 rounded-b-xl z-20 flex items-center justify-center">
                                <div className="w-14 h-2 bg-black rounded-full" />
                              </div>
                              <div className="flex-1 bg-white pt-4 overflow-y-auto text-left relative flex flex-col select-none">
                                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                                  <span className="font-extrabold text-[10px] text-slate-800">Nexora Discover</span>
                                  <span className="text-[8px] text-emerald-600 font-extrabold">● Live</span>
                                </div>
                                <div className="flex-1 space-y-3 pb-16">
                                  <div className="relative aspect-square w-full bg-gray-50">
                                    <img 
                                      src={newProduct.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=300'} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    {availabilityStatus === 'Out of Stock' && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3">
                                        <span className="text-[10px] bg-rose-600 text-white font-black px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse text-center">
                                          Currently Out of Stock
                                        </span>
                                      </div>
                                    )}
                                    <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-black text-slate-800 shadow-xs uppercase tracking-wider">
                                      {newProduct.category}
                                    </span>
                                  </div>

                                  <div className="px-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[8px] font-extrabold text-[#B8005A] uppercase tracking-widest">{brand || 'BRAND'}</span>
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                                        availabilityStatus === 'In Stock' 
                                          ? 'bg-emerald-50 text-emerald-700' 
                                          : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        {availabilityStatus}
                                      </span>
                                    </div>

                                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-1 leading-snug">{newProduct.name || 'Premium Product Listing'}</h4>
                                    
                                    <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      <span className="text-[9px] text-slate-500 font-bold">
                                        by {currentUser?.companyName || 'Jaipur Luxury Beauty Hub'}
                                      </span>
                                    </div>

                                    <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE5DE]/40 space-y-1">
                                      <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-gray-400">Wholesale Price</span>
                                        <span className="text-slate-900 font-extrabold">
                                          {priceType === 'Price on Request' 
                                            ? 'Price on Request' 
                                            : showPricePublicly 
                                              ? `₹${parseFloat(newProduct.price || '0').toLocaleString('en-IN')}/${moqUnit}` 
                                              : 'Contact Supplier'
                                          }
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[9px] font-bold">
                                        <span className="text-gray-400">Minimum Order</span>
                                        <span className="text-[#B8005A] font-extrabold">{newProduct.moq || 1} {moqUnit}s</span>
                                      </div>
                                    </div>

                                    {availabilityNote && (
                                      <p className="text-[8px] italic font-semibold text-gray-500 line-clamp-2">
                                        "{availabilityNote}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Direct Connect Inquiry Footer inside mobile viewport */}
                                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-white border-t border-gray-100 grid grid-cols-3 gap-1.5">
                                  <button type="button" className="py-1.5 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[8px] font-extrabold flex flex-col items-center justify-center gap-0.5 border border-emerald-200">
                                    <span className="text-[10px]">💬</span>
                                    <span>WhatsApp</span>
                                  </button>
                                  <button type="button" className="py-1.5 px-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-[8px] font-extrabold flex flex-col items-center justify-center gap-0.5 border border-sky-200">
                                    <span className="text-[10px]">📞</span>
                                    <span>Call</span>
                                  </button>
                                  <button type="button" className="py-1.5 px-1 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-lg text-[8px] font-extrabold flex flex-col items-center justify-center gap-0.5 border border-pink-200">
                                    <span className="text-[10px]">✉️</span>
                                    <span>Enquiry</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Desktop full-width representation */
                            <div className="w-full border border-[#EAE5DE] rounded-2xl overflow-hidden bg-white shadow-xs">
                              <div className="p-3 bg-slate-50 border-b border-[#EAE5DE] flex items-center justify-between text-[10px] font-bold text-gray-500">
                                <span>Desktop public product catalog listing page preview</span>
                                <span className="bg-[#FFF0F5] text-[#B8005A] px-2 py-0.5 rounded-lg text-[9px]">Verified Supplier Catalogue</span>
                              </div>
                              
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="relative aspect-square max-h-[180px] w-full bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={newProduct.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=300'} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  {availabilityStatus === 'Out of Stock' && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2">
                                      <span className="text-[9px] bg-rose-600 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                        Currently Out of Stock
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[8px] font-extrabold text-[#B8005A] uppercase tracking-widest">{brand || 'BRAND'}</span>
                                      <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      <span className="text-[8px] font-black text-gray-400 uppercase">IN STOCK</span>
                                    </div>
                                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight mt-0.5">{newProduct.name || 'Premium Salon Formula'}</h4>
                                    
                                    <div className="text-[9px] text-gray-500 font-bold mt-1">
                                      Sold by <span className="text-slate-800 underline">{currentUser?.companyName || 'Jaipur Luxury Beauty Hub'}</span>
                                    </div>
                                  </div>

                                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DE]/40 space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className="text-gray-400">Wholesale Price</span>
                                      <span className="text-slate-900 font-extrabold">
                                        {priceType === 'Price on Request' 
                                          ? 'Price on Request' 
                                          : showPricePublicly 
                                            ? `₹${parseFloat(newProduct.price || '0').toLocaleString('en-IN')}/${moqUnit}` 
                                            : 'Request Quote'
                                        }
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className="text-gray-400">Min Order Qty</span>
                                      <span className="text-[#B8005A] font-extrabold">{newProduct.moq || 1} {moqUnit}s</span>
                                    </div>
                                  </div>

                                  {/* Direct Connect Enquiry Actions */}
                                  <div className="grid grid-cols-3 gap-1 pt-1">
                                    <button type="button" className="py-1 px-0.5 bg-[#FFF0F5] hover:bg-[#FFD1E3] text-[#B8005A] rounded-lg text-[8px] font-extrabold flex items-center justify-center gap-0.5 border border-[#FFD1E3]">
                                      <span>✉️ Enquiry</span>
                                    </button>
                                    <button type="button" className="py-1 px-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[8px] font-extrabold flex items-center justify-center gap-0.5 border border-emerald-200">
                                      <span>💬 WhatsApp</span>
                                    </button>
                                    <button type="button" className="py-1 px-0.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-[8px] font-extrabold flex items-center justify-center gap-0.5 border border-sky-200">
                                      <span>📞 Call</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Final Validation Box */}
                    {!(currentUser?.companyName && newProduct.name && brand && newProduct.category && newProduct.imageUrl && (priceType === 'Price on Request' || newProduct.price) && newProduct.moq) && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-amber-800 text-xs">Complete Required Information</h5>
                          <p className="text-amber-700 text-[11px] leading-relaxed font-semibold">
                            Please complete all required fields on the checklist before publishing this product listing.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex justify-between gap-3 pt-4 border-t border-[#E8E8E8] mt-6">
                      <button
                        type="button"
                        onClick={() => setModalStep(5)}
                        className="px-4 py-2.5 border border-[#EAE5DE] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Stock</span>
                      </button>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            handleAddProductSubmit(e, true);
                            setIsAddProductOpen(false);
                          }}
                          className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC] cursor-pointer"
                        >
                          Save Draft
                        </button>
                        <button
                          type="button"
                          disabled={!(currentUser?.companyName && newProduct.name && brand && newProduct.category && newProduct.imageUrl && (priceType === 'Price on Request' || newProduct.price) && newProduct.moq)}
                          onClick={handleAddProductSubmit}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-sm cursor-pointer transition-colors uppercase tracking-wide flex items-center gap-1.5"
                        >
                          <span>Publish Product Listing</span>
                          <Sparkles className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )}
  </div>
);
};

