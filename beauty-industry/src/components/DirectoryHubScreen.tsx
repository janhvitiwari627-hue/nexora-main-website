import React, { useState } from 'react';
import { 
  Search, MapPin, ShieldCheck, Star, ArrowRight, Building2, 
  Sparkles, Layers, Users, Award, ChevronRight, Filter,
  FlaskConical, Package, Microscope, MessageSquare, Clock,
  CheckCircle2, Globe, TrendingUp
} from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';

interface DirectoryHubScreenProps {
  onNavigate: (screen: any, params?: any) => void;
  onOpenRFQModal: () => void;
}

const CATEGORIES = [
  { id: 'c1', name: 'OEM & Contract Manufacturing', icon: <Microscope className="w-5 h-5" />, count: '124 Plants', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'c2', name: 'Private Label Brands', icon: <Sparkles className="w-5 h-5" />, count: '450+ Brands', color: 'bg-[#fde7f3] text-[#b90064]' },
  { id: 'c3', name: 'Packaging & Containers', icon: <Package className="w-5 h-5" />, count: '85 Suppliers', color: 'bg-blue-50 text-blue-600' },
  { id: 'c4', name: 'Raw Material & Chemicals', icon: <FlaskConical className="w-5 h-5" />, count: '210 Labs', color: 'bg-amber-50 text-amber-600' },
];

const RECENT_RFQS = [
  { id: 'rfq1', product: 'Professional Vitamin C Serum', qty: '500 Units', location: 'Delhi, India', time: '10 mins ago', type: 'Private Label' },
  { id: 'rfq2', product: 'Organic Hair Spa Machine', qty: '15 Units', location: 'Mumbai, Maharashtra', time: '2 hours ago', type: 'Equipment' },
  { id: 'rfq3', product: 'Recyclable Glass Jars (50ml)', qty: '2,000 Pcs', location: 'Bengaluru, Karnataka', time: '4 hours ago', type: 'Packaging' },
  { id: 'rfq4', product: 'Hyaluronic Acid Raw Material', qty: '50 Kg', location: 'Ahmedabad, Gujarat', time: '6 hours ago', type: 'Raw Material' },
];

const FEATURED_SUPPLIERS = [
  {
    id: 's1',
    name: 'Aura Beauty Labs',
    type: 'Manufacturer',
    location: 'Mumbai, Maharashtra',
    rating: 4.9,
    certifications: ['ISO 22716', 'GMP'],
    specialty: 'Clinical Skincare & Serums',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 's2',
    name: 'LuxeForm Organics',
    type: 'OEM Specialist',
    location: 'Bengaluru, Karnataka',
    rating: 4.7,
    certifications: ['Ecocert', 'Vegan'],
    specialty: 'Organic Haircare & Bodycare',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 's3',
    name: 'CosmoPack India',
    type: 'Packaging Supplier',
    location: 'Delhi NCR',
    rating: 4.8,
    certifications: ['ISO 9001'],
    specialty: 'Sustainable Glass & PCR Jars',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&auto=format&fit=crop&q=60'
  }
];

export const DirectoryHubScreen: React.FC<DirectoryHubScreenProps> = ({
  onNavigate,
  onOpenRFQModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="bg-[#fdf8f8] min-h-screen">
      
      {/* Search & Hero Section */}
      <div className="bg-white border-b border-[#e8e8e8] py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-bold uppercase tracking-widest mb-4">
              <Building2 className="w-3.5 h-3.5" />
              Verified Beauty Business Directory
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[#1c1b1b] tracking-tight leading-[1.1]">
              Find the Right Manufacturing Partner for Your Beauty Brand
            </h1>
            <p className="text-sm md:text-base text-[#594047] mt-4 leading-relaxed">
              Browse through India's most comprehensive directory of audited OEM manufacturers, 
              private label suppliers, packaging plants, and raw material laboratories.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 max-w-4xl pt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search by company name, product category, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none rounded-xl pl-12 pr-4 py-4 text-sm"
              />
            </div>
            <button 
              onClick={() => onNavigate('search', { query: searchQuery })}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold px-8 py-4 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Search Directory
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-20">
        
        {/* Core Sourcing Categories */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-[#1c1b1b]">Browse by Sourcing Category</h2>
              <p className="text-xs text-[#594047] mt-1">Specialized manufacturing hubs for every stage of beauty product development.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate('supplier-directory', { category: cat.name })}
                className="bg-white border border-[#e8e8e8] hover:border-[#b90064] hover:shadow-lg p-6 rounded-2xl transition-all text-left group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {cat.icon}
                </div>
                <h3 className="font-bold text-sm text-zinc-900 group-hover:text-[#b90064] transition-colors">{cat.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[11px] text-[#594047] font-semibold">{cat.count}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#b90064] transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Live Sourcing Board (IndiaMART Style) */}
        <section className="space-y-8 bg-[#fcf9f8] p-8 md:p-12 rounded-[32px] border border-[#e8e8e8] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2 text-[#b90064] font-bold text-[10px] uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-[#b90064] animate-pulse"></span>
              Live Sourcing Board
            </div>
            <h2 className="text-2xl font-black text-[#1c1b1b]">Recent Buy Requirements</h2>
            <p className="text-xs text-[#594047]">Connect with active buyers and brands looking for manufacturing services right now.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {RECENT_RFQS.map((rfq) => (
              <div key={rfq.id} className="bg-white p-5 rounded-2xl border border-[#e8e8e8] hover:border-[#b90064] transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[9px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-full uppercase tracking-wider">{rfq.type}</span>
                  <div className="flex items-center gap-1 text-[9px] text-[#8c7077]">
                    <Clock className="w-3 h-3" />
                    {rfq.time}
                  </div>
                </div>
                <h4 className="font-extrabold text-sm text-zinc-950 leading-snug group-hover:text-[#b90064] transition-colors mb-2">{rfq.product}</h4>
                <div className="space-y-1 text-[11px] text-[#594047]">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>Qty: <span className="font-bold text-zinc-900">{rfq.qty}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{rfq.location}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('supplier-portal')}
                  className="w-full mt-4 bg-[#fcf9f8] border border-[#e8e8e8] group-hover:bg-[#b90064] group-hover:text-white group-hover:border-[#b90064] py-2 rounded-xl text-[11px] font-bold transition-all"
                >
                  Apply to Quote
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Manufacturers */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-[#1c1b1b]">Top-Rated Partner Manufacturers</h2>
              <p className="text-xs text-[#594047] mt-1">Suppliers with consistent 95%+ response rates and audited quality standards.</p>
            </div>
            <button 
              onClick={() => onNavigate('suppliers')}
              className="text-xs font-bold text-[#b90064] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Full Directory
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_SUPPLIERS.map((supp) => (
              <div 
                key={supp.id}
                onClick={() => onNavigate('supplier-profile', { supplier: supp })}
                className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={supp.image} 
                    alt={supp.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-white/20 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-zinc-900">{supp.rating}</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <VerifiedBadge overallRating={supp.rating} size="sm" />
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-950 group-hover:text-[#b90064] transition-colors">{supp.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#594047] mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{supp.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[11px] text-[#8c7077]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{supp.location}</span>
                  </div>

                  <div className="pt-3 border-t border-[#e8e8e8] flex flex-wrap gap-1.5">
                    {supp.certifications.map((cert) => (
                      <span key={cert} className="text-[9px] bg-[#f7f2f2] text-zinc-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {cert}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-[#b90064] font-bold">Specialty: {supp.specialty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verification Benefits Section */}
        <section className="bg-white border border-[#e8e8e8] rounded-[32px] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-16 space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-[#1c1b1b] tracking-tight">The Verified Sourcing Advantage</h2>
                <p className="text-sm text-[#594047] leading-relaxed">
                  Join 10,000+ beauty brands that source with confidence through our vetted manufacturing network. 
                  We eliminate sourcing risk through physical audits and document verification.
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  { title: 'Factory Audits', desc: 'Every listed plant undergoes a 48-point physical verification.', icon: <CheckCircle2 className="w-5 h-5" /> },
                  { title: 'Document Verification', desc: 'GST, ISO, and GMP certifications are manually cross-checked.', icon: <ShieldCheck className="w-5 h-5" /> },
                  { title: 'Response Guarantee', desc: 'Direct access to decision-makers at top contract plants.', icon: <MessageSquare className="w-5 h-5" /> }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950">{item.title}</h4>
                      <p className="text-[11px] text-[#594047] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#fde7f3] relative overflow-hidden flex items-center justify-center p-12">
               <div className="relative z-10 text-center space-y-6">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                   <Award className="w-10 h-10 text-[#b90064]" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-[#b90064]">Build with Trust</h3>
                    <p className="text-xs text-[#8e004b] mt-2 max-w-xs mx-auto">
                      Whether you are an established brand or a startup, our directory connects you to partners who grow with you.
                    </p>
                 </div>
                 <button 
                  onClick={() => onNavigate('onboarding')}
                  className="bg-[#b90064] text-white font-black text-xs px-10 py-4 rounded-xl shadow-lg hover:bg-[#8e004b] transition-all"
                 >
                   Get Your Business Verified
                 </button>
               </div>
               {/* Decorative Circles */}
               <div className="absolute top-[-50px] right-[-50px] w-64 h-64 border-4 border-[#b90064]/10 rounded-full"></div>
               <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 border-4 border-[#b90064]/10 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* OEM & Brand CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-[#1c1b1b] text-white p-8 rounded-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Layers className="w-48 h-48" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black tracking-tight">Are you a Manufacturer?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                Get listed on India's #1 B2B beauty directory. Showcase your facility, 
                catalog, and certifications to thousands of active buyers.
              </p>
              <button 
                onClick={() => onNavigate('supplier-portal')}
                className="bg-white text-zinc-950 font-black text-xs px-6 py-3 rounded-lg hover:bg-zinc-200 transition-all cursor-pointer"
              >
                Join as Supplier
              </button>
            </div>
          </div>

          <div className="bg-[#b90064] text-white p-8 rounded-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Microscope className="w-48 h-48" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black tracking-tight">Need a Custom Quote?</h3>
              <p className="text-sm text-[#f5ced8] leading-relaxed max-w-sm">
                Can't find a specific formulation? Post your detailed requirement and 
                get verified quotes from top contract plants within 24 hours.
              </p>
              <button 
                onClick={onOpenRFQModal}
                className="bg-white text-[#b90064] font-black text-xs px-6 py-3 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Post RFQ Now
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

