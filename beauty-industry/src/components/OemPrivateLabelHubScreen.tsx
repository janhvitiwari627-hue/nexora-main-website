import React, { useState } from 'react';
import { Sparkles, Layers, ShieldCheck, Mail, ArrowRight, HelpCircle, FileText, CheckCircle2, ChevronRight, MapPin, Building2, Beaker } from 'lucide-react';

interface OemPrivateLabelHubScreenProps {
  onOpenRFQModal: () => void;
  onOpenEnquiryModal: (productName: string, supplierName: string) => void;
  onOpenFacilityTour: (supplierName: string) => void;
  onNavigateToSuppliers: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
}

const MOCK_FORMULATION_TEMPLATE = [
  {
    id: 'f1',
    category: 'Skincare Actives',
    title: 'Advanced Peptide Barrier Formulation',
    moq: '1,000 Kg',
    leadTime: '15-21 Days',
    ingredients: ['Ceramide NP', 'Palmitoyl Tripeptide-5', 'Hyaluronic Acid', 'Squalane'],
    description: 'A deeply hydrating, barrier-restoring emulsion formulation designed for premium dermacosmetic brands. Stability tested across extreme temperature thresholds.',
    supplier: 'Aura Beauty Labs',
    supplierId: 'sup-1',
    estimatedPrice: '₹850 / Kg'
  },
  {
    id: 'f2',
    category: 'Haircare OEM',
    title: 'Keratin & Rosemary Intensive Therapy',
    moq: '2,500 Liters',
    leadTime: '12-18 Days',
    ingredients: ['Hydrolyzed Keratin', 'Rosemary Oil', 'Biotin', 'Argan Kernel Oil'],
    description: 'Sulfate-free scalp restoration therapeutic cleanser with excellent foaming profile and botanical extract suspension compatibility.',
    supplier: 'LuxeForm Organics',
    supplierId: 'sup-2',
    estimatedPrice: '₹420 / Liter'
  },
  {
    id: 'f3',
    category: 'Packaging & Jars',
    title: 'Double-Walled PCR Acrylic Cosmetic Jars',
    moq: '5,000 Units',
    leadTime: '30-45 Days (Custom tooling)',
    ingredients: ['PCR Acrylic', 'Aluminum Lid', 'Silicone Seal'],
    description: 'Eco-luxury dual-layer cosmetic containers with high product preservation thresholds and beautiful hot-stamping custom label areas.',
    supplier: 'CosmoPack Packaging Solutions',
    supplierId: 'sup-3',
    estimatedPrice: '₹22 - ₹35 / Unit'
  },
  {
    id: 'f4',
    category: 'Clean Makeup',
    title: 'High-Pigment Organic Matte Liquid Lipstick',
    moq: '10,000 Units',
    leadTime: '20-25 Days',
    ingredients: ['Organic Castor Oil', 'Natural Iron Oxides', 'Carnauba Wax'],
    description: 'Long-wearing, water-resistant formulation with completely vegan, clean-label active ingredients. Available in 24 customizable shades.',
    supplier: 'Radiant Cosmeceuticals',
    supplierId: 'sup-4',
    estimatedPrice: '₹85 / Unit'
  }
];

export const OemPrivateLabelHubScreen: React.FC<OemPrivateLabelHubScreenProps> = ({
  onOpenRFQModal,
  onOpenEnquiryModal,
  onOpenFacilityTour,
  onNavigateToSuppliers,
  onNavigateToSupplierProfile
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customVolume, setCustomVolume] = useState('');
  const [customFormulationType, setCustomFormulationType] = useState('');
  const [submittedForm, setSubmittedForm] = useState(false);

  const filteredFormulations = selectedCategory === 'All' 
    ? MOCK_FORMULATION_TEMPLATE
    : MOCK_FORMULATION_TEMPLATE.filter(f => f.category === selectedCategory);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFormulationType || !customVolume) return;
    setSubmittedForm(true);
    setTimeout(() => {
      setSubmittedForm(false);
      onOpenRFQModal();
    }, 1500);
  };

  return (
    <div className="bg-[#fdf8f8] min-h-screen">
      
      {/* Editorial Sourcing Banner */}
      <div className="bg-gradient-to-r from-[#1c1b1b] to-zinc-800 text-white py-12 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 hidden lg:block bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800')" }}></div>
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b90064] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
            <Sparkles className="w-3 h-3" />
            OEM, Private Label &amp; Formulation Sourcing Hub
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
            From Active Ingredients to Ready-to-Ship Products
          </h1>
          <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
            Direct access to state-of-the-art beauty contract manufacturers, raw materials suppliers, FDA-approved chemical laboratories, and custom beauty container plants.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenRFQModal}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-xs px-5 py-3 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Post Custom Formulation Requirement
            </button>
            <button
              onClick={onNavigateToSuppliers}
              className="border border-white/30 hover:border-white text-white bg-white/5 text-xs font-bold px-5 py-3 rounded-lg transition-all cursor-pointer"
            >
              Browse Manufacturing Plants
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active formulation templates catalog (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900">Pre-Formulated Private Label Templates</h2>
              <p className="text-xs text-[#594047]">Ready-to-order base formulations customizable with your proprietary active compounds.</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['All', 'Skincare Actives', 'Haircare OEM', 'Packaging & Jars', 'Clean Makeup'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#b90064] text-white'
                      : 'bg-[#f7f2f2] text-[#594047] hover:bg-[#e8e8e8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFormulations.map((f) => (
              <div key={f.id} className="bg-white border border-[#e8e8e8] hover:border-[#b90064] rounded-xl overflow-hidden flex flex-col justify-between transition-all">
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-[#fde7f3] text-[#b90064] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{f.category}</span>
                    <span className="text-xs font-mono font-bold text-zinc-400">Est. {f.estimatedPrice}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-950 leading-snug">{f.title}</h3>
                    <button 
                      onClick={() => onNavigateToSupplierProfile?.(f.supplierId)}
                      className="text-[11px] text-[#594047] font-semibold mt-0.5 hover:text-[#b90064] hover:underline transition-colors"
                    >
                      By: {f.supplier}
                    </button>
                  </div>

                  <p className="text-xs text-[#594047] leading-relaxed line-clamp-3">
                    {f.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-[#e8e8e8]">
                    <span className="block text-[9.5px] text-[#8c7077] font-bold uppercase tracking-wide">Key Active Ingredients</span>
                    <div className="flex flex-wrap gap-1">
                      {f.ingredients.map((ing, i) => (
                        <span key={i} className="text-[10px] bg-[#fcf9f8] border border-[#e8e8e8] text-zinc-800 px-2 py-0.5 rounded font-medium">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-[#fcf9f8] border-t border-[#e8e8e8] flex items-center justify-between text-xs">
                  <div className="text-left">
                    <span className="block text-[9px] text-[#8c7077] uppercase font-bold">MOQ Limit</span>
                    <span className="font-bold text-zinc-900">{f.moq}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenFacilityTour(f.supplier)}
                      className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      Audit Facility
                    </button>
                    <button
                      onClick={() => onOpenEnquiryModal(`Formulation Sample: ${f.title}`, f.supplier)}
                      className="bg-[#b90064] text-white font-extrabold px-3 py-1.5 rounded-md hover:bg-[#8e004b] transition-all cursor-pointer"
                    >
                      Request Lab Sample
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right: Custom Formulation RFQ Estimator (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#e8e8e8]">
              <Beaker className="w-5 h-5 text-[#b90064]" />
              <h3 className="font-extrabold text-sm text-zinc-950">Formulation Batch Estimator</h3>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Desired formulation category</label>
                <select
                  required
                  value={customFormulationType}
                  onChange={(e) => setCustomFormulationType(e.target.value)}
                  className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none rounded-lg p-2.5 text-xs text-[#1c1b1b]"
                >
                  <option value="">Select Formulation Type</option>
                  <option value="skin">Skincare Emulsions &amp; Serums</option>
                  <option value="hair">Clean Hair cleansers &amp; Tonics</option>
                  <option value="makeup">Vegan Color Cosmetics &amp; Foundations</option>
                  <option value="containers">Aerosol / Tube packaging</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#594047] uppercase tracking-wider mb-1.5">Target production volume</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5,000 Liters, 10,000 Custom Bottles"
                  value={customVolume}
                  onChange={(e) => setCustomVolume(e.target.value)}
                  className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:outline-none rounded-lg p-2.5 text-xs text-[#1c1b1b]"
                />
              </div>

              <div className="bg-[#f7f2f2] p-4 rounded-lg space-y-2 text-[#594047]">
                <span className="block font-bold text-[10px] text-[#8c7077] uppercase tracking-wider">Estimated Lab Lead-time</span>
                <p className="text-zinc-800 leading-tight">
                  Formulation stability profiling and toxicological batch records usually require **12 to 18 business days** depending on the specific botanical actives selected.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittedForm}
                className="w-full py-3 bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittedForm ? (
                  <span>Preparing RFQ draft...</span>
                ) : (
                  <>
                    <span>Generate Formulation RFQ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* OEM Standards Certification Badge card */}
          <div className="bg-[#fde7f3] border border-[#e0bec6] rounded-xl p-5 space-y-3">
            <h4 className="font-extrabold text-xs text-[#b90064] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              GMP &amp; ISO Manufacturing Standards
            </h4>
            <p className="text-[11px] text-[#594047] leading-relaxed">
              All partner formulation contract plants listed on Nexora are strictly vetted for **ISO 22716 certification**, cleanroom ventilation limits, GMP standards compliance, and animal cruelty-free licensing standards.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
