import React, { useState } from 'react';
import { 
  Sparkles, Check, Building2, Store, ShieldCheck, ArrowRight, FileCheck, Layers,
  Search, Filter, Plus, Bell, Package, Mail, PieChart, Eye,
  TrendingUp, AlertTriangle, MoreVertical, MapPin, MessageSquare, Mail as MailIcon,
  X, CheckCircle2, AlertCircle, Edit, Trash2, Send, ExternalLink, ShieldAlert, Upload, Camera
} from 'lucide-react';

interface BusinessViewProps {
  onOpenRegister: () => void;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  moq: number;
  status: 'Active' | 'Pending Review' | 'Draft';
  imageUrl: string;
}

interface EnquiryItem {
  id: string;
  name: string;
  location: string;
  timeAgo: string;
  message: string;
  email: string;
  phone: string;
}

export const BusinessView: React.FC<BusinessViewProps> = ({ onOpenRegister }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'overview'>('dashboard');

  // Inventory Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Pending Review' | 'Draft'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeLeadModal, setActiveLeadModal] = useState<{ lead: EnquiryItem; type: 'whatsapp' | 'email' } | null>(null);
  const [leadReplyText, setLeadReplyText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Initial Product Inventory
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'p-1',
      name: 'Luminous Peptide Serum',
      sku: 'LXP-045',
      category: 'Serums',
      price: 28.50,
      moq: 50,
      status: 'Active',
      imageUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLstmP2lxbhxPBuhsGIMiT3lypow8gxMYCmdi6YsJ69G0Qz7brYShGi9R5zXkbhQsEd75JjVIB3dasDnNP09jAg8FvFJ3fSjPDgR9Hz_NFTIUoW6D8s1n5hRkgY46d03b3LLMn6SOWB6WQaCLp7gwAhUjzhIRWwCP01RProML6hES9x0dhuVyaxMHqZn28lxqwCYleeJBRuR86aQG_aXeFySa8NhmOJgGRL9uwFryrqlbAFB8T8y2B_SLWU'
    },
    {
      id: 'p-2',
      name: 'Velvet Matte Finish Powder',
      sku: 'VMF-112',
      category: 'Cosmetics',
      price: 42.00,
      moq: 20,
      status: 'Pending Review',
      imageUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLuuMMUZy1_r5qqOrvYvG4cWkXXHmlstcgtndT5e4PnCyH0jXW7junfykfD7A8cC_4avtueCp1YZtmauxFi5zHRH9rYTUVhUpyk5879Ia6V3PE9M8sMr6FXYMPB_mey31giBAqQj-qvS4K1CIT920HOIwNxtoXgM_VeSnABFeQ5XmnUBBVGWxLM5hLps2wWLCg5R51caHZJL2lNTI0eWMccUHNYmhp0deyqjRvlgCT9gLhLRMpLtY125_Lk'
    },
    {
      id: 'p-3',
      name: 'Botanical Cleansing Balm',
      sku: 'BCB-089',
      category: 'Cleansers',
      price: 19.00,
      moq: 100,
      status: 'Draft',
      imageUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLuY6IuUsYwTBIq-h26ikPrscnMJmkO81npsiciaNn3iKb5guVzymiKGgFBXz5AjPo85LOMvq7JWSR0PYxDfPQ7UDRwOrbvy_ky9jfi6ACt8re4YNN7d7PA_iPZRSA0CS9SiTjK5bEAiVXm6L6rq3Nt5JbAgZujwxWyLSbDVT-EIRqQRtB-qwGMCskRx40fxRS9SqolDp80_m-z0_BqvziFcV6Q3gSW80a7PFgjYFOZ-xR9CJOBMRupyEbA'
    },
    {
      id: 'p-4',
      name: 'Hydrating Hyaluronic Toner',
      sku: 'HHT-204',
      category: 'Toners',
      price: 16.50,
      moq: 60,
      status: 'Active',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=300'
    }
  ]);

  // Form State for Adding Product
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Serums',
    price: '',
    moq: '',
    status: 'Active' as 'Active' | 'Pending Review' | 'Draft',
    imageUrl: ''
  });

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

  // Recent Enquiries Data
  const enquiries: EnquiryItem[] = [
    {
      id: 'enq-1',
      name: 'Sarah Jenkins',
      location: 'London, UK',
      timeAgo: '2h ago',
      message: 'Inquiry regarding bulk order of Luminous Peptide Serum for Q3 launch in 12 salon branches...',
      email: 's.jenkins@londonsalons.co.uk',
      phone: '+44 7700 900077'
    },
    {
      id: 'enq-2',
      name: 'Lotus Wellness Group',
      location: 'Jaipur, IN',
      timeAgo: '5h ago',
      message: 'Requesting wholesale sample kit for the new Velvet Matte Finish line before committing to 500 units...',
      email: 'procurement@lotuswellness.in',
      phone: '+91 98765 43210'
    },
    {
      id: 'enq-3',
      name: "M. O'Connor",
      location: 'Dublin, IE',
      timeAgo: '1d ago',
      message: 'Need updated wholesale pricing list and ECO-CERT certificates for all cleansing products.',
      email: 'm.oconnor@spadublin.ie',
      phone: '+353 1 497 1111'
    }
  ];

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Filter products based on search and status
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      showToast('Please fill in required product fields.');
      return;
    }

    const created: ProductItem = {
      id: `p-${Date.now()}`,
      name: newProduct.name,
      sku: newProduct.sku,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 25.00,
      moq: parseInt(newProduct.moq, 10) || 50,
      status: newProduct.status,
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=300'
    };

    setProducts([created, ...products]);
    setIsAddProductOpen(false);
    setNewProduct({ name: '', sku: '', category: 'Serums', price: '', moq: '', status: 'Active', imageUrl: '' });
    showToast(`✅ Product "${created.name}" successfully added to inventory!`);
  };

  // Reply to Lead Handler
  const handleSendLeadReply = () => {
    if (!activeLeadModal || !leadReplyText.trim()) return;
    const typeLabel = activeLeadModal.type === 'whatsapp' ? 'WhatsApp message' : 'Email quote response';
    showToast(`Sent ${typeLabel} to ${activeLeadModal.lead.name}!`);
    setActiveLeadModal(null);
    setLeadReplyText('');
  };

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-[#1C1B1B] pb-16">
      {/* Action Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-4 z-50 bg-[#1C1B1B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#313030] animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          <span className="text-xs font-bold">{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Header Toggle */}
      <div className="bg-white border-b border-[#E8E8E8] sticky top-0 z-30 shadow-xs px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1C1B1B] tracking-tight">Nexora Luxe Business Portal</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-[#FCF9F8] rounded-full border border-[#E8E8E8] text-[#B90064] text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Verified Supplier Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F1EDEC] p-1 rounded-xl border border-[#E8E8E8]">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-[#B90064] text-white shadow-xs'
                    : 'text-[#594047] hover:text-[#1C1B1B]'
                }`}
              >
                Live Business Dashboard
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-[#B90064] text-white shadow-xs'
                    : 'text-[#594047] hover:text-[#1C1B1B]'
                }`}
              >
                Supplier Program Overview
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
          {/* Main Column (KPIs & Table) */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* Header Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1B1B]">Business Overview</h2>
              <p className="text-xs sm:text-sm text-[#594047] mt-1">
                Manage your premium product portfolio, update wholesale MOQs, and respond directly to salon distributor leads.
              </p>
            </div>

            {/* KPI Grid (4 Cards) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Profile Completion */}
              <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 flex flex-col justify-between h-[160px] shadow-xs hover:border-[#B90064]/30 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Profile Completion</span>
                  <div className="p-1 bg-[#F1EDEC] rounded-lg text-[#594047]">
                    <PieChart className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1C1B1B] mb-2">85%</div>
                  <div className="w-full bg-[#F1EDEC] h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-[#B90064] h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                  <button 
                    onClick={() => showToast('Redirecting to profile wizard to complete company certifications (+15%)')}
                    className="text-[11px] font-bold text-[#B90064] hover:underline text-left"
                  >
                    Complete profile to boost reach (+15%)
                  </button>
                </div>
              </div>

              {/* Card 2: Listed Products */}
              <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 flex flex-col justify-between h-[160px] shadow-xs hover:border-[#B90064]/30 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Listed Products</span>
                  <div className="p-1 bg-[#F1EDEC] rounded-lg text-[#594047]">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1C1B1B] mb-3">{products.length + 138}</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#E6F4EA] text-[#137333] text-[11px] font-bold border border-[#CEEAD6]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +12 this month
                  </div>
                </div>
              </div>

              {/* Card 3: Active Business Enquiries */}
              <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 flex flex-col justify-between h-[160px] shadow-xs hover:border-[#B90064]/30 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Active Enquiries</span>
                  <div className="p-1 bg-[#F1EDEC] rounded-lg text-[#594047]">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1C1B1B] mb-3">28</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FEF7E0] text-[#B06000] text-[11px] font-bold border border-[#FCE8B2]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    5 pending review
                  </div>
                </div>
              </div>

              {/* Card 4: Visibility Rank */}
              <div className="bg-white rounded-xl border border-[#E8E8E8] p-5 flex flex-col justify-between h-[160px] shadow-xs relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FDE7F3] rounded-full opacity-50 blur-2xl z-0" />
                <div className="flex justify-between items-start relative z-10">
                  <span className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Visibility Rank</span>
                  <div className="p-1 bg-[#FFF0F5] rounded-lg text-[#B90064]">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-[#B90064] mb-1">Top 15%</div>
                  <div className="text-[11px] font-semibold text-[#594047]">
                    in Luxury Skincare & Salon Distribution
                  </div>
                </div>
              </div>
            </section>

            {/* Product Table Section */}
            <section className="bg-white rounded-2xl border border-[#E8E8E8] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E8E8E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[#1C1B1B]">Product Inventory</h3>
                  <span className="text-xs font-bold bg-[#F1EDEC] text-[#594047] px-2.5 py-0.5 rounded-full border border-[#E8E8E8]">
                    {filteredProducts.length} Items
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#594047]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search SKU or Name..."
                      className="pl-9 pr-4 py-2 border border-[#E8E8E8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#B90064] bg-[#FCF9F8] w-full sm:w-64"
                    />
                  </div>

                  <div className="flex items-center gap-1 border border-[#E8E8E8] rounded-xl bg-[#FCF9F8] px-3 py-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-[#594047]" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-transparent font-bold text-[#1C1B1B] focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#E8E8E8] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#594047]">
                      <th className="px-5 py-3.5 w-10">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                          className="rounded border-[#E8E8E8] text-[#B90064] focus:ring-[#B90064]"
                        />
                      </th>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5">SKU</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Price / MOQ</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E8] text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-[#594047]">
                          <AlertCircle className="w-8 h-8 text-[#594047]/40 mx-auto mb-2" />
                          <p className="font-bold">No products match your search or filter criteria.</p>
                          <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                            className="mt-2 text-xs font-bold text-[#B90064] hover:underline"
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr 
                          key={p.id}
                          className={`hover:bg-[#FCF9F8] transition-colors group ${
                            selectedIds.includes(p.id) ? 'bg-[#FFF0F5]/40' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => handleSelectRow(p.id)}
                              className="rounded border-[#E8E8E8] text-[#B90064] focus:ring-[#B90064]"
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[#F1EDEC] overflow-hidden border border-[#E8E8E8] shrink-0">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-bold text-[#1C1B1B] text-sm">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-[#594047] font-semibold">{p.sku}</td>
                          <td className="px-5 py-4 text-[#594047] font-medium">{p.category}</td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#1C1B1B]">${p.price.toFixed(2)} <span className="font-normal text-[#594047] text-[11px]">/ unit</span></div>
                            <div className="text-[11px] text-[#594047]">MOQ: {p.moq}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              p.status === 'Active'
                                ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                                : p.status === 'Pending Review'
                                ? 'bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]'
                                : 'bg-[#F1EDEC] text-[#594047] border-[#E8E8E8]'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => showToast(`Options for ${p.name}: Edit SKU, Update Price, or Toggle Status`)}
                              className="p-2 text-[#594047] hover:text-[#B90064] transition-colors rounded-lg hover:bg-[#F1EDEC]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 border-t border-[#E8E8E8] bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#594047]">
                <span>Showing 1 to {filteredProducts.length} of {products.length + 138} products</span>
                <div className="flex items-center gap-1">
                  <button disabled className="px-3 py-1 border border-[#E8E8E8] rounded-md bg-white text-[#594047] disabled:opacity-50 font-bold">Prev</button>
                  <button className="px-3 py-1 border border-[#E8E8E8] rounded-md bg-white text-[#1C1B1B] hover:bg-[#F1EDEC] font-bold">Next</button>
                </div>
              </div>
            </section>
          </main>

          {/* Right Sidebar Widget (Recent Enquiries) */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8E8E8] p-5 shadow-xs sticky top-24">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E8E8E8]">
                <h3 className="font-bold text-base text-[#1C1B1B]">Recent Enquiries</h3>
                <button 
                  onClick={() => showToast('Opening all 28 distributor enquiries inbox')}
                  className="text-xs font-bold text-[#B90064] hover:underline"
                >
                  View All (28)
                </button>
              </div>

              <div className="space-y-5">
                {enquiries.map((lead, idx) => (
                  <div key={lead.id} className="group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-[#1C1B1B]">{lead.name}</span>
                      <span className="text-[11px] text-[#594047]">{lead.timeAgo}</span>
                    </div>

                    <div className="text-[11px] text-[#594047] flex items-center gap-1 mb-2 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#B90064]" />
                      <span>{lead.location}</span>
                    </div>

                    <p className="text-xs text-[#1C1B1B] line-clamp-2 mb-3 leading-relaxed">
                      {lead.message}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveLeadModal({ lead, type: 'whatsapp' })}
                        className="flex-1 px-3 py-1.5 border border-[#B90064] text-[#B90064] rounded-xl text-xs font-bold hover:bg-[#FDE7F3] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setActiveLeadModal({ lead, type: 'email' })}
                        className="flex-1 px-3 py-1.5 border border-[#E8E8E8] text-[#594047] hover:text-[#1C1B1B] rounded-xl text-xs font-bold hover:bg-[#FCF9F8] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MailIcon className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>
                    </div>

                    {idx < enquiries.length - 1 && <hr className="mt-5 border-[#E8E8E8]" />}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Overview & Verification Standards View */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-in fade-in">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FFD1E3] text-[#B8005A] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              B2B Enterprise Solutions
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#1E1E1E] tracking-tight">
              Scale Your Beauty Brand or Salon Chain
            </h1>
            <p className="text-sm sm:text-base text-[#737373] mt-3 leading-relaxed">
              Nexora Luxe connects high-end beauty manufacturers, distributors, and professional salons through a single verified trade infrastructure.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={onOpenRegister}
                className="bg-[#B8005A] hover:bg-[#A0004E] text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>List Your Business — Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white border border-[#EDEDED] rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#B8005A] flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#B8005A] uppercase tracking-wider">For Manufacturers & Wholesalers</span>
                <h2 className="text-2xl font-bold text-[#1E1E1E] mt-1">Direct Access to 12,000+ Salons & Spas</h2>
                <p className="text-xs sm:text-sm text-[#737373] mt-2">
                  Eliminate friction in wholesale customer acquisition. Publish your line sheets, manage MOQ tiers, and receive verified RFQs directly.
                </p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#525252]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Automated MOQ tier calculations & sample dispatch</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Verified B2B Escrow & payment guarantee protection</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>European and North American regulatory compliance verification</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenRegister}
                className="mt-8 w-full bg-[#FFF0F5] hover:bg-[#B8005A] text-[#B8005A] hover:text-white border border-[#FFD1E3] py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Start as Supplier
              </button>
            </div>

            <div className="bg-white border border-[#EDEDED] rounded-3xl p-8 sm:p-10 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF0F5] text-[#B8005A] flex items-center justify-center mb-6">
                  <Store className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#B8005A] uppercase tracking-wider">For Salons, Spas & Clinics</span>
                <h2 className="text-2xl font-bold text-[#1E1E1E] mt-1">Unmatched Factory & Wholesale Rates</h2>
                <p className="text-xs sm:text-sm text-[#737373] mt-2">
                  Cut out multiple distributor markups. Order directly from licensed luxury manufacturers with certified authenticity and prompt logistics.
                </p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-[#525252]">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Single consolidated wholesale inquiry cart (RFQ)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Request complimentary samples before committing to bulk</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Local warehouse stock with 24-48h expedited dispatch</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenRegister}
                className="mt-8 w-full bg-[#FFF0F5] hover:bg-[#B8005A] text-[#B8005A] hover:text-white border border-[#FFD1E3] py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Start as Salon Buyer
              </button>
            </div>
          </div>

          {/* Verification Standards */}
          <div className="bg-[#FFFDFE] border border-[#FFD6E5] rounded-3xl p-8 sm:p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-[#B8005A] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E]">
              The Nexora Verification Standard
            </h2>
            <p className="text-xs sm:text-sm text-[#737373] mt-2 max-w-xl mx-auto">
              Every verified partner undergoes strict verification: business registration checks, authentic lab testing certifications, and customer satisfaction audits.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
              <div className="p-4 bg-white rounded-2xl border border-[#EDEDED]">
                <FileCheck className="w-6 h-6 text-[#B8005A] mb-2" />
                <h4 className="text-xs font-bold text-[#1E1E1E]">Entity Verification</h4>
                <p className="text-[11px] text-[#737373] mt-1">Official VAT / Tax ID and corporate registration checked with local authorities.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#EDEDED]">
                <Layers className="w-6 h-6 text-[#B8005A] mb-2" />
                <h4 className="text-xs font-bold text-[#1E1E1E]">Product Quality</h4>
                <p className="text-[11px] text-[#737373] mt-1">CE, FDA, Ecocert, and GMP manufacturing safety certificates verified.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#EDEDED]">
                <ShieldCheck className="w-6 h-6 text-[#B8005A] mb-2" />
                <h4 className="text-xs font-bold text-[#1E1E1E]">Fulfillment Audit</h4>
                <p className="text-[11px] text-[#737373] mt-1">98%+ on-time dispatch rate required to maintain verified gold badge status.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E8E8E8]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0F5] text-[#B90064] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1C1B1B]">Add New Product Listing</h3>
              </div>
              <button onClick={() => setIsAddProductOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1C1B1B] mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Royal Caviar Youth Elixir"
                  className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1B1B] mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="e.g. RCY-88"
                    className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8] font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1B1B] mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8] font-semibold"
                  >
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
                    <option value="Serums">Serums</option>
                    <option value="Cosmetics">Cosmetics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1B1B] mb-1">Wholesale Price (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="2500"
                    className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1B1B] mb-1">Minimum Order Qty (MOQ)</label>
                  <input
                    type="number"
                    value={newProduct.moq}
                    onChange={(e) => setNewProduct({ ...newProduct, moq: e.target.value })}
                    placeholder="50"
                    className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1B] mb-1">Product Photo / Image Upload (Max 5MB, Auto HD Resize & Frame Fit)</label>
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
                      placeholder="Paste image URL or upload photo ->"
                      className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8]"
                    />
                  </div>
                  <label className="cursor-pointer px-4 py-3 bg-[#FFF0F5] hover:bg-[#FFE0EC] text-[#B90064] font-bold rounded-xl border border-[#FFD1E3] flex items-center gap-2 shrink-0 transition-colors shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                {newProduct.imageUrl && (
                  <div className="mt-3 relative w-full h-32 bg-[#F6F3F2] rounded-xl overflow-hidden border border-[#E8E8E8] flex items-center justify-center group">
                    <img 
                      src={newProduct.imageUrl} 
                      alt="Preview Frame" 
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Camera className="w-4 h-4" /> HD Fitted in Frame
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E8E8E8]">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-5 py-2.5 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl hover:bg-[#F1EDEC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#B90064] hover:bg-[#8E004B] text-white font-bold rounded-xl shadow-xs"
                >
                  Publish to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD RESPONSE MODAL (WhatsApp / Email) */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                {activeLeadModal.type === 'whatsapp' ? (
                  <MessageSquare className="w-5 h-5 text-[#10B981]" />
                ) : (
                  <MailIcon className="w-5 h-5 text-[#B90064]" />
                )}
                <h3 className="font-bold text-base text-[#1C1B1B]">
                  Reply via {activeLeadModal.type === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </h3>
              </div>
              <button onClick={() => setActiveLeadModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#FCF9F8] rounded-2xl border border-[#E8E8E8]">
                <div className="font-bold text-[#1C1B1B]">{activeLeadModal.lead.name}</div>
                <div className="text-[11px] text-[#594047]">{activeLeadModal.lead.location} • {activeLeadModal.type === 'whatsapp' ? activeLeadModal.lead.phone : activeLeadModal.lead.email}</div>
                <p className="mt-2 text-[#594047] italic">"{activeLeadModal.lead.message}"</p>
              </div>

              <div>
                <label className="block font-bold text-[#1C1B1B] mb-1">Your Quote / Message Response:</label>
                <textarea
                  rows={3}
                  value={leadReplyText}
                  onChange={(e) => setLeadReplyText(e.target.value)}
                  placeholder="Hello, thank you for reaching out! We can accommodate your order with a 15% bulk discount..."
                  className="w-full p-3 border border-[#E8E8E8] rounded-xl focus:outline-none focus:border-[#B90064] bg-[#FCF9F8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveLeadModal(null)}
                  className="px-4 py-2 border border-[#E8E8E8] text-[#594047] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendLeadReply}
                  className="px-4 py-2 bg-[#B90064] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

