import React, { useState, useEffect } from 'react';
import { 
  Building2, Sparkles, ShieldCheck, Mail, ArrowRight, Settings, Plus, FileText, 
  TrendingUp, BarChart3, Users, CheckCircle2, ChevronRight, Edit3, Trash2, Check, Upload, Award, RefreshCw,
  Eye, MousePointer, Play, Film, Send, ExternalLink, Activity, MessageSquare
} from 'lucide-react';
import { SponsoredAdManager } from './SponsoredAdManager';
import { SupplierAnalyticsDashboard } from './SupplierAnalyticsDashboard';
import { getStoredSponsoredAnalyticsEvents, SponsoredAnalyticsEvent } from '../data/sponsoredAnalyticsStore';
import { getStoredChatThreads, supplierReplyMessage, ChatThread } from '../data/chatStore';
import { CATEGORY_TAXONOMY, CATEGORIES_DATA, getSubcategoriesForCategoryName } from '../data/categories';

// Mock initial listings
const INITIAL_PRODUCTS = [
  { id: 'sp1', name: 'Peptide Skin Barrier Repair Cream', price: '₹145 - ₹180', moq: '2,000 Units', category: 'Skincare', status: 'Active' },
  { id: 'sp2', name: 'Clinical Vitamin C Infused Glow Serum', price: '₹190 - ₹220', moq: '3,000 Units', category: 'Skincare', status: 'Active' },
  { id: 'sp3', name: 'Salicylic Acid Overnight Blemish Gel', price: '₹110 - ₹135', moq: '5,000 Units', category: 'Skincare', status: 'Draft' }
];

// Mock public buyer requirements
const MOCK_RFQ_MARKETPLACE = [
  { id: 'RFQ-99512', title: 'Aerosol Cold-Sprayed Hair Dry Shampoo', qty: '5,000 Spray Bottles', location: 'Mumbai, MH', urgency: 'Immediate (Next 7 days)', date: 'Just now' },
  { id: 'RFQ-99508', title: 'Organic Rosemary Scalp Cleansing Base', qty: '2,000 Liters (Bulk)', location: 'Bengaluru, KA', urgency: 'Standard (30 days)', date: '1 hour ago' },
  { id: 'RFQ-99488', title: '30ml Premium Glass Dropper Assemblies', qty: '25,000 Sets', location: 'Delhi NCR', urgency: 'Urgent', date: 'Yesterday' }
];

// Mock incoming buyer leads / enquiries
const MOCK_ENQUIRIES = [
  { id: 'ENQ-8110', buyer: 'Aura Cosmetics Ltd', product: 'Clinical Vitamin C Infused Glow Serum', qty: '3,000 Units', message: 'Do you offer customized biological enzyme suspensions for stable formulations?', date: 'Just now', status: 'Unread' },
  { id: 'ENQ-8105', buyer: 'GreenBeauty Startups', product: 'Peptide Skin Barrier Repair Cream', qty: '10,000 Units', message: 'Looking for 100% biodegradable squeeze tubes. Can we schedule a consulting call?', date: 'Yesterday', status: 'Responded' }
];

interface SupplierAdminPortalProps {
  onNavigateToProduct?: (productId: string) => void;
  initialTab?: 'dashboard' | 'products' | 'sponsored-ads' | 'analytics' | 'enquiries' | 'rfqs' | 'verification' | 'chat-hub';
}

export const SupplierAdminPortal: React.FC<SupplierAdminPortalProps> = ({
  onNavigateToProduct,
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'sponsored-ads' | 'analytics' | 'enquiries' | 'rfqs' | 'verification' | 'chat-hub'>(initialTab);
  const [analyticsEvents, setAnalyticsEvents] = useState<SponsoredAnalyticsEvent[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [portalReplyText, setPortalReplyText] = useState('');

  useEffect(() => {
    const loadEvents = () => {
      setAnalyticsEvents(getStoredSponsoredAnalyticsEvents());
    };
    const loadChats = () => {
      const threads = getStoredChatThreads();
      setChatThreads(threads);
      if (!selectedChatId && threads.length > 0) {
        setSelectedChatId(threads[0].id);
      }
    };
    loadEvents();
    loadChats();
    window.addEventListener('nexora_analytics_event_recorded', loadEvents);
    window.addEventListener('nexora_chat_updated', loadChats);
    return () => {
      window.removeEventListener('nexora_analytics_event_recorded', loadEvents);
      window.removeEventListener('nexora_chat_updated', loadChats);
    };
  }, []);

  // Supplier Onboarding & Profile Verification states
  const [supplierGst, setSupplierGst] = useState('07AABCU9603R1ZM');
  const [gstVerified, setGstVerified] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Product creation state (Screen 20)
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdMoq, setNewProdMoq] = useState('');
  const [newProdCat, setNewProdCat] = useState('Skincare');
  const [newProdSubcat, setNewProdSubcat] = useState('Serums & Treatments');
  const [showMobileToBuyers, setShowMobileToBuyers] = useState(true);

  // Quote form state (Screen 23)
  const [selectedRfq, setSelectedRfq] = useState<typeof MOCK_RFQ_MARKETPLACE[0] | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const handleVerifyGst = () => {
    if (!supplierGst.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setGstVerified(true);
    }, 1200);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdMoq) return;

    // Validate classification against CATEGORIES_DATA master taxonomy list
    const validCatNode = CATEGORIES_DATA.find((c) => c.name === newProdCat);
    const categoryName = validCatNode ? validCatNode.name : CATEGORIES_DATA[0].name;
    const subcategoryName = newProdSubcat || (validCatNode ? validCatNode.subcategories[0] : '');

    const newProduct = {
      id: `sp-${Date.now()}`,
      name: newProdName,
      price: newProdPrice,
      moq: newProdMoq,
      category: `${categoryName} (${subcategoryName})`,
      status: 'Active'
    };

    setProducts([newProduct, ...products]);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdMoq('');
  };

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotePrice || !quoteLeadTime) return;
    setQuoteSubmitted(true);
    setTimeout(() => {
      setQuoteSubmitted(false);
      setSelectedRfq(null);
      setQuotePrice('');
      setQuoteLeadTime('');
      alert('Your formal commercial quote has been securely sent to the buyer. You will receive notifications upon response.');
    }, 1500);
  };

  return (
    <div className="bg-[#fdf8f8] min-h-screen flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-64 border-r border-[#e8e8e8] bg-white p-6 space-y-8 shrink-0">
        <div>
          <span className="text-sm font-black text-[#b90064] tracking-tight block">Nexora Luxe</span>
          <span className="text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Manufacturer Admin Suite</span>
        </div>

        <nav className="flex flex-col gap-1 text-xs font-bold text-[#594047]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Suite Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <Plus className="w-4.5 h-4.5" />
            <span>My Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsored-ads')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'sponsored-ads' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4.5 h-4.5 text-[#b90064]" />
              <span>Ad Campaigns</span>
            </div>
            <span className="text-[9px] bg-[#b90064] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
              Promote
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4.5 h-4.5 text-[#b90064]" />
              <span>Ad Analytics (Screen 25)</span>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold uppercase">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'enquiries' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <Mail className="w-4.5 h-4.5" />
            <span>Buyer Enquiries ({MOCK_ENQUIRIES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rfqs')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'rfqs' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            <span>RFQ Marketplace ({MOCK_RFQ_MARKETPLACE.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'verification' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Verification Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('chat-hub')}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all cursor-pointer ${
              activeTab === 'chat-hub' ? 'bg-[#fde7f3] text-[#b90064]' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4.5 h-4.5 text-[#b90064]" />
              <span>Inquiries / Chat Hub</span>
            </div>
            <span className="text-[9px] bg-[#b90064] text-white px-1.5 py-0.5 rounded-full font-bold">
              {chatThreads.length}
            </span>
          </button>
        </nav>
      </div>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* ================== CHAT HUB TAB ================== */}
        {activeTab === 'chat-hub' && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[70vh]">
            <div className="w-full md:w-80 border-r border-stone-200 bg-stone-50 flex flex-col shrink-0">
              <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-stone-900">Buyer Chat Threads</h3>
                <span className="text-[10px] bg-pink-100 text-[#b90064] px-2 py-0.5 rounded-full font-bold">
                  {chatThreads.length} Active
                </span>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
                {chatThreads.map(thread => {
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  const isSelected = thread.id === selectedChatId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedChatId(thread.id)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#fde7f3] border-l-4 border-[#b90064]' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-stone-900 truncate">Buyer Thread #{thread.id.slice(-4)}</span>
                        <span className="text-[10px] text-stone-400">{lastMsg?.timestamp || ''}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 truncate font-medium">{lastMsg?.text || 'No messages'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
              {(() => {
                const currentThread = chatThreads.find(t => t.id === selectedChatId) || chatThreads[0];
                if (!currentThread) {
                  return (
                    <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">
                      No chat threads available.
                    </div>
                  );
                }
                return (
                  <>
                    <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-stone-900">Live Buyer Sourcing Conversation</h4>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">● Connected with Verified B2B Buyer</p>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdf8f8]">
                      {currentThread.messages.map(m => (
                        <div key={m.id} className={`flex flex-col ${m.sender === 'supplier' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-stone-400 mb-0.5">{m.senderName} • {m.timestamp}</span>
                          <div className={`p-3 rounded-xl text-xs max-w-md ${
                            m.sender === 'supplier' ? 'bg-[#b90064] text-white' : 'bg-white border border-stone-200 text-stone-900'
                          }`}>
                            {m.productContext && (
                              <div className="mb-2 p-2 bg-black/10 rounded text-[11px]">
                                <b>Inquiry Product:</b> {m.productContext.title}
                              </div>
                            )}
                            <p>{m.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 border-t border-stone-200 bg-white flex items-center gap-2">
                      <input
                        type="text"
                        value={portalReplyText}
                        onChange={(e) => setPortalReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && portalReplyText.trim()) {
                            supplierReplyMessage(currentThread.id, portalReplyText);
                            setPortalReplyText('');
                            setChatThreads(getStoredChatThreads());
                          }
                        }}
                        placeholder="Type reply as Aura Beauty Labs Sales Desk..."
                        className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#b90064]"
                      />
                      <button
                        onClick={() => {
                          if (!portalReplyText.trim()) return;
                          supplierReplyMessage(currentThread.id, portalReplyText);
                          setPortalReplyText('');
                          setChatThreads(getStoredChatThreads());
                        }}
                        className="bg-[#b90064] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#a00056] cursor-pointer"
                      >
                        Send Reply
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* UPPER STATUS STRIP */}
        <div className="bg-white border border-[#e8e8e8] p-4.5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-1.5">
              Aura Beauty Labs
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">GST Verified</span>
            </h2>
            <p className="text-xs text-[#594047] mt-0.5">Primary Manufacturing Plant: Mumbai High Tech Cosmetic Zone • Est: 2012</p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#594047] font-semibold">Live Traffic Analytics:</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">98% conversion rating</span>
          </div>
        </div>

        {/* ================== SUITE DASHBOARD TAB ================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Catalog Listings</span>
                <span className="text-2xl font-black text-zinc-950 block">{products.length}</span>
              </div>
              <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Active Buyer Leads</span>
                <span className="text-2xl font-black text-[#b90064] block">12</span>
              </div>
              <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Response Speed</span>
                <span className="text-2xl font-black text-zinc-950 block text-emerald-600">3.5 hrs</span>
              </div>
              <div className="p-4.5 bg-white border border-[#e8e8e8] rounded-xl space-y-1.5 text-center md:text-left">
                <span className="text-[10px] text-[#8c7077] uppercase font-bold tracking-wider">Monthly Views</span>
                <span className="text-2xl font-black text-zinc-950 block">4,810</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sourcing Demand Forecast Chart */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-[#8c7077] uppercase tracking-wider">Sourcing Demand Forecast</h3>
                <div className="h-40 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-[#594047] font-semibold italic">Monthly volume demand chart in progress...</span>
                </div>
              </div>

              {/* Manufacturing capacity index */}
              <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4">
                <h3 className="font-extrabold text-xs text-[#8c7077] uppercase tracking-wider">Production Capacity &amp; Batches</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-zinc-800 mb-1">
                      <span>Lab Stability Queue</span>
                      <span>85% active</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#b90064] h-full w-[85%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-zinc-800 mb-1">
                      <span>Contract Bulk Formulation</span>
                      <span>60% capacity occupied</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0050d6] h-full w-[60%]"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================== CATALOG MANAGEMENT TAB (Screen 19 / 20) ================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Create Product Form (Screen 20) */}
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-5">
              <h3 className="font-black text-sm text-zinc-950">Add Formulation Private Label to Catalog</h3>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => {
                      const selectedCat = e.target.value;
                      setNewProdCat(selectedCat);
                      const subcategories = getSubcategoriesForCategoryName(selectedCat);
                      setNewProdSubcat(subcategories[0] || '');
                    }}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg font-medium cursor-pointer"
                  >
                    {CATEGORIES_DATA.map((catNode) => (
                      <option key={catNode.id} value={catNode.name}>
                        {catNode.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Subcategory</label>
                  <select
                    value={newProdSubcat}
                    onChange={(e) => setNewProdSubcat(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg font-medium cursor-pointer"
                  >
                    {getSubcategoriesForCategoryName(newProdCat).map((sName) => (
                      <option key={sName} value={sName}>
                        {sName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Formulation Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ceramide Eye Gel Base"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Estimated Price (INR)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹120 - ₹150 / unit"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Publish to Catalog
                  </button>
                </div>
              </form>
            </div>

            {/* Catalog list */}
            <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e8e8] text-[#8c7077] font-bold uppercase tracking-wider bg-zinc-50">
                    <th className="p-4">Formulation Name</th>
                    <th className="p-4">Est Price Unit</th>
                    <th className="p-4">Minimum MOQ</th>
                    <th className="p-4">Audit Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8e8] text-[#594047]">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-4 font-extrabold text-zinc-950">{p.name}</td>
                      <td className="p-4">{p.price}</td>
                      <td className="p-4">{p.moq}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] uppercase tracking-wider ${
                          p.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setProducts(products.filter(item => item.id !== p.id))}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================== SPONSORED AD CAMPAIGN MANAGER ================== */}
        {activeTab === 'sponsored-ads' && (
          <SponsoredAdManager
            supplierId="seller_aura_001"
            supplierName="Aura Beauty Labs"
          />
        )}

        {/* ================== SCREEN 25 — SUPPLIER ANALYTICS & PERFORMANCE ================== */}
        {activeTab === 'analytics' && (
          <SupplierAnalyticsDashboard
            supplierId="seller_aura_001"
            supplierName="Aura Beauty Labs"
            onBoostProduct={(productId) => {
              setActiveTab('sponsored-ads');
            }}
            onViewProduct={(productId) => {
              if (onNavigateToProduct) {
                onNavigateToProduct(productId);
              }
            }}
          />
        )}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <h3 className="font-black text-sm text-zinc-950">Active Buyer Sourcing Enquiries</h3>
            {MOCK_ENQUIRIES.map((enq) => (
              <div key={enq.id} className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono block">Enquiry REF: {enq.id}</span>
                    <h4 className="font-extrabold text-sm text-zinc-950 mt-0.5">{enq.buyer}</h4>
                  </div>
                  <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase ${
                    enq.status === 'Unread'
                      ? 'bg-[#fde7f3] text-[#b90064] border border-[#e0bec6]'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {enq.status}
                  </span>
                </div>

                <div className="bg-[#fcf9f8] p-3 rounded-lg border border-[#e8e8e8] text-xs">
                  <p className="font-semibold text-zinc-800 mb-1">Product: {enq.product} (Target: {enq.qty})</p>
                  <p className="italic">"{enq.message}"</p>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button className="border border-[#e8e8e8] hover:border-zinc-400 text-zinc-800 font-bold px-3 py-2 rounded-lg cursor-pointer">
                    Chat with Buyer
                  </button>
                  <button className="bg-[#b90064] text-white font-extrabold px-3 py-2 rounded-lg hover:bg-[#8e004b] transition-colors cursor-pointer">
                    Draft Proposal Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================== RFQ PUBLIC MARKETPLACE (Screen 22 / 23) ================== */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-zinc-950">Active Public Sourcing RFQ Directory</h3>
              <p className="text-xs text-[#594047]">Verified beauty product requirements posted by buyers seeking manufacturers, private label labs, and custom chemical formulators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_RFQ_MARKETPLACE.map((rfq) => (
                <div key={rfq.id} className="bg-white border border-[#e8e8e8] rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Lead ID: {rfq.id}</span>
                      <span>Published: {rfq.date}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-950">{rfq.title}</h4>
                    <div className="flex flex-wrap gap-2 text-[11px] text-[#594047]">
                      <span>Target Volume: <span className="font-bold text-zinc-900">{rfq.qty}</span></span>
                      <span>•</span>
                      <span>Destination: <span className="font-semibold text-zinc-800">{rfq.location}</span></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#e8e8e8] flex justify-between items-center text-xs">
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold uppercase">{rfq.urgency}</span>
                    <button
                      onClick={() => setSelectedRfq(rfq)}
                      className="bg-[#b90064] text-white font-extrabold px-3 py-2 rounded-lg hover:bg-[#8e004b] transition-colors cursor-pointer"
                    >
                      Submit Quote Proposal
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Quote Submission form overlay (Screen 23) */}
            {selectedRfq && (
              <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-[#e8e8e8] rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-xs space-y-6">
                  
                  <div className="flex justify-between items-center pb-3 border-b border-[#e8e8e8]">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-mono block">RFQ: {selectedRfq.id}</span>
                      <h3 className="font-black text-sm text-zinc-900">Send Commercial Quote Proposal</h3>
                    </div>
                    <button onClick={() => setSelectedRfq(null)} className="text-zinc-400 hover:text-zinc-600 font-bold">
                      Close
                    </button>
                  </div>

                  <form onSubmit={handleSendQuote} className="space-y-4 text-xs">
                    <div>
                      <span className="block text-[#8c7077] font-bold uppercase mb-1">Target Requirement</span>
                      <span className="text-sm font-bold text-zinc-950 block">{selectedRfq.title}</span>
                      <span className="text-[#594047] block mt-0.5">Target volume requested: {selectedRfq.qty}</span>
                    </div>

                    <div>
                      <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Proposed Price (per unit / Liter)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹135 / Unit"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg font-mono text-zinc-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Production Lead-time</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 business days"
                        value={quoteLeadTime}
                        onChange={(e) => setQuoteLeadTime(e.target.value)}
                        className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none p-2.5 rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={quoteSubmitted}
                      className="w-full py-3.5 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all"
                    >
                      {quoteSubmitted ? 'Transmitting quote securely...' : 'Submit Commercial Bid'}
                    </button>
                  </form>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ================== VERIFICATION HUB (Screen 17 / 24) ================== */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-5">
              <div className="border-b border-[#e8e8e8] pb-3">
                <h3 className="font-black text-sm text-zinc-900">Supplier Legal Identity Onboarding</h3>
                <p className="text-xs text-[#594047] mt-0.5">Vetted business licenses boost matching weight curves by up to **40%** in search directories.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Company GSTIN Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={15}
                      value={supplierGst}
                      onChange={(e) => setSupplierGst(e.target.value)}
                      placeholder="e.g. 07AABCU9603R1ZM"
                      className="flex-1 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none px-3.5 py-2.5 rounded-lg uppercase tracking-wider font-mono font-bold"
                    />
                    <button
                      onClick={handleVerifyGst}
                      disabled={isVerifying}
                      className="bg-[#b90064] text-white font-extrabold px-5 py-2.5 rounded-lg hover:bg-[#8e004b] transition-colors"
                    >
                      {isVerifying ? 'Checking...' : 'Sync Corporate Register'}
                    </button>
                  </div>
                </div>

                {gstVerified && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2.5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-bold text-emerald-800">Legal Business Verified Successfully</span>
                      <span className="block text-[#594047] mt-0.5">Aura Beauty Labs private manufacturing lines are fully checked, registered, and active.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications and credentials upload */}
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-[#8c7077] uppercase tracking-wider">Manufacturing Certifications (GMP, ISO, organic)</h3>
              
              <div className="border-2 border-dashed border-[#e0bec6] rounded-xl p-6 text-center hover:bg-neutral-50 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-[#b90064] mx-auto mb-2" />
                <span className="block text-xs font-bold text-zinc-900">Upload GMP / ISO Compliance Certificate</span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">Supports high-res PDF or PNG up to 5MB</span>
              </div>
            </div>

            {/* Privacy & Visibility Settings */}
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 space-y-4">
              <h3 className="font-extrabold text-xs text-[#8c7077] uppercase tracking-wider">Privacy & Visibility Settings</h3>
              
              <div className="flex items-center justify-between p-4 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8]">
                <div className="space-y-1">
                  <span className="block text-[13px] font-bold text-[#1c1b1b]">Show My Mobile Number to Verified Buyers</span>
                  <p className="text-[11px] text-[#594047]">When enabled, your verified business contact number will be visible to logged-in buyers. If disabled, they must send an enquiry to connect.</p>
                </div>
                <button
                  onClick={() => setShowMobileToBuyers(!showMobileToBuyers)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showMobileToBuyers ? 'bg-[#b90064]' : 'bg-[#e8e8e8]'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showMobileToBuyers ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
