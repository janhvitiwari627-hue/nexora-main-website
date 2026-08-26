import React, { useState } from 'react';
import { 
  Building2, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  MapPin, 
  ChevronLeft,
  ShoppingBag,
  CreditCard,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BuyerOnboardingProps {
  onComplete: (data: any) => void;
  onNavigateToExplore: () => void;
}

export const BuyerOnboardingScreen: React.FC<BuyerOnboardingProps> = ({ onComplete, onNavigateToExplore }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    buyerCategory: '',
    designation: '',
    gstNumber: '',
    annualBudget: '',
    primaryCategories: [] as string[],
    location: '',
    notifications: {
      whatsapp: true,
      email: true
    }
  });

  const categories = [
    'Skincare & Serums',
    'Haircare & Treatments',
    'Makeup & Color Cosmetics',
    'Professional Equipment',
    'Organic & Ayurvedic',
    'Packaging & Containers',
    'OEM / Private Label'
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCategories: prev.primaryCategories.includes(cat)
        ? prev.primaryCategories.filter(c => c !== cat)
        : [...prev.primaryCategories, cat]
    }));
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FDF8F8] flex flex-col items-center py-12 px-4">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12">
        <div className="flex justify-between mb-3">
          <span className="text-[11px] font-bold text-[#B90064] uppercase tracking-wider">Step {step} of 4</span>
          <span className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-[#E8DFE3] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-[#B90064]"
          />
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-[#E8DFE3] rounded-2xl shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1C1B1B] mb-2">Business Identity</h1>
                <p className="text-sm text-[#594047]">Tell us about the business you're sourcing for.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">Company / Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                      placeholder="e.g. Radiant Beauty Solutions"
                      className="w-full pl-11 pr-4 py-3 bg-[#FCF9F8] border border-[#E8DFE3] rounded-xl focus:border-[#B90064] focus:outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">Buyer Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Retailer', 'Salon Chain', 'Brand Owner', 'Distributor'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormData({...formData, buyerCategory: cat})}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all text-center ${
                          formData.buyerCategory === cat 
                            ? 'bg-[#FDE7F3] border-[#B90064] text-[#B90064]' 
                            : 'bg-[#FCF9F8] border-[#E8DFE3] text-[#594047] hover:border-[#B90064]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">Designation / Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      value={formData.designation}
                      onChange={e => setFormData({...formData, designation: e.target.value})}
                      placeholder="e.g. Head of Procurement"
                      className="w-full pl-11 pr-4 py-3 bg-[#FCF9F8] border border-[#E8DFE3] rounded-xl focus:border-[#B90064] focus:outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between">
                <button onClick={onNavigateToExplore} className="text-sm font-bold text-[#594047] hover:text-[#B90064]">Skip for now</button>
                <button 
                  onClick={handleNext}
                  disabled={!formData.businessName || !formData.buyerCategory}
                  className="bg-[#B90064] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#8E004B] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1C1B1B] mb-2">Sourcing Preferences</h1>
                <p className="text-sm text-[#594047]">We'll personalize your experience based on your interests.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-4">What categories do you source most?</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                          formData.primaryCategories.includes(cat)
                            ? 'bg-[#B90064] border-[#B90064] text-white'
                            : 'bg-[#FCF9F8] border-[#E8DFE3] text-[#594047] hover:border-[#B90064]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">Estimated Annual Sourcing Budget</label>
                  <div className="grid grid-cols-1 gap-3">
                    {['Under ₹10 Lakhs', '₹10 Lakhs - ₹25 Lakhs', '₹25 Lakhs - ₹1 Crore', 'Over ₹1 Crore'].map(budget => (
                      <button
                        key={budget}
                        onClick={() => setFormData({...formData, annualBudget: budget})}
                        className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all text-left flex justify-between items-center ${
                          formData.annualBudget === budget 
                            ? 'bg-[#FDE7F3] border-[#B90064] text-[#B90064]' 
                            : 'bg-[#FCF9F8] border-[#E8DFE3] text-[#594047] hover:border-[#B90064]'
                        }`}
                      >
                        {budget}
                        {formData.annualBudget === budget && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-center">
                <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-bold text-[#594047] hover:text-[#B90064]">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleNext}
                  disabled={formData.primaryCategories.length === 0 || !formData.annualBudget}
                  className="bg-[#B90064] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#8E004B] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1C1B1B] mb-2">Verification & Location</h1>
                <p className="text-sm text-[#594047]">A verified GST boosts your trust score with manufacturers.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">GSTIN Number (Optional)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      value={formData.gstNumber}
                      onChange={e => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                      placeholder="e.g. 27AAACR1234F1Z5"
                      className="w-full pl-11 pr-4 py-3 bg-[#FCF9F8] border border-[#E8DFE3] rounded-xl focus:border-[#B90064] focus:outline-none text-sm transition-all uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 italic">You can add this later to become a 'Nexora Verified Buyer'.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#594047] uppercase tracking-wider mb-2">Primary Sourcing Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full pl-11 pr-4 py-3 bg-[#FCF9F8] border border-[#E8DFE3] rounded-xl focus:border-[#B90064] focus:outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-center">
                <button onClick={handleBack} className="flex items-center gap-1.5 text-sm font-bold text-[#594047] hover:text-[#B90064]">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-[#B90064] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#8E004B] transition-all flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 bg-[#FDE7F3] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#B90064]" />
              </div>

              <h1 className="text-2xl font-black text-[#1C1B1B] mb-2">You're all set!</h1>
              <p className="text-sm text-[#594047] mb-8">Welcome to Nexora Luxe. Your sourcing journey starts here.</p>

              <div className="bg-[#FCF9F8] border border-[#E8DFE3] rounded-2xl p-6 mb-8 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFE3]">
                    <ShoppingBag className="w-4 h-4 text-[#B90064]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Interests</p>
                    <p className="text-xs font-bold text-[#1C1B1B]">{formData.primaryCategories.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFE3]">
                    <CreditCard className="w-4 h-4 text-[#B90064]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Annual Budget</p>
                    <p className="text-xs font-bold text-[#1C1B1B]">{formData.annualBudget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFE3]">
                    <Bell className="w-4 h-4 text-[#B90064]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#594047] uppercase tracking-wider">Alerts</p>
                    <p className="text-xs font-bold text-[#1C1B1B]">WhatsApp & Email Enabled</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onComplete(formData)}
                className="w-full bg-[#B90064] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#8E004B] transition-all shadow-lg shadow-pink-100"
              >
                Go to My Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-400">By continuing, you agree to Nexora Luxe B2B Sourcing Terms.</p>
      </div>
    </div>
  );
};
