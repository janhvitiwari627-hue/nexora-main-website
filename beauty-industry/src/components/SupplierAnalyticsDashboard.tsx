import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Eye, MessageSquare, FileText, CheckCircle2, 
  Clock, Award, MapPin, Zap, ArrowUpRight, ArrowDownRight, Filter, Calendar, 
  Download, ChevronRight, Layers, Sparkles, ExternalLink, ShieldCheck, Share2, 
  Users, DollarSign, Activity, HelpCircle, ArrowRight
} from 'lucide-react';

interface SupplierAnalyticsDashboardProps {
  supplierId?: string;
  supplierName?: string;
  onBoostProduct?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
}

// Sparkline SVG Component
const Sparkline: React.FC<{ data: number[]; color: string; isPositive: boolean }> = ({ data, color, isPositive }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="w-24 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const SupplierAnalyticsDashboard: React.FC<SupplierAnalyticsDashboardProps> = ({
  supplierId = 'seller_aura_001',
  supplierName = 'Aura Beauty Labs',
  onBoostProduct,
  onViewProduct
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [activeChartMetric, setActiveChartMetric] = useState<'all' | 'product_views' | 'profile_views' | 'enquiries' | 'rfqs'>('all');
  const [chartGranularity, setChartGranularity] = useState<'daily' | 'weekly'>('daily');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  // Time multiplier to simulate dynamic values based on dropdown
  const multiplier = useMemo(() => {
    switch (timeRange) {
      case '7d': return 0.25;
      case '90d': return 2.8;
      case 'ytd': return 6.2;
      default: return 1.0;
    }
  }, [timeRange]);

  // Primary KPIs
  const kpiData = useMemo(() => {
    return {
      profileViews: Math.round(1840 * multiplier),
      profileGrowth: '+12.4%',
      profileSparkline: [120, 135, 140, 138, 155, 162, 175, 190, 210, 225],
      
      productViews: Math.round(12450 * multiplier),
      productGrowth: '+8.2%',
      productSparkline: [820, 890, 940, 910, 990, 1050, 1120, 1200, 1280, 1340],
      
      enquiriesReceived: Math.round(342 * multiplier),
      enquiriesGrowth: '+15.1%',
      enquiriesSparkline: [18, 22, 25, 21, 28, 32, 36, 38, 42, 48],
      
      rfqsReceived: Math.round(89 * multiplier),
      rfqsGrowth: '+5.3%',
      rfqsSparkline: [4, 6, 7, 5, 8, 9, 8, 11, 12, 14]
    };
  }, [multiplier]);

  // 30-Day Trend Chart Data points
  const timelineData = useMemo(() => {
    const days = [
      { date: 'Aug 01', pViews: 380, profViews: 55, enq: 10, rfq: 2 },
      { date: 'Aug 04', pViews: 410, profViews: 58, enq: 12, rfq: 3 },
      { date: 'Aug 07', pViews: 440, profViews: 62, enq: 11, rfq: 2 },
      { date: 'Aug 10', pViews: 390, profViews: 54, enq: 9,  rfq: 4 },
      { date: 'Aug 13', pViews: 460, profViews: 68, enq: 14, rfq: 3 },
      { date: 'Aug 16', pViews: 490, profViews: 72, enq: 15, rfq: 5 },
      { date: 'Aug 19', pViews: 530, profViews: 79, enq: 18, rfq: 4 },
      { date: 'Aug 22', pViews: 510, profViews: 74, enq: 13, rfq: 3 },
      { date: 'Aug 25', pViews: 580, profViews: 85, enq: 19, rfq: 6 },
      { date: 'Aug 28', pViews: 620, profViews: 92, enq: 22, rfq: 5 },
      { date: 'Aug 31', pViews: 650, profViews: 98, enq: 24, rfq: 7 }
    ];
    return days;
  }, []);

  // Top Performing Products Listing Data
  const topProducts = [
    {
      id: 'product_vitc_101',
      name: 'Professional 20% Vitamin C Serum Base',
      thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=120&q=80',
      category: 'Skincare',
      views: Math.round(4820 * multiplier),
      enquiries: Math.round(142 * multiplier),
      rfqs: Math.round(38 * multiplier),
      conversionRate: 21.4,
      trend: '+18.2%'
    },
    {
      id: 'product_barrier_102',
      name: 'Hydrating Hyaluronic Barrier Repair Cream',
      thumbnail: 'https://images.unsplash.com/photo-1608248597359-052445bfa3d0?auto=format&fit=crop&w=120&q=80',
      category: 'Skincare',
      views: Math.round(3410 * multiplier),
      enquiries: Math.round(98 * multiplier),
      rfqs: Math.round(24 * multiplier),
      conversionRate: 18.2,
      trend: '+12.5%'
    },
    {
      id: 'product_rosemary_103',
      name: 'Organic Rosemary Scalp Tonic & Follicle Serum',
      thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=120&q=80',
      category: 'Haircare',
      views: Math.round(2150 * multiplier),
      enquiries: Math.round(54 * multiplier),
      rfqs: Math.round(14 * multiplier),
      conversionRate: 16.5,
      trend: '+9.4%'
    },
    {
      id: 'product_dropper_104',
      name: '30ml Amber Glass Dropper Bottle Assembly',
      thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=120&q=80',
      category: 'Packaging',
      views: Math.round(1280 * multiplier),
      enquiries: Math.round(32 * multiplier),
      rfqs: Math.round(8 * multiplier),
      conversionRate: 14.8,
      trend: '+6.1%'
    },
    {
      id: 'product_lip_105',
      name: 'Matte Peptide Lip Tint Custom OEM Bulk',
      thumbnail: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=120&q=80',
      category: 'Color Cosmetics',
      views: Math.round(790 * multiplier),
      enquiries: Math.round(16 * multiplier),
      rfqs: Math.round(5 * multiplier),
      conversionRate: 12.5,
      trend: '+4.0%'
    }
  ];

  // Geographic Breakdown Data
  const regionalDemand = [
    { city: 'Mumbai, Maharashtra', percentage: 34, enquiries: Math.round(116 * multiplier), growth: '+22%' },
    { city: 'Delhi NCR (Gurugram & Noida)', percentage: 28, enquiries: Math.round(96 * multiplier), growth: '+18%' },
    { city: 'Bengaluru, Karnataka', percentage: 18, enquiries: Math.round(62 * multiplier), growth: '+14%' },
    { city: 'Hyderabad, Telangana', percentage: 12, enquiries: Math.round(41 * multiplier), growth: '+9%' },
    { city: 'Pune, Maharashtra', percentage: 8, enquiries: Math.round(27 * multiplier), growth: '+7%' }
  ];

  // Lead Funnel Steps
  const funnelSteps = [
    { stage: '1. Enquiries Received', count: Math.round(342 * multiplier), rate: '100%', note: 'Direct buyer inquiries' },
    { stage: '2. Responded', count: Math.round(321 * multiplier), rate: '93.8%', note: 'Within 2.4 hours' },
    { stage: '3. Qualified', count: Math.round(198 * multiplier), rate: '61.7%', note: 'Verified MOQ & Specs' },
    { stage: '4. Quote Sent', count: Math.round(64 * multiplier), rate: '32.3%', note: 'Commercial terms delivered' },
    { stage: '5. In Negotiation', count: Math.round(28 * multiplier), rate: '43.8%', note: 'Sample / contract review' },
    { stage: '6. Business Connected', count: Math.round(12 * multiplier), rate: '42.9%', note: 'Active recurring B2B buyer' }
  ];

  return (
    <div className="space-y-6 text-[#1c1b1b]">
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-zinc-950 tracking-tight">
              Supplier Analytics & Business Insights
            </h2>
            <span className="bg-[#fde7f3] text-[#b90064] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#f7c5e0]">
              Screen 25
            </span>
          </div>
          <p className="text-xs text-[#594047]">
            Track listing performance, lead conversions, buyer engagement, and geographic demand.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Time Range Dropdown */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="bg-[#fdf8f8] hover:bg-[#fcf9f8] border border-[#e8e8e8] text-xs font-extrabold text-stone-800 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#b90064] cursor-pointer shadow-2xs transition-colors"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days (Default)</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#fdf8f8] hover:bg-[#fcf9f8] border border-[#e8e8e8] text-xs font-extrabold text-stone-800 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-[#b90064] cursor-pointer shadow-2xs transition-colors"
            >
              <option value="All Categories">All Categories</option>
              <option value="Skincare">Skincare Formulations</option>
              <option value="Haircare">Haircare & Scalp Care</option>
              <option value="OEM / Private Label">OEM / Private Label</option>
              <option value="Color Cosmetics">Color Cosmetics</option>
              <option value="Packaging">Packaging & Bottles</option>
            </select>
          </div>

          {/* Export Report CTA */}
          <button
            onClick={() => alert('📊 Exporting CSV Sourcing Analytics Summary for Aura Beauty Labs...')}
            className="bg-white border border-[#e8e8e8] hover:border-[#b90064] hover:text-[#b90064] text-[#1c1b1b] text-xs font-extrabold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#b90064]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP KEY PERFORMANCE METRIC CARDS (ROW 1 - 4 KPI CARDS WITH SPARKLINES) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Profile Views */}
        <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#b90064]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#594047] uppercase tracking-wider">
              Profile Views
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-zinc-950 tracking-tight block">
                {kpiData.profileViews.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{kpiData.profileGrowth}</span>
                <span className="text-stone-400 font-normal text-[10px]">vs prior period</span>
              </div>
            </div>

            <Sparkline data={kpiData.profileSparkline} color="#7e22ce" isPositive={true} />
          </div>
        </div>

        {/* KPI 2: Product Views */}
        <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#b90064]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#594047] uppercase tracking-wider">
              Product Views
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Eye className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-zinc-950 tracking-tight block">
                {kpiData.productViews.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{kpiData.productGrowth}</span>
                <span className="text-stone-400 font-normal text-[10px]">vs prior period</span>
              </div>
            </div>

            <Sparkline data={kpiData.productSparkline} color="#0050d6" isPositive={true} />
          </div>
        </div>

        {/* KPI 3: Total Enquiries Received */}
        <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#b90064]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#594047] uppercase tracking-wider">
              Total Enquiries Received
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#fde7f3] flex items-center justify-center text-[#b90064]">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-[#b90064] tracking-tight block">
                {kpiData.enquiriesReceived.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{kpiData.enquiriesGrowth}</span>
                <span className="text-stone-400 font-normal text-[10px]">vs prior period</span>
              </div>
            </div>

            <Sparkline data={kpiData.enquiriesSparkline} color="#b90064" isPositive={true} />
          </div>
        </div>

        {/* KPI 4: Total RFQs Received */}
        <div className="bg-white border border-[#e8e8e8] p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#b90064]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#594047] uppercase tracking-wider">
              Total RFQs Received
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-zinc-950 tracking-tight block">
                {kpiData.rfqsReceived.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{kpiData.rfqsGrowth}</span>
                <span className="text-stone-400 font-normal text-[10px]">vs prior period</span>
              </div>
            </div>

            <Sparkline data={kpiData.rfqsSparkline} color="#d97706" isPositive={true} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PERFORMANCE METRICS & RESPONSE RATES (ROW 2 - 2 COLUMNS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card 1: Quote Conversion Rate */}
        <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#594047] uppercase tracking-wider">
                Quote Conversion Rate
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                High Performer
              </span>
            </div>
            <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
              18.6%
            </h3>
            <p className="text-xs text-[#594047] leading-relaxed">
              Percentage of sent quotations that successfully convert into connected buyer partnerships.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-[#fcf9f8] p-2.5 rounded-xl border border-stone-200">
                <span className="text-stone-400 block text-[10px] font-bold">Quotes Sent</span>
                <span className="font-black text-stone-900 text-sm">{Math.round(64 * multiplier)} Bids</span>
              </div>
              <div className="bg-pink-50 p-2.5 rounded-xl border border-pink-200">
                <span className="text-[#b90064] block text-[10px] font-bold">Quotes Converted</span>
                <span className="font-black text-[#b90064] text-sm">{Math.round(12 * multiplier)} Deals</span>
              </div>
            </div>
          </div>

          {/* Circular Progress Gauge */}
          <div className="relative w-28 h-28 shrink-0 mx-auto sm:mx-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-stone-100"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[#b90064]"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * 0.186)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-zinc-950">18.6%</span>
              <span className="text-[9px] text-[#594047] font-extrabold uppercase">Win Rate</span>
            </div>
          </div>
        </div>

        {/* Card 2: Supplier Response Rate & Speed */}
        <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#594047] uppercase tracking-wider">
                  Supplier Response Rate & Speed
                </span>
              </div>
              <p className="text-xs text-[#594047]">
                Live measurement of how quickly and reliably you answer buyer leads.
              </p>
            </div>

            {/* Fast Responder Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold shrink-0">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Fast Responder</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="bg-[#fcf9f8] p-3.5 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Response Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-zinc-950 block">94%</span>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-600 h-full w-[94%]" />
              </div>
              <span className="text-[10px] text-stone-500 block pt-1">
                {Math.round(321 * multiplier)} of {Math.round(342 * multiplier)} Enquiries Answered
              </span>
            </div>

            <div className="bg-[#fcf9f8] p-3.5 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center justify-between text-stone-500">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Response Time</span>
                <Clock className="w-4 h-4 text-[#b90064]" />
              </div>
              <span className="text-2xl font-black text-zinc-950 block">1.8 Hours</span>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-[#b90064] h-full w-[88%]" />
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block pt-1">
                Top 5% speed in OEM Category
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. LEAD & VIEW TRENDS (ROW 3 - MAIN CHART SECTION) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs space-y-5">
        
        {/* Chart Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#b90064]" />
              <span>Lead & View Trends Over Time</span>
            </h3>
            <p className="text-xs text-[#594047]">
              Interactive visual timeline of profile discovery, catalog engagement, enquiries, and buyer RFQs.
            </p>
          </div>

          {/* Metric Toggle Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#fdf8f8] p-1 rounded-xl border border-stone-200 text-xs font-bold">
            {[
              { id: 'all', label: 'All Combined' },
              { id: 'product_views', label: 'Product Views' },
              { id: 'profile_views', label: 'Profile Views' },
              { id: 'enquiries', label: 'Enquiries' },
              { id: 'rfqs', label: 'RFQs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveChartMetric(tab.id as typeof activeChartMetric)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeChartMetric === tab.id
                    ? 'bg-[#b90064] text-white shadow-xs'
                    : 'text-[#594047] hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Chart Canvas */}
        <div className="relative bg-[#fcf9f8] border border-stone-200 rounded-xl p-5 overflow-hidden">
          
          {/* Chart Header Legend */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 text-xs font-extrabold text-[#594047]">
            <div className="flex items-center gap-4">
              {(activeChartMetric === 'all' || activeChartMetric === 'product_views') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Product Views (Scale: 0-700)</span>
                </div>
              )}
              {(activeChartMetric === 'all' || activeChartMetric === 'profile_views') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-purple-600" />
                  <span>Profile Views</span>
                </div>
              )}
              {(activeChartMetric === 'all' || activeChartMetric === 'enquiries') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#b90064]" />
                  <span>Enquiries</span>
                </div>
              )}
              {(activeChartMetric === 'all' || activeChartMetric === 'rfqs') && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>RFQs</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-stone-400 font-normal">
              Hover over points for daily breakdown
            </div>
          </div>

          {/* SVG Multi-Line Chart Canvas */}
          <div className="relative h-64 w-full">
            
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-stone-300 w-full" />
              <div className="border-b border-stone-300 w-full" />
              <div className="border-b border-stone-300 w-full" />
              <div className="border-b border-stone-300 w-full" />
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 240" preserveAspectRatio="none">
              
              {/* Defs for area gradients */}
              <defs>
                <linearGradient id="gradProduct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0050d6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0050d6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradEnquiry" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b90064" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#b90064" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Under Curve for Product Views */}
              {(activeChartMetric === 'all' || activeChartMetric === 'product_views') && (
                <polygon
                  fill="url(#gradProduct)"
                  points={`0,240 ${timelineData.map((d, i) => `${(i / (timelineData.length - 1)) * 1000},${240 - (d.pViews / 700) * 220}`).join(' ')} 1000,240`}
                />
              )}

              {/* Line 1: Product Views */}
              {(activeChartMetric === 'all' || activeChartMetric === 'product_views') && (
                <polyline
                  fill="none"
                  stroke="#0050d6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={timelineData.map((d, i) => `${(i / (timelineData.length - 1)) * 1000},${240 - (d.pViews / 700) * 220}`).join(' ')}
                />
              )}

              {/* Line 2: Profile Views */}
              {(activeChartMetric === 'all' || activeChartMetric === 'profile_views') && (
                <polyline
                  fill="none"
                  stroke="#7e22ce"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={timelineData.map((d, i) => `${(i / (timelineData.length - 1)) * 1000},${240 - (d.profViews / 120) * 220}`).join(' ')}
                />
              )}

              {/* Line 3: Enquiries */}
              {(activeChartMetric === 'all' || activeChartMetric === 'enquiries') && (
                <polyline
                  fill="none"
                  stroke="#b90064"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={timelineData.map((d, i) => `${(i / (timelineData.length - 1)) * 1000},${240 - (d.enq / 30) * 220}`).join(' ')}
                />
              )}

              {/* Line 4: RFQs */}
              {(activeChartMetric === 'all' || activeChartMetric === 'rfqs') && (
                <polyline
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={timelineData.map((d, i) => `${(i / (timelineData.length - 1)) * 1000},${240 - (d.rfq / 10) * 220}`).join(' ')}
                />
              )}

              {/* Interactive Data points */}
              {timelineData.map((d, i) => {
                const x = (i / (timelineData.length - 1)) * 1000;
                const y = 240 - (d.pViews / 700) * 220;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    className="fill-white stroke-blue-600 stroke-[2.5] hover:r-7 transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredDataPoint(i)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip display */}
            {hoveredDataPoint !== null && (
              <div 
                className="absolute bg-zinc-950 text-white text-xs p-3 rounded-xl shadow-xl pointer-events-none z-20 space-y-1"
                style={{
                  left: `${(hoveredDataPoint / (timelineData.length - 1)) * 85}%`,
                  top: '10%'
                }}
              >
                <p className="font-extrabold text-[11px] text-stone-300 border-b border-stone-700 pb-1">
                  {timelineData[hoveredDataPoint].date} Summary
                </p>
                <div className="text-[11px] space-y-0.5 pt-0.5">
                  <p className="text-blue-400">📦 Product Views: <b>{timelineData[hoveredDataPoint].pViews}</b></p>
                  <p className="text-purple-400">🏢 Profile Views: <b>{timelineData[hoveredDataPoint].profViews}</b></p>
                  <p className="text-pink-400">💬 Enquiries: <b>{timelineData[hoveredDataPoint].enq}</b></p>
                  <p className="text-amber-400">📝 RFQs Received: <b>{timelineData[hoveredDataPoint].rfq}</b></p>
                </div>
              </div>
            )}

          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between items-center text-[10px] font-extrabold text-[#594047] pt-3">
            {timelineData.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. TOP PERFORMING PRODUCTS TABLE (ROW 4) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-black text-zinc-950">
              Top Performing Formulations & Catalog Listings
            </h3>
            <p className="text-xs text-[#594047]">
              Ranked by aggregate buyer engagement, inquiries generated, and quotation conversion rates.
            </p>
          </div>
          <span className="text-xs font-bold text-stone-500">
            Showing Top {topProducts.length} Listings
          </span>
        </div>

        {/* Structured Table */}
        <div className="border border-[#e8e8e8] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-[#e8e8e8] text-[11px] font-extrabold uppercase tracking-wider text-[#594047]">
                  <th className="p-3.5">Product Name & Thumbnail</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Views</th>
                  <th className="p-3.5 text-right">Enquiries</th>
                  <th className="p-3.5 text-right">RFQs Received</th>
                  <th className="p-3.5 text-right">Conversion Rate</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                    
                    {/* Product Name & Thumbnail */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-stone-400 font-bold w-4">
                          0{idx + 1}
                        </span>
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 truncate max-w-xs">{p.name}</p>
                          <span className="text-[10px] text-stone-400 font-mono">ID: #{p.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="inline-block bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px] font-bold">
                        {p.category}
                      </span>
                    </td>

                    {/* Views */}
                    <td className="p-3.5 text-right font-bold text-zinc-900">
                      {p.views.toLocaleString()}
                    </td>

                    {/* Enquiries */}
                    <td className="p-3.5 text-right font-bold text-[#b90064]">
                      {p.enquiries.toLocaleString()}
                    </td>

                    {/* RFQs */}
                    <td className="p-3.5 text-right font-bold text-amber-700">
                      {p.rfqs.toLocaleString()}
                    </td>

                    {/* Conversion Rate */}
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1 font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span>{p.conversionRate}%</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewProduct ? onViewProduct(p.id) : alert(`Navigating to PDP for ${p.name}...`)}
                          className="text-stone-600 hover:text-stone-900 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          View Listing
                        </button>
                        <button
                          onClick={() => onBoostProduct ? onBoostProduct(p.id) : alert(`Launching Sponsored Ad configuration for ${p.name}...`)}
                          className="bg-[#fde7f3] hover:bg-[#fbd0e8] text-[#b90064] font-extrabold text-xs px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-[#f7c5e0]"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Boost Listing</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. BUYER GEOGRAPHY & DEMAND MAP (ROW 5 - 2 COLUMNS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Column 1: Geographic Breakdown */}
        <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b90064]" />
                <span>Top Buyer Sourcing Hubs</span>
              </h3>
              <p className="text-xs text-[#594047]">
                Geographic regional concentration of beauty brand inquiries.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-500">Pan-India</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {regionalDemand.map((region, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-900">{region.city}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#594047]">{region.enquiries} Enquiries</span>
                    <span className="font-black text-zinc-900">{region.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#b90064] to-[#e6007e] h-full rounded-full transition-all duration-500"
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#fdf8f8] p-3 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
            <span className="text-[#594047]">Fastest Growing Hub:</span>
            <span className="font-extrabold text-[#b90064] flex items-center gap-1">
              <span>Mumbai Metropolitan Region (+22% QoQ)</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Column 2: Lead Funnel Visual (Pipeline Summary) */}
        <div className="bg-white border border-[#e8e8e8] p-5 md:p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>B2B Sourcing Lead Conversion Funnel</span>
              </h3>
              <p className="text-xs text-[#594047]">
                Progression from first buyer touchpoint to recurring business contracts.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {funnelSteps.map((step, idx) => {
              const widthPct = 100 - idx * 11;
              return (
                <div key={idx} className="bg-[#fcf9f8] p-2.5 rounded-xl border border-stone-200 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-900">{step.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 text-[11px]">{step.note}</span>
                      <span className="font-black text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                        {step.count} ({step.rate})
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 5 ? 'bg-emerald-600' :
                        idx >= 3 ? 'bg-[#b90064]' : 'bg-stone-700'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs flex items-center justify-between text-emerald-900 font-bold">
            <span>Overall Marketplace Conversion Rate:</span>
            <span className="text-emerald-700 font-black text-sm">3.51% (Lead to Contract)</span>
          </div>
        </div>

      </div>

    </div>
  );
};
