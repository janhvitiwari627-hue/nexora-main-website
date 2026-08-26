import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Plus, Play, Pause, Edit3, Trash2, Eye, DollarSign, TrendingUp, 
  Target, Calendar, Image as ImageIcon, Upload, Check, AlertCircle, RefreshCw, 
  Layers, Tag, CheckCircle2, Search, ArrowRight, ShieldCheck, Wallet, ChevronRight, 
  X, Film, Video, Link as LinkIcon, ExternalLink, AlertTriangle, Clock, BarChart3,
  MousePointer, Send, CheckCheck, HelpCircle, ChevronDown, Radio, Info,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface SparklineTrendProps {
  data: { label: string; value: number }[];
  color: string;
  metricPrefix?: string;
  metricSuffix?: string;
  height?: number;
}

const InteractiveSparkline: React.FC<SparklineTrendProps> = ({
  data,
  color,
  metricPrefix = '',
  metricSuffix = '',
  height = 32
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 110;
  
  // Calculate % change between first and last data point
  const firstVal = values[0] || 1;
  const lastVal = values[values.length - 1] || 1;
  const pctChange = ((lastVal - firstVal) / firstVal) * 100;
  const isPositive = pctChange >= 0;

  const points = data
    .map((d, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative flex items-center justify-between gap-2 pt-1">
      {/* Percentage change tag */}
      <div className="flex items-center gap-1">
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
          isPositive 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{isPositive ? '+' : ''}{pctChange.toFixed(1)}%</span>
        </span>
        <span className="text-[9px] text-[#594047] font-medium">vs 7d ago</span>
      </div>

      {/* SVG Interactive Sparkline */}
      <div className="relative">
        <svg 
          className="w-20 h-7 overflow-visible cursor-pointer" 
          viewBox={`0 0 ${width} ${height}`}
        >
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((d, idx) => {
            const x = (idx / (data.length - 1)) * width;
            const y = height - ((d.value - min) / range) * (height - 8) - 4;
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={isHovered ? 4.5 : 2.5}
                className="fill-white stroke-[2] transition-all"
                stroke={color}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div className="absolute bottom-full right-0 mb-1.5 bg-zinc-950 text-white text-[10px] py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-30 font-mono">
            <span className="text-stone-400 mr-1">{data[hoveredIdx].label}:</span>
            <span className="font-bold text-white">
              {metricPrefix}{data[hoveredIdx].value.toLocaleString()}{metricSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
import { 
  AdCampaignItem, 
  getStoredCampaigns, 
  saveSingleCampaign, 
  toggleCampaignStatus, 
  deleteCampaignFromStore, 
  getAdAccountBalance, 
  addAdAccountBalance,
  setAdAccountBalance,
  reconcileProductAvailability
} from '../data/sponsoredCampaignsStore';
import { SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { SponsoredVideoItem, VideoPlatform } from '../types';
import { saveSponsoredReel, saveSponsoredFullVideo, detectPlatformFromUrl } from '../data/sponsoredReelsData';
import { getStoredSponsoredAnalyticsEvents } from '../data/sponsoredAnalyticsStore';

interface SponsoredAdManagerProps {
  supplierId?: string;
  supplierName?: string;
  onNavigateToProduct?: (productId: string) => void;
  onOpenRfqModalWithContext?: (productTitle: string, supplierName: string) => void;
}

const PRESET_SAMPLE_IMAGES = [
  { label: 'Vitamin C Glow Serum', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hyaluronic Barrier Cream', url: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=800&q=80' },
  { label: 'Salon Spa Hair Kit', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dermatology Scalp Tonic', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80' },
  { label: 'Amber Glass Dropper Packaging', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80' },
  { label: 'Organic Rosewater Mist', url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80' }
];

export const SponsoredAdManager: React.FC<SponsoredAdManagerProps> = ({
  supplierId = 'seller_aura_001',
  supplierName = 'Aura Beauty Labs',
  onNavigateToProduct,
  onOpenRfqModalWithContext
}) => {
  const [campaigns, setCampaigns] = useState<AdCampaignItem[]>([]);
  const [balance, setBalance] = useState<number>(41000); // ₹41,000 (~$500)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'unavailable' | 'draft'>('all');
  const [filterType, setFilterType] = useState<'all' | 'image_ad' | 'reel_or_short' | 'full_video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edge case simulation states
  const [isSimulatedUnavailable, setIsSimulatedUnavailable] = useState(false);
  const [activeAlertMessage, setActiveAlertMessage] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [previewModalCampaign, setPreviewModalCampaign] = useState<AdCampaignItem | null>(null);
  const [analyticsDetailCampaign, setAnalyticsDetailCampaign] = useState<AdCampaignItem | null>(null);
  const [previewPlacementTab, setPreviewPlacementTab] = useState<'homepage' | 'search_results' | 'category_page'>('homepage');

  // Top up state
  const [topUpAmount, setTopUpAmount] = useState<number>(100); // in USD ($100 = ₹8,200)

  // ==========================================
  // Form State for Campaign Creator & Editor
  // ==========================================
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [formCreativeType, setFormCreativeType] = useState<'image_ad' | 'reel_or_short' | 'full_video'>('image_ad');
  const [formName, setFormName] = useState('');
  const [formObjective, setFormObjective] = useState<AdCampaignItem['objective']>('Boost Product Sales');
  const [formTargetType, setFormTargetType] = useState<'product' | 'profile'>('product');
  const [formProductId, setFormProductId] = useState('product_vitc_101');
  const [formHeadline, setFormHeadline] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_SAMPLE_IMAGES[0].url);
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formVideoPlatform, setFormVideoPlatform] = useState<VideoPlatform>('YouTube');
  const [formCtaText, setFormCtaText] = useState<AdCampaignItem['ctaText']>('Get Quote');
  const [formCtaType, setFormCtaType] = useState<'product_detail' | 'supplier_profile' | 'quick_rfq'>('product_detail');
  const [formCategories, setFormCategories] = useState<string[]>(['Skincare', 'OEM / Private Label']);
  const [formKeywordsInput, setFormKeywordsInput] = useState('vitamin c, serum, bulk, oem, salon supply');
  const [formDailyBudget, setFormDailyBudget] = useState<number>(25); // $25 / day
  const [formTotalBudget, setFormTotalBudget] = useState<number>(500); // $500 total
  const [formIsContinuous, setFormIsContinuous] = useState(true);
  const [formStartDate, setFormStartDate] = useState('2026-08-18');
  const [formEndDate, setFormEndDate] = useState('2026-09-18');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Load data & run auto-reconciliation on mount and updates
  useEffect(() => {
    refreshData();
    window.addEventListener('nexora_sponsored_campaigns_updated', refreshData);
    return () => {
      window.removeEventListener('nexora_sponsored_campaigns_updated', refreshData);
    };
  }, []);

  const refreshData = () => {
    const list = getStoredCampaigns();
    setCampaigns(list);
    setBalance(getAdAccountBalance());

    // Check for paused campaigns due to unavailable product
    const unavailableCount = list.filter(c => c.status === 'paused_product_unavailable').length;
    if (unavailableCount > 0) {
      setActiveAlertMessage(
        `Action Required: Re-link an active product to resume campaign. (${unavailableCount} campaign${unavailableCount > 1 ? 's' : ''} auto-paused because linked product is unlisted or out-of-stock.)`
      );
    } else {
      setActiveAlertMessage(null);
    }
  };

  // Convert amounts between USD ($) and INR (₹) at fixed standard rate 1 USD = 82 INR
  const formatCurrency = (usdVal: number, inrVal?: number) => {
    if (currency === 'INR') {
      const amt = inrVal !== undefined ? inrVal : Math.round(usdVal * 82);
      return `₹${amt.toLocaleString('en-IN')}`;
    }
    const amt = usdVal !== undefined ? usdVal : Math.round((inrVal || 0) / 82);
    return `$${amt.toLocaleString('en-US')}`;
  };

  // Check product validation in real-time
  const selectedProductData = useMemo(() => {
    return SPONSORED_PRODUCTS_DB[formProductId] || null;
  }, [formProductId]);

  const productValidationResult = useMemo(() => {
    if (formTargetType === 'profile') {
      return {
        isValid: true,
        message: `Attributed to Verified Supplier Profile (/supplier/${supplierId})`,
        status: 'valid'
      };
    }
    if (!selectedProductData) {
      return {
        isValid: false,
        message: 'Product not found in catalogue database',
        status: 'error'
      };
    }
    if (selectedProductData.seller_id !== supplierId) {
      return {
        isValid: false,
        message: `Ownership Mismatch: Product belongs to ${selectedProductData.seller_id}, not ${supplierId}`,
        status: 'mismatch'
      };
    }
    if (!selectedProductData.isPublished || selectedProductData.isSuspended) {
      return {
        isValid: false,
        message: 'Product is currently Unlisted / Out-of-Stock. Campaign will auto-pause upon launch.',
        status: 'unavailable'
      };
    }
    return {
      isValid: true,
      message: `Verified: Owned by ${supplierName} (${selectedProductData.id})`,
      status: 'valid'
    };
  }, [formTargetType, selectedProductData, supplierId, supplierName]);

  // Overall Aggregate Stats Calculation
  const totalImpressions = useMemo(() => campaigns.reduce((acc, c) => acc + c.impressions, 0), [campaigns]);
  const totalClicks = useMemo(() => campaigns.reduce((acc, c) => acc + c.clicks, 0), [campaigns]);
  const totalProductClicks = useMemo(() => campaigns.reduce((acc, c) => acc + (c.productClicks || Math.round(c.clicks * 0.65)), 0), [campaigns]);
  const totalProfileClicks = useMemo(() => campaigns.reduce((acc, c) => acc + (c.profileClicks || Math.round(c.clicks * 0.25)), 0), [campaigns]);
  const totalRfqsGenerated = useMemo(() => campaigns.reduce((acc, c) => acc + (c.rfqsGenerated || Math.round(c.clicks * 0.1)), 0), [campaigns]);
  const totalSpentUsd = useMemo(() => Math.round(campaigns.reduce((acc, c) => acc + c.spentBudget, 0) / 82) || 1250, [campaigns]);
  const balanceUsd = useMemo(() => Math.round(balance / 82), [balance]);

  // Derive historical trend points for the 4 overview cards
  const spendTrendData = useMemo(() => {
    const base = totalSpentUsd || 1250;
    return [
      { label: '6d ago', value: Math.round(base * 0.72) },
      { label: '5d ago', value: Math.round(base * 0.78) },
      { label: '4d ago', value: Math.round(base * 0.81) },
      { label: '3d ago', value: Math.round(base * 0.86) },
      { label: '2d ago', value: Math.round(base * 0.91) },
      { label: 'Yesterday', value: Math.round(base * 0.95) },
      { label: 'Today', value: Math.round(base) }
    ];
  }, [totalSpentUsd]);

  const impressionsTrendData = useMemo(() => {
    const base = totalImpressions || 48200;
    return [
      { label: '6d ago', value: Math.round(base * 0.68) },
      { label: '5d ago', value: Math.round(base * 0.74) },
      { label: '4d ago', value: Math.round(base * 0.79) },
      { label: '3d ago', value: Math.round(base * 0.85) },
      { label: '2d ago', value: Math.round(base * 0.90) },
      { label: 'Yesterday', value: Math.round(base * 0.96) },
      { label: 'Today', value: Math.round(base) }
    ];
  }, [totalImpressions]);

  const clicksTrendData = useMemo(() => {
    const base = totalClicks || 1240;
    return [
      { label: '6d ago', value: Math.round(base * 0.65) },
      { label: '5d ago', value: Math.round(base * 0.71) },
      { label: '4d ago', value: Math.round(base * 0.78) },
      { label: '3d ago', value: Math.round(base * 0.84) },
      { label: '2d ago', value: Math.round(base * 0.89) },
      { label: 'Yesterday', value: Math.round(base * 0.94) },
      { label: 'Today', value: Math.round(base) }
    ];
  }, [totalClicks]);

  const videoEngagementTrendData = useMemo(() => {
    return [
      { label: '6d ago', value: 24 },
      { label: '5d ago', value: 26 },
      { label: '4d ago', value: 28 },
      { label: '3d ago', value: 30 },
      { label: '2d ago', value: 32 },
      { label: 'Yesterday', value: 33 },
      { label: 'Today', value: 35 }
    ];
  }, []);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesQuery = c.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.adTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.product_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = c.status === 'active';
      else if (filterStatus === 'paused') matchesStatus = c.status === 'paused';
      else if (filterStatus === 'unavailable') matchesStatus = c.status === 'paused_product_unavailable';
      else if (filterStatus === 'draft') matchesStatus = c.status === 'draft';

      let matchesType = true;
      if (filterType !== 'all') matchesType = (c.creativeType || 'image_ad') === filterType;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [campaigns, searchQuery, filterStatus, filterType]);

  // ==========================================
  // Edge Case Simulation Handlers
  // ==========================================
  const handleToggleProductUnavailableSimulation = () => {
    if (!isSimulatedUnavailable) {
      // Simulate unlisting product_vitc_101
      if (SPONSORED_PRODUCTS_DB['product_vitc_101']) {
        SPONSORED_PRODUCTS_DB['product_vitc_101'].isPublished = false;
      }
      setIsSimulatedUnavailable(true);
      const res = reconcileProductAvailability();
      refreshData();
      alert(`⚠️ Edge Case Triggered: "Product 20% Vitamin C Serum" was marked Out-of-Stock/Unlisted. System auto-paused ${res.pausedCount} linked active campaign(s) and removed them from the live homepage rotation.`);
    } else {
      // Restore product_vitc_101
      if (SPONSORED_PRODUCTS_DB['product_vitc_101']) {
        SPONSORED_PRODUCTS_DB['product_vitc_101'].isPublished = true;
      }
      setIsSimulatedUnavailable(false);
      // restore campaigns to active
      const cur = getStoredCampaigns().map(c => {
        if (c.product_id === 'product_vitc_101' && c.status === 'paused_product_unavailable') {
          return { ...c, status: 'active' as const };
        }
        return c;
      });
      setCampaigns(cur);
      localStorage.setItem('nexora_sponsored_campaigns', JSON.stringify(cur));
      refreshData();
      alert(`✓ Product restored to active catalog. Campaigns auto-resumed.`);
    }
  };

  const handleSimulateZeroBalance = () => {
    if (balance > 0) {
      setAdAccountBalance(0);
      setBalance(0);
      alert(`⚠️ Budget Expiry Triggered: Ad Credit Balance reached $0.00. Campaigns have been auto-paused until balance is replenished.`);
    } else {
      setAdAccountBalance(41000);
      setBalance(41000);
      alert(`✓ Balance topped up to $500 (₹41,000). Campaigns are now funded.`);
    }
  };

  // Open Campaign Creator
  const handleOpenCreateModal = (campaignToEdit?: AdCampaignItem, initialType?: 'image_ad' | 'reel_or_short' | 'full_video') => {
    if (campaignToEdit) {
      setEditingCampaignId(campaignToEdit.id);
      setFormCreativeType(campaignToEdit.creativeType || 'image_ad');
      setFormName(campaignToEdit.campaignName);
      setFormObjective(campaignToEdit.objective);
      setFormTargetType(campaignToEdit.targetType);
      setFormProductId(campaignToEdit.product_id);
      setFormHeadline(campaignToEdit.adTitle);
      setFormSubtitle(campaignToEdit.subtitle);
      setFormImageUrl(campaignToEdit.imageUrl);
      setFormVideoUrl(campaignToEdit.videoUrl || '');
      setFormVideoPlatform((campaignToEdit.videoPlatform as VideoPlatform) || 'YouTube');
      setFormCtaText(campaignToEdit.ctaText);
      setFormCtaType(campaignToEdit.ctaType || 'product_detail');
      setFormCategories(campaignToEdit.targetCategories);
      setFormKeywordsInput(campaignToEdit.keywords.join(', '));
      setFormDailyBudget(Math.round(campaignToEdit.dailyBudget / 82) || 25);
      setFormTotalBudget(Math.round(campaignToEdit.totalBudget / 82) || 500);
      setFormIsContinuous(campaignToEdit.isContinuous);
      setFormStartDate(campaignToEdit.startDate);
      setFormEndDate(campaignToEdit.endDate);
    } else {
      setEditingCampaignId(null);
      setFormCreativeType(initialType || 'image_ad');
      setFormName(initialType === 'reel_or_short' ? 'Cleanroom Batching Reel Promo' : initialType === 'full_video' ? 'Facility Tour 16:9 Video' : 'Monsoon Active Serum Campaign');
      setFormObjective('Boost Product Sales');
      setFormTargetType('product');
      setFormProductId('product_vitc_101');
      setFormHeadline(initialType === 'reel_or_short' ? 'High Throughput Cleanroom Batching' : initialType === 'full_video' ? '32,000 Sq.Ft GMP Plant Walkthrough' : 'Clinical 20% Vitamin C Glow Serum Base');
      setFormSubtitle('WHO-GMP Manufactured Bulk Supply for Salon Chains & Distributors');
      setFormImageUrl(PRESET_SAMPLE_IMAGES[0].url);
      setFormVideoUrl(initialType === 'reel_or_short' ? 'https://www.youtube.com/shorts/sample_aura_reel' : initialType === 'full_video' ? 'https://www.youtube.com/watch?v=sample_tour' : '');
      setFormVideoPlatform('YouTube');
      setFormCtaText('Get Quote');
      setFormCtaType('product_detail');
      setFormCategories(['Skincare', 'OEM / Private Label']);
      setFormKeywordsInput('vitamin c, serum, bulk, oem, salon supply');
      setFormDailyBudget(25);
      setFormTotalBudget(500);
      setFormIsContinuous(true);
      setFormStartDate('2026-08-18');
      setFormEndDate('2026-09-18');
    }
    setUploadedFileName(null);
    setFileUploadError(null);
    setShowCreateModal(true);
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError('File size exceeds 5MB limit. Please upload an image under 5MB.');
      return;
    }
    setFileUploadError(null);
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Video URL Change
  const handleVideoUrlChange = (url: string) => {
    setFormVideoUrl(url);
    if (!url.trim()) return;
    const detected = detectPlatformFromUrl(url);
    setFormVideoPlatform(detected.platform);
    if (detected.platform === 'YouTube' && detected.videoId) {
      setFormImageUrl(`https://img.youtube.com/vi/${detected.videoId}/hqdefault.jpg`);
    }
  };

  // Save Campaign Handler
  const handleSaveCampaign = (launchNow: boolean) => {
    if (!formName.trim() || !formHeadline.trim()) {
      alert('Please fill in Campaign Name and Headline.');
      return;
    }

    if (formCreativeType !== 'image_ad' && !formVideoUrl.trim()) {
      alert('Please provide a valid video URL (YouTube Shorts, Reels, X, or LinkedIn).');
      return;
    }

    const keywordsArray = formKeywordsInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const isUnavailable = formTargetType === 'product' && selectedProductData && (!selectedProductData.isPublished || selectedProductData.isSuspended);

    let initialStatus: AdCampaignItem['status'] = 'draft';
    if (launchNow) {
      if (balance <= 0) {
        initialStatus = 'budget_depleted';
      } else if (isUnavailable) {
        initialStatus = 'paused_product_unavailable';
      } else {
        initialStatus = 'active';
      }
    }

    const destinationUrl = formCtaType === 'product_detail'
      ? `/product/${formProductId}`
      : formCtaType === 'supplier_profile'
      ? `/supplier/${supplierId}`
      : `/rfq/create?product=${formProductId}`;

    const newCampaign: AdCampaignItem = {
      id: editingCampaignId || `camp-${Date.now()}`,
      advertiser_id: `adv_${supplierId}`,
      seller_id: supplierId,
      product_id: formProductId,
      supplierName: supplierName,
      campaignName: formName,
      creativeType: formCreativeType,
      objective: formObjective,
      targetType: formTargetType,
      adTitle: formHeadline,
      subtitle: formSubtitle,
      imageUrl: formImageUrl,
      videoUrl: formVideoUrl || undefined,
      videoPlatform: formCreativeType !== 'image_ad' ? formVideoPlatform : undefined,
      targetCategories: formCategories,
      keywords: keywordsArray,
      ctaText: formCtaText,
      ctaType: formCtaType,
      destinationUrl,
      dailyBudget: formDailyBudget * 82,
      totalBudget: formTotalBudget * 82,
      spentBudget: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.spentBudget || 0) : 0,
      remainingBalance: formTotalBudget * 82,
      impressions: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.impressions || 0) : 0,
      clicks: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.clicks || 0) : 0,
      productClicks: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.productClicks || 0) : 0,
      profileClicks: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.profileClicks || 0) : 0,
      rfqsGenerated: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.rfqsGenerated || 0) : 0,
      ctr: editingCampaignId ? (campaigns.find(c => c.id === editingCampaignId)?.ctr || 0) : 0,
      videoStats: formCreativeType !== 'image_ad' ? {
        watched25: 78,
        watched50: 62,
        watched75: 48,
        watched100: 35,
        avgWatchTime: formCreativeType === 'reel_or_short' ? '0:24s' : '1:32s'
      } : undefined,
      startDate: formStartDate,
      endDate: formEndDate,
      isContinuous: formIsContinuous,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      placements: ['homepage', 'search_results', 'category_page']
    };

    saveSingleCampaign(newCampaign);

    // If video type, also sync to reels or full videos store for instant homepage preview
    if (formCreativeType === 'reel_or_short' && formVideoUrl) {
      const detected = detectPlatformFromUrl(formVideoUrl);
      saveSponsoredReel({
        video_ad_id: newCampaign.id,
        advertiser_id: `adv_${supplierId}`,
        seller_id: supplierId,
        product_id: formProductId,
        supplierName: supplierName,
        platform: detected.platform,
        source_url: formVideoUrl,
        embed_url: detected.embedUrl,
        media_type: 'reel_or_short',
        poster_url: formImageUrl,
        display_title: formHeadline,
        display_description: formSubtitle,
        duration: '0:30',
        status: newCampaign.status
      });
    } else if (formCreativeType === 'full_video' && formVideoUrl) {
      const detected = detectPlatformFromUrl(formVideoUrl);
      saveSponsoredFullVideo({
        video_ad_id: newCampaign.id,
        advertiser_id: `adv_${supplierId}`,
        seller_id: supplierId,
        product_id: formProductId,
        supplierName: supplierName,
        platform: detected.platform,
        source_url: formVideoUrl,
        embed_url: detected.embedUrl,
        media_type: 'full_video',
        poster_url: formImageUrl,
        display_title: formHeadline,
        display_description: formSubtitle,
        duration: '2:15',
        status: newCampaign.status
      });
    }

    refreshData();
    setShowCreateModal(false);

    if (launchNow) {
      if (initialStatus === 'paused_product_unavailable') {
        alert(`Campaign saved but set to "Paused — Linked Product Unavailable" because the selected product is unlisted.`);
      } else if (initialStatus === 'budget_depleted') {
        alert(`Campaign saved but auto-paused because your Ad Balance is $0.00. Please top up to activate.`);
      } else {
        alert(`🎉 Campaign "${formName}" launched successfully! Live across Nexora Luxe.`);
      }
    } else {
      alert(`💾 Campaign draft "${formName}" saved.`);
    }
  };

  return (
    <div className="space-y-6 text-[#1c1b1b]">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER & CREDITS REMAINING */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-stone-900 via-neutral-900 to-stone-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#b90064]/20 border border-[#b90064]/40 text-[#f7c5e0]">
              <Sparkles className="w-4 h-4 text-[#f7c5e0]" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#f7c5e0]">
              Screen 25 — Sponsored Ad Campaign Manager
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Targeted B2B Sourcing Campaigns
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            Promote your cosmetic manufacturing capabilities, certified batch formulations, and wholesale packaging across high-intent search, homepage marquee slots, and video carousels.
          </p>
        </div>

        {/* CREDIT WALLET CARD */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl flex flex-col items-end gap-3 shrink-0 z-10 w-full md:w-auto">
          <div className="flex items-center justify-between w-full md:w-auto gap-6">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-stone-300 tracking-wider block">
                Credits Remaining
              </span>
              <span className="text-2xl font-black text-white block tracking-tight">
                {formatCurrency(balanceUsd, balance)}
              </span>
            </div>

            {/* Currency switcher */}
            <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10 text-[10px] font-bold">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${currency === 'USD' ? 'bg-[#b90064] text-white' : 'text-stone-300 hover:text-white'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${currency === 'INR' ? 'bg-[#b90064] text-white' : 'text-stone-300 hover:text-white'}`}
              >
                INR (₹)
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex-1 md:flex-none bg-white text-[#1c1b1b] hover:bg-stone-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5 text-[#b90064]" />
              <span>Top Up Credits</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal(undefined, 'image_ad')}
              className="flex-1 md:flex-none bg-[#b90064] hover:bg-[#a00056] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTOMATED EDGE CASE ALERT BANNER */}
      {/* ========================================================================= */}
      {activeAlertMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-amber-900">{activeAlertMessage}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Ads linking to inactive products are immediately hidden from the public marketplace to protect buyer trust.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const unavCamp = campaigns.find(c => c.status === 'paused_product_unavailable');
              if (unavCamp) handleOpenCreateModal(unavCamp);
              else handleOpenCreateModal();
            }}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Re-link Product Now
          </button>
        </div>
      )}

      {/* Budget Depleted Banner */}
      {balance <= 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-900">Budget Depleted — All Campaigns Auto-Paused</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Your remaining credit balance is $0.00. Add credits to instantly resume active rotations.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTopUpModal(true)}
            className="shrink-0 bg-[#b90064] hover:bg-[#a00056] text-white font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Add $100 Credits
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CAMPAIGN OVERVIEW & ANALYTICS TOP CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Total Ad Spend & Credits */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#594047] font-extrabold uppercase tracking-wider">
                Total Ad Spend
              </span>
              <DollarSign className="w-4 h-4 text-[#b90064]" />
            </div>
            <div className="text-2xl font-black text-zinc-950 mt-1">
              {formatCurrency(totalSpentUsd)}
            </div>
            <p className="text-[11px] text-[#594047] mt-0.5">
              Credits Remaining: <b className="text-emerald-700">{formatCurrency(balanceUsd, balance)}</b>
            </p>
          </div>

          {/* Interactive Sparkline */}
          <InteractiveSparkline 
            data={spendTrendData}
            color="#b90064"
            metricPrefix={currency === 'USD' ? '$' : '₹'}
          />

          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#b90064] h-full transition-all" 
              style={{ width: `${Math.min(100, (totalSpentUsd / (totalSpentUsd + balanceUsd || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* CARD 2: Total Impressions (>1s Viewport Logged) */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#594047] font-extrabold uppercase tracking-wider">
                Total Impressions
              </span>
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-zinc-950 mt-1">
              {totalImpressions.toLocaleString('en-IN')}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-200">
              <Clock className="w-3 h-3 text-emerald-600" />
              <span>Logged Viewport &gt;1s Only</span>
            </div>
          </div>

          {/* Interactive Sparkline */}
          <InteractiveSparkline 
            data={impressionsTrendData}
            color="#0050d6"
          />

          <span className="text-[10px] text-[#594047]">100% MRC Validated Viewability</span>
        </div>

        {/* CARD 3: Total Clicks & Direct Leads Breakdown */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#594047] font-extrabold uppercase tracking-wider">
                Clicks & Direct Leads
              </span>
              <MousePointer className="w-4 h-4 text-[#b90064]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#b90064]">
                {totalClicks.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-stone-500">
                ({((totalClicks / (totalImpressions || 1)) * 100).toFixed(2)}% CTR)
              </span>
            </div>
          </div>

          {/* Interactive Sparkline */}
          <InteractiveSparkline 
            data={clicksTrendData}
            color="#b90064"
          />

          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-100 text-[10px]">
            <div className="text-center bg-stone-50 p-1 rounded">
              <span className="text-stone-400 block text-[9px]">Product</span>
              <span className="font-bold text-stone-900">{totalProductClicks}</span>
            </div>
            <div className="text-center bg-stone-50 p-1 rounded">
              <span className="text-stone-400 block text-[9px]">Profile</span>
              <span className="font-bold text-stone-900">{totalProfileClicks}</span>
            </div>
            <div className="text-center bg-pink-50 text-[#b90064] p-1 rounded border border-pink-100">
              <span className="block text-[9px]">RFQs</span>
              <span className="font-bold">{totalRfqsGenerated}</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Video Engagement Stats (25%, 50%, 75%, 100%) */}
        <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-3 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#594047] font-extrabold uppercase tracking-wider">
                Video Completion Stats
              </span>
              <Film className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-stone-800">Reels & 16:9 Videos</span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">Avg: 0:24s</span>
            </div>
          </div>

          {/* Interactive Sparkline */}
          <InteractiveSparkline 
            data={videoEngagementTrendData}
            color="#9333ea"
            metricSuffix="%"
          />

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between items-center text-stone-600">
              <span>25% Watched</span>
              <span className="font-bold text-stone-900">78%</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>50% Watched</span>
              <span className="font-bold text-stone-900">62%</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>75% Watched</span>
              <span className="font-bold text-stone-900">48%</span>
            </div>
            <div className="flex justify-between items-center text-stone-600 font-bold text-emerald-700">
              <span>100% Completed</span>
              <span>35%</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CREATIVE PLACEMENT SELECTOR STRIP & SIMULATION CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e8e8] p-4 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Creative Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-[#594047] uppercase tracking-wider mr-1">
            Create Placement:
          </span>

          <button
            onClick={() => handleOpenCreateModal(undefined, 'image_ad')}
            className="bg-stone-100 hover:bg-[#fde7f3] hover:text-[#b90064] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-200"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#b90064]" />
            <span>Part 1: Marquee Image Ad</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal(undefined, 'reel_or_short')}
            className="bg-stone-100 hover:bg-purple-50 hover:text-purple-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-200"
          >
            <Film className="w-3.5 h-3.5 text-purple-600" />
            <span>Part 2: 9:16 Short Video / Reel</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal(undefined, 'full_video')}
            className="bg-stone-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-200"
          >
            <Video className="w-3.5 h-3.5 text-blue-600" />
            <span>Part 3: 16:9 Full Showcase Video</span>
          </button>
        </div>

        {/* Edge Case Simulation Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleToggleProductUnavailableSimulation}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              isSimulatedUnavailable 
                ? 'bg-amber-600 text-white border-amber-600' 
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
            title="Simulates an advertised product being deleted or marked out-of-stock"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSimulatedUnavailable ? 'Restore Active Product' : 'Simulate Out-of-Stock'}</span>
          </button>

          <button
            onClick={handleSimulateZeroBalance}
            className="px-3 py-1.5 rounded-lg font-bold bg-stone-50 text-stone-700 border border-stone-300 hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-1.5"
            title="Simulate credit exhaustion ($0.00 balance)"
          >
            <Wallet className="w-3.5 h-3.5 text-stone-500" />
            <span>{balance <= 0 ? 'Restore $500 Credit' : 'Simulate $0 Balance'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FILTER, SEARCH & ACTIVE CAMPAIGNS TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e8e8] p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Campaigns' },
              { id: 'active', label: 'Active' },
              { id: 'paused', label: 'Paused' },
              { id: 'unavailable', label: 'Product Unavailable' },
              { id: 'draft', label: 'Drafts' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id as typeof filterStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === st.id
                    ? 'bg-[#b90064] text-white shadow-xs'
                    : 'bg-stone-100 text-[#594047] hover:bg-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Type Filter & Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="bg-[#fdf8f8] border border-[#e8e8e8] text-xs font-bold text-stone-700 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#b90064]"
            >
              <option value="all">All Creative Types</option>
              <option value="image_ad">Marquee Image</option>
              <option value="reel_or_short">9:16 Reels</option>
              <option value="full_video">16:9 Full Videos</option>
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#594047] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns, products, or IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#fdf8f8] border border-[#e8e8e8] rounded-lg focus:outline-none focus:border-[#b90064]"
              />
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-[#e8e8e8] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-[#e8e8e8] text-[11px] font-extrabold uppercase tracking-wider text-[#594047]">
                  <th className="p-3.5">1. Ad Preview & Type</th>
                  <th className="p-3.5">2. Linked Asset</th>
                  <th className="p-3.5">3. Status Badge</th>
                  <th className="p-3.5">4. Performance Summary</th>
                  <th className="p-3.5 text-right">5. Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#594047]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
                        <p className="font-bold text-sm text-zinc-800">No campaigns match filters</p>
                        <p className="text-xs text-[#594047]">Adjust your filters or launch a new campaign to begin driving B2B leads.</p>
                        <button
                          onClick={() => handleOpenCreateModal()}
                          className="mt-2 bg-[#b90064] text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                        >
                          Create New Campaign
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map(c => {
                    const cType = c.creativeType || 'image_ad';
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/80 transition-colors">
                        
                        {/* 1. AD PREVIEW & TYPE */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={c.imageUrl}
                                alt={c.adTitle}
                                className={`object-cover rounded-lg border border-stone-200 ${
                                  cType === 'reel_or_short' ? 'w-10 h-14 aspect-[9/16]' : 'w-14 h-10'
                                }`}
                              />
                              {cType === 'reel_or_short' && (
                                <span className="absolute -top-1 -right-1 bg-purple-600 text-white p-0.5 rounded-full shadow-xs">
                                  <Film className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {cType === 'full_video' && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full shadow-xs">
                                  <Video className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  cType === 'image_ad' ? 'bg-pink-50 text-[#b90064] border border-pink-200' :
                                  cType === 'reel_or_short' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {cType === 'image_ad' ? 'Marquee Image' : cType === 'reel_or_short' ? '9:16 Reel' : '16:9 Video'}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">#{c.id.slice(-6)}</span>
                              </div>
                              <p className="font-bold text-zinc-900 truncate text-xs">{c.campaignName}</p>
                              <p className="text-[11px] text-[#594047] truncate">{c.adTitle}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. LINKED ASSET */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-zinc-900 font-bold">
                              {c.targetType === 'product' ? (
                                <>
                                  <span className="truncate max-w-[180px]">
                                    {SPONSORED_PRODUCTS_DB[c.product_id]?.title || c.product_id}
                                  </span>
                                </>
                              ) : (
                                <span>{supplierName} Profile</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-stone-500 font-mono">
                              <LinkIcon className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[160px]">
                                {c.destinationUrl || (c.targetType === 'product' ? `/product/${c.product_id}` : `/supplier/${c.seller_id}`)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                                CTA: {c.ctaText}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. STATUS BADGE */}
                        <td className="p-3.5 whitespace-nowrap">
                          {c.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {c.status === 'paused_product_unavailable' && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[9.5px] font-black uppercase">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Paused — Linked Product Unavailable
                              </span>
                              <button
                                onClick={() => handleOpenCreateModal(c)}
                                className="text-[10px] text-[#b90064] hover:underline font-bold block cursor-pointer"
                              >
                                Re-link Product →
                              </button>
                            </div>
                          )}
                          {c.status === 'paused' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold uppercase">
                              <Pause className="w-3 h-3" />
                              Paused
                            </span>
                          )}
                          {c.status === 'budget_depleted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                              Budget Depleted
                            </span>
                          )}
                          {c.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                              Completed
                            </span>
                          )}
                          {c.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 border border-stone-200 text-[10px] font-bold uppercase">
                              Draft
                            </span>
                          )}
                        </td>

                        {/* 4. PERFORMANCE SUMMARY */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">{c.impressions.toLocaleString('en-IN')}</span>
                              <span className="text-stone-400">impr</span>
                              <span className="text-stone-300">|</span>
                              <span className="font-bold text-[#b90064]">{c.clicks.toLocaleString('en-IN')}</span>
                              <span className="text-stone-400">clicks</span>
                              <span className="text-stone-300">|</span>
                              <span className="font-bold text-emerald-600">{c.ctr}%</span>
                              <span className="text-stone-400">CTR</span>
                            </div>
                            <div className="text-[10px] text-[#594047]">
                              RFQs Generated: <b className="text-purple-700">{c.rfqsGenerated || Math.round(c.clicks * 0.1)} direct leads</b>
                            </div>
                          </div>
                        </td>

                        {/* 5. ACTIONS DROPDOWN / BUTTONS */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            
                            {/* Analytics Breakdown */}
                            <button
                              onClick={() => setAnalyticsDetailCampaign(c)}
                              title="View Analytics Breakdown"
                              className="p-1.5 text-stone-600 hover:text-[#b90064] hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>

                            {/* Live Ad Preview */}
                            <button
                              onClick={() => setPreviewModalCampaign(c)}
                              title="Preview Ad In Context"
                              className="p-1.5 text-stone-600 hover:text-blue-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenCreateModal(c)}
                              title="Edit Campaign Details & Link"
                              className="p-1.5 text-stone-600 hover:text-purple-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Pause / Resume */}
                            {c.status !== 'draft' && c.status !== 'paused_product_unavailable' && (
                              <button
                                onClick={() => {
                                  toggleCampaignStatus(c.id);
                                  refreshData();
                                }}
                                title={c.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                                className="p-1.5 text-stone-600 hover:text-amber-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              >
                                {c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete campaign "${c.campaignName}"?`)) {
                                  deleteCampaignFromStore(c.id);
                                  refreshData();
                                }
                              }}
                              title="Delete Campaign"
                              className="p-1.5 text-stone-600 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. CREATE & EDIT CAMPAIGN MODAL WITH 3 PLACEMENT OPTIONS */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-[#e8e8e8] flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fde7f3] border border-[#f7c5e0] flex items-center justify-center text-[#b90064]">
                  <Sparkles className="w-4 h-4 text-[#b90064]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900">
                    {editingCampaignId ? 'Edit Sponsored Campaign' : 'Create Sponsored Ad Campaign'}
                  </h3>
                  <p className="text-xs text-[#594047]">Configure creative placement, destination link, auto-validation, and budget.</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split Form & Live Preview */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT FORM (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. CREATIVE PLACEMENT SELECTION */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>1. Select Creative Placement Slot</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormCreativeType('image_ad')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        formCreativeType === 'image_ad' 
                          ? 'border-[#b90064] bg-[#fde7f3]/50 ring-2 ring-[#b90064]/20' 
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-[#b90064]" />
                      <div className="font-extrabold text-xs text-stone-900">Part 1: Marquee</div>
                      <div className="text-[10px] text-stone-500 leading-tight">Hero banner linked to 1 Product ID</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCreativeType('reel_or_short')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        formCreativeType === 'reel_or_short' 
                          ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20' 
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <Film className="w-4 h-4 text-purple-600" />
                      <div className="font-extrabold text-xs text-stone-900">Part 2: 9:16 Reel</div>
                      <div className="text-[10px] text-stone-500 leading-tight">YouTube Shorts, IG/FB Reels, X</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormCreativeType('full_video')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        formCreativeType === 'full_video' 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' 
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <Video className="w-4 h-4 text-blue-600" />
                      <div className="font-extrabold text-xs text-stone-900">Part 3: 16:9 Video</div>
                      <div className="text-[10px] text-stone-500 leading-tight">YouTube / Vimeo Widescreen</div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Q3 Certified Active Serum Sourcing Campaign"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* 2. LINKED ENTITY & ATTRIBUTION (PRODUCT AUTO-VALIDATION) */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>2. Linked Entity & Product Auto-Validation</span>
                  </h4>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="product"
                        checked={formTargetType === 'product'}
                        onChange={() => setFormTargetType('product')}
                        className="accent-[#b90064]"
                      />
                      <span>Specific Product ID</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="profile"
                        checked={formTargetType === 'profile'}
                        onChange={() => setFormTargetType('profile')}
                        className="accent-[#b90064]"
                      />
                      <span>Supplier Profile (/supplier/{supplierId})</span>
                    </label>
                  </div>

                  {formTargetType === 'product' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-800">
                        Select Catalogue Product
                      </label>
                      <select
                        value={formProductId}
                        onChange={(e) => setFormProductId(e.target.value)}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                      >
                        {Object.values(SPONSORED_PRODUCTS_DB).map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.title} ({prod.id} • {prod.supplierName})
                          </option>
                        ))}
                      </select>

                      {/* Auto Validation Indicator */}
                      <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        productValidationResult.status === 'valid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        productValidationResult.status === 'unavailable' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {productValidationResult.status === 'valid' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-bold">{productValidationResult.message}</span>
                      </div>
                    </div>
                  )}

                  {/* CTA Configuration */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">CTA Action Destination</label>
                      <select
                        value={formCtaType}
                        onChange={(e) => setFormCtaType(e.target.value as typeof formCtaType)}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                      >
                        <option value="product_detail">Direct Product Detail URL</option>
                        <option value="supplier_profile">Direct Supplier Profile URL</option>
                        <option value="quick_rfq">Quick RFQ Modal Trigger</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Button Label</label>
                      <select
                        value={formCtaText}
                        onChange={(e) => setFormCtaText(e.target.value as AdCampaignItem['ctaText'])}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-medium"
                      >
                        <option value="Get Quote">Get Quote</option>
                        <option value="View Product">View Product</option>
                        <option value="Explore Brand">Explore Brand</option>
                        <option value="Request Sample">Request Sample</option>
                        <option value="Contact Supplier">Contact Supplier</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. CREATIVE ASSET & AD COPY */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>3. Creative Asset & Copy</span>
                  </h4>

                  {/* Video URL input for Reel or Full Video */}
                  {formCreativeType !== 'image_ad' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">
                        {formCreativeType === 'reel_or_short' ? '9:16 Short Video / Reel URL' : '16:9 Showcase Video URL'}
                      </label>
                      <input
                        type="text"
                        value={formVideoUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs font-mono"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        Detected Platform: <b className="text-stone-900">{formVideoPlatform}</b>
                      </p>
                    </div>
                  )}

                  {/* Image Poster / Banner upload */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      {formCreativeType === 'image_ad' ? 'Banner Image Asset' : 'Video Thumbnail Poster'}
                    </label>
                    <div className="border-2 border-dashed border-stone-300 hover:border-[#b90064] bg-white rounded-xl p-4 text-center transition-colors relative cursor-pointer group">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-5 h-5 text-stone-400 group-hover:text-[#b90064] mx-auto mb-1 transition-colors" />
                      <p className="text-xs font-bold text-zinc-800">
                        {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Click or Drag & Drop Image Asset'}
                      </p>
                      <p className="text-[10px] text-[#594047] mt-0.5">PNG, JPG, WebP under 5MB</p>
                    </div>
                  </div>

                  {/* Preset Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#594047] mb-1">Or choose preset photo:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_SAMPLE_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormImageUrl(img.url);
                            setUploadedFileName(null);
                          }}
                          className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            formImageUrl === img.url ? 'border-[#b90064] ring-2 ring-[#b90064]/20' : 'border-stone-200'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold truncate px-1 text-center">
                            {img.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Headline & Subtitle */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Headline Title</label>
                    <input
                      type="text"
                      value={formHeadline}
                      onChange={(e) => setFormHeadline(e.target.value)}
                      placeholder="e.g. Professional 20% Vitamin C Glow Serum Base"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Subtitle / Value Proposition</label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="e.g. Bulk sourcing for salon chains & cosmetic brand distributors"
                      className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* 4. BUDGET & DURATION */}
                <div className="space-y-3 bg-[#fdf8f8] p-4 rounded-xl border border-[#e8e8e8]">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#b90064] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>4. Budget & Schedule</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Daily Budget ($)</label>
                      <input
                        type="number"
                        min="5"
                        value={formDailyBudget}
                        onChange={(e) => setFormDailyBudget(Number(e.target.value))}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1">Total Cap Budget ($)</label>
                      <input
                        type="number"
                        min="50"
                        value={formTotalBudget}
                        onChange={(e) => setFormTotalBudget(Number(e.target.value))}
                        className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT LIVE PREVIEW (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-stone-600 tracking-wider">
                      Live Placement Preview
                    </h4>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Interactive Preview
                    </span>
                  </div>

                  {/* Marquee Ad Preview Card */}
                  {formCreativeType === 'image_ad' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-4 space-y-3">
                      <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-stone-100">
                        <img src={formImageUrl} alt={formHeadline} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-xs">
                          Sponsored Marquee
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-[#b90064] font-extrabold uppercase tracking-wider">
                          {supplierName} • Verified OEM
                        </span>
                        <h4 className="font-extrabold text-sm text-stone-900 leading-tight">
                          {formHeadline || 'Your Ad Headline Appears Here'}
                        </h4>
                        <p className="text-xs text-stone-600 line-clamp-2">
                          {formSubtitle || 'Your value proposition description appears here.'}
                        </p>
                      </div>

                      <button className="w-full bg-[#b90064] text-white text-xs font-extrabold py-2.5 rounded-xl shadow-xs">
                        {formCtaText} →
                      </button>
                    </div>
                  )}

                  {/* 9:16 Reel Preview */}
                  {formCreativeType === 'reel_or_short' && (
                    <div className="bg-zinc-950 text-white rounded-2xl border border-stone-800 shadow-xl overflow-hidden max-w-[240px] mx-auto aspect-[9/16] relative flex flex-col justify-between p-3.5">
                      <img src={formImageUrl} alt={formHeadline} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      
                      <div className="relative z-10 flex justify-between items-center">
                        <span className="bg-purple-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">
                          Sponsored Reel
                        </span>
                        <Film className="w-4 h-4 text-white" />
                      </div>

                      <div className="relative z-10 space-y-2">
                        <p className="text-xs font-bold leading-snug drop-shadow-md">
                          {formHeadline || 'Reel Headline'}
                        </p>
                        <button className="w-full bg-[#b90064] text-white text-[11px] font-extrabold py-2 rounded-lg shadow-sm">
                          {formCtaText}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 16:9 Showcase Preview */}
                  {formCreativeType === 'full_video' && (
                    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-4 space-y-3">
                      <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-stone-900 flex items-center justify-center">
                        <img src={formImageUrl} alt={formHeadline} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute w-10 h-10 rounded-full bg-[#b90064] text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">
                          16:9 Video Showcase
                        </span>
                        <h4 className="font-extrabold text-sm text-stone-900">
                          {formHeadline || 'Full Video Title'}
                        </h4>
                      </div>

                      <button className="w-full bg-[#b90064] text-white text-xs font-extrabold py-2.5 rounded-xl">
                        {formCtaText}
                      </button>
                    </div>
                  )}

                  {/* Est daily metrics */}
                  <div className="bg-[#fcf9f8] p-3.5 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <span className="font-extrabold text-[10px] text-stone-500 uppercase tracking-wider block">
                      Estimated Daily Delivery
                    </span>
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>Daily Reach</span>
                      <span className="text-[#b90064]">~{Math.round(formDailyBudget * 80)} impressions</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>Est. Direct RFQs</span>
                      <span className="text-purple-700">~{Math.max(1, Math.round(formDailyBudget * 0.15))} bids/wk</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#e8e8e8] bg-stone-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveCampaign(false)}
                  className="px-4 py-2 text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg cursor-pointer transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveCampaign(true)}
                  className="px-5 py-2 text-xs font-bold bg-[#b90064] hover:bg-[#a00056] text-white rounded-lg cursor-pointer transition-all shadow-sm"
                >
                  {editingCampaignId ? 'Update & Launch' : 'Launch Campaign'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ANALYTICS BREAKDOWN MODAL */}
      {/* ========================================================================= */}
      {analyticsDetailCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            
            <div className="p-4 md:p-5 border-b border-[#e8e8e8] flex items-center justify-between bg-stone-50 shrink-0">
              <div>
                <span className="text-[10px] text-[#b90064] font-extrabold uppercase tracking-wider">
                  Attribution & Performance Analytics
                </span>
                <h3 className="font-extrabold text-base text-zinc-900">
                  {analyticsDetailCampaign.campaignName}
                </h3>
              </div>
              <button
                onClick={() => setAnalyticsDetailCampaign(null)}
                className="text-stone-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Top Key Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Impressions</span>
                  <span className="text-lg font-black text-stone-900">{analyticsDetailCampaign.impressions.toLocaleString()}</span>
                  <span className="text-[9px] text-emerald-600 font-bold block">&gt;1s Viewport</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Clicks</span>
                  <span className="text-lg font-black text-[#b90064]">{analyticsDetailCampaign.clicks.toLocaleString()}</span>
                  <span className="text-[9px] text-stone-500 font-bold block">{analyticsDetailCampaign.ctr}% CTR</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Product Views</span>
                  <span className="text-lg font-black text-blue-700">{analyticsDetailCampaign.productClicks || Math.round(analyticsDetailCampaign.clicks * 0.65)}</span>
                  <span className="text-[9px] text-stone-500 font-bold block">Direct PDP</span>
                </div>

                <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 text-center">
                  <span className="text-[10px] text-[#b90064] uppercase font-bold block">RFQs Generated</span>
                  <span className="text-lg font-black text-[#b90064]">{analyticsDetailCampaign.rfqsGenerated || Math.round(analyticsDetailCampaign.clicks * 0.1)}</span>
                  <span className="text-[9px] text-[#b90064] font-bold block">Converted Leads</span>
                </div>
              </div>

              {/* Video Engagement if applicable */}
              {analyticsDetailCampaign.videoStats && (
                <div className="bg-[#fdf8f8] border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-purple-600" />
                      <span>Video Retention Funnel</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-bold">
                      Avg Watch Time: {analyticsDetailCampaign.videoStats.avgWatchTime}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">25%</span>
                      <span className="font-black text-stone-900">{analyticsDetailCampaign.videoStats.watched25}%</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">50%</span>
                      <span className="font-black text-stone-900">{analyticsDetailCampaign.videoStats.watched50}%</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-stone-200">
                      <span className="text-[10px] text-stone-400 block">75%</span>
                      <span className="font-black text-stone-900">{analyticsDetailCampaign.videoStats.watched75}%</span>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] block font-bold">100% Full</span>
                      <span className="font-black">{analyticsDetailCampaign.videoStats.watched100}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attribution Path */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
                <span className="font-bold text-stone-900 block">Attribution & Link Target:</span>
                <p className="text-stone-600">
                  Target: <b className="text-stone-900">{analyticsDetailCampaign.targetType === 'product' ? `Product: ${analyticsDetailCampaign.product_id}` : 'Supplier Profile'}</b>
                </p>
                <p className="text-stone-600">
                  Destination URL: <code className="bg-white px-2 py-0.5 rounded border border-stone-200 text-[#b90064]">{analyticsDetailCampaign.destinationUrl || `/product/${analyticsDetailCampaign.product_id}`}</code>
                </p>
              </div>

            </div>

            <div className="p-4 border-t border-[#e8e8e8] bg-stone-50 flex justify-end">
              <button
                onClick={() => setAnalyticsDetailCampaign(null)}
                className="px-4 py-2 bg-stone-900 text-white font-bold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TOP UP MODAL */}
      {/* ========================================================================= */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md p-6 space-y-5 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#b90064]" />
                <h3 className="font-extrabold text-sm text-stone-900">Top Up Ad Account Balance</h3>
              </div>
              <button onClick={() => setShowTopUpModal(false)} className="text-stone-400 hover:text-stone-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-600">
              Select credit amount to deposit into your supplier advertising wallet. Credits never expire.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-black text-sm ${
                    topUpAmount === amt ? 'border-[#b90064] bg-[#fde7f3] text-[#b90064]' : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  ${amt}
                  <span className="block text-[9px] font-normal text-stone-500">₹{(amt * 82).toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                addAdAccountBalance(topUpAmount * 82);
                refreshData();
                setShowTopUpModal(false);
                alert(`✓ Successfully added $${topUpAmount} (₹${(topUpAmount * 82).toLocaleString('en-IN')}) to your advertising balance!`);
              }}
              className="w-full bg-[#b90064] hover:bg-[#a00056] text-white font-extrabold py-3 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              Deposit ${topUpAmount} Credits
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. LIVE AD PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewModalCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">Marketplace In-Context Preview</h3>
              <button onClick={() => setPreviewModalCampaign(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-stone-200 shadow-xs">
              <img src={previewModalCampaign.imageUrl} alt={previewModalCampaign.adTitle} className="w-full h-44 object-cover" />
              <div className="p-4 space-y-2 bg-white">
                <span className="text-[10px] text-[#b90064] font-extrabold uppercase tracking-wider">
                  {previewModalCampaign.supplierName} • Sponsored
                </span>
                <h4 className="font-extrabold text-sm text-stone-900">{previewModalCampaign.adTitle}</h4>
                <p className="text-xs text-stone-600">{previewModalCampaign.subtitle}</p>
                <button className="w-full bg-[#b90064] text-white font-extrabold py-2.5 rounded-lg mt-2">
                  {previewModalCampaign.ctaText}
                </button>
              </div>
            </div>

            <button
              onClick={() => setPreviewModalCampaign(null)}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-lg"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
