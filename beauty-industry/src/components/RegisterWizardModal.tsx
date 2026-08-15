import React, { useState, useRef } from 'react';
import { 
  X, CheckCircle2, ArrowRight, ArrowLeft, Building2, Store, 
  Upload, ShieldCheck, Lock, Smartphone, Check, Shield,
  BadgeCheck, FileText
} from 'lucide-react';
import { CategoryId } from '../types';
import { redirectToNexoraSignup } from '../auth';

interface RegisterWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterWizardModal: React.FC<RegisterWizardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState(3);
  const [role, setRole] = useState<'supplier' | 'buyer'>('supplier');

  // Step 1: Mobile & Phone OTP Verification
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['8', '4', '2', '1', '9', '0']);
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Step 2: Account & Business Details
  const [fullName, setFullName] = useState('Priyanka Sharma');
  const [email, setEmail] = useState('contact@aurumbotanics.in');
  const [businessName, setBusinessName] = useState('Aurum Botanics Jaipur');
  const [businessType, setBusinessType] = useState('Brand / Manufacturer');
  const [contactPerson, setContactPerson] = useState('Priyanka Sharma');
  const [yearEstablished, setYearEstablished] = useState('2018');
  const [businessDescription, setBusinessDescription] = useState('Curating exceptional organic luxury skincare formulations derived from rare botanical extracts.');
  const [pincode, setPincode] = useState('302001');
  const [city, setCity] = useState('Jaipur');
  const [stateRegion, setStateRegion] = useState('Rajasthan');
  const [address, setAddress] = useState('123 Malviya Nagar, Sector 4, Jaipur, Rajasthan, India');
  
  // Visual Identity & Media
  const [logoUploaded, setLogoUploaded] = useState(true);
  const [coverUploaded, setCoverUploaded] = useState(true);

  // Supply Regions
  const [supplyRegions, setSupplyRegions] = useState<string[]>(['Pan India', 'Jaipur']);
  const availableRegions = ['Pan India', 'Jaipur', 'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Pune'];

  // Beauty Categories & Highlights
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['skincare']);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>(['Direct Manufacturer', 'Cruelty Free']);

  const toggleRegion = (region: string) => {
    if (supplyRegions.includes(region)) {
      setSupplyRegions(supplyRegions.filter(r => r !== region));
    } else {
      setSupplyRegions([...supplyRegions, region]);
    }
  };

  const toggleHighlight = (hl: string) => {
    if (selectedHighlights.includes(hl)) {
      setSelectedHighlights(selectedHighlights.filter(h => h !== hl));
    } else {
      setSelectedHighlights([...selectedHighlights, hl]);
    }
  };

  // Step 3: Verification & Finalize
  const [gstinNumber, setGstinNumber] = useState('22AAAAA0000A1Z5');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>('GST_Certificate_Aurum_Botanics.pdf');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Product Line Sheet details
  const [productTitle, setProductTitle] = useState('Aura Hydration Active Peptide Serum');
  const [productCategory, setProductCategory] = useState<CategoryId>('skincare');
  const [wholesalePrice, setWholesalePrice] = useState('24.00');
  const [moq, setMoq] = useState('50');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'skincare', name: 'Skincare' },
    { id: 'haircare', name: 'Haircare' },
    { id: 'makeup', name: 'Makeup' },
    { id: 'fragrance', name: 'Fragrance' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'nails', name: 'Nails & Spa' },
    { id: 'tools', name: 'Salon Tools' },
  ];

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  // Handle OTP digit auto-advance
  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSendOtp = () => {
    if (!mobileNumber) return;
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    setIsPhoneVerified(true);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // No local/mock account is created here. Real account creation lives in
      // the canonical Nexora Sign up route, which uses the shared Supabase
      // project and preserves the single session / auth.users.id.
      onClose();
      redirectToNexoraSignup();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#FCF9F8] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-[#E0BEC6] relative flex flex-col lg:flex-row my-auto max-h-[94vh]">
        
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-white/90 hover:bg-[#FDE7F3] text-[#594047] hover:text-[#8E004B] border border-[#E0BEC6] flex items-center justify-center transition-all shadow-sm cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT EDITORIAL HERO SIDE (Desktop) */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-[#1C1B1B] min-h-[580px] p-8 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDLEk4i-zt_Xuta5DVvFbKbVHZ2YI9avucC9NUjqSLxKZERA4-7HVJ896BvEL0hvZntadcuoAUYR7YKxJEHRyXcCfINyC5WcnuFpCmjXL7QzbfplEx4sgD-tENg6z-gF3lKUaBomZIMLEzMqxFDDZ7-WDFs8fhLBvAtWTsEEXlIbqXGm4ubZwN2CO4VxJRrkpsesCmZfxY6dRx8xjkdxeL3ldFiJVqeAJJtHPvnO_4TEtY5LL8Yr25-')`
          }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-[11px] font-bold text-white bg-[#8E004B] px-3 py-1 rounded-full uppercase tracking-wider border border-[#FFCBD9]/30">
              Nexora Luxe Business
            </span>
          </div>

          {/* Bottom Headline & Callout */}
          <div className="relative z-10 space-y-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl">
              <h2 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                Elevate Your Business
              </h2>
              <p className="text-xs text-white/90 leading-relaxed font-normal mt-2">
                Join thousands of premium beauty brands curating exceptional experiences on Nexora Luxe.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 text-white/90 text-xs">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#8E004B] border-2 border-white flex items-center justify-center text-[10px] font-bold">12k</div>
                <div className="w-7 h-7 rounded-full bg-[#346BF0] border-2 border-white flex items-center justify-center text-[10px] font-bold">EU</div>
                <div className="w-7 h-7 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center text-[10px] font-bold">US</div>
              </div>
              <span className="text-[11px] font-medium text-white/80">Active Salons & Verified Wholesalers</span>
            </div>
          </div>
        </div>

        {/* RIGHT REGISTRATION WIZARD FORM */}
        <div className="w-full lg:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header Title */}
            <div className="mb-5 text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1B1B] tracking-tight">
                {step === 1 && 'Create Account'}
                {step === 2 && 'Business Details'}
                {step === 3 && 'Verification & Finalize'}
              </h1>
              <p className="text-xs text-[#594047] mt-1">
                {step === 1 && 'Verify your mobile number to get started.'}
                {step === 2 && 'Tell us about your brand and where you operate.'}
                {step === 3 && 'Almost there. Provide a few final details to set up your storefront.'}
              </p>
            </div>

            {/* Progress Stepper Indicator */}
            <div className="flex items-center justify-between mb-6 relative px-2 max-w-md mx-auto">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E0BEC6] -z-10" />
              
              {/* Step 1 */}
              <div className="flex flex-col items-center bg-[#FCF9F8] px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1 ? 'bg-[#10B981] text-white' : step === 1 ? 'bg-[#8E004B] text-white shadow-md' : 'bg-[#E6E1E1] text-[#594047]'
                }`}>
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 ${step === 1 ? 'text-[#8E004B]' : 'text-[#594047]'}`}>
                  01 Create
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center bg-[#FCF9F8] px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2 ? 'bg-[#10B981] text-white' : step === 2 ? 'bg-[#8E004B] text-white shadow-md' : 'bg-[#E6E1E1] text-[#594047]'
                }`}>
                  {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 ${step === 2 ? 'text-[#8E004B]' : 'text-[#594047]'}`}>
                  02 Add Business
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center bg-[#FCF9F8] px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3 ? 'bg-[#FDE7F3] text-[#8E004B] border border-[#8E004B] shadow-sm' : 'bg-[#E6E1E1] text-[#594047]'
                }`}>
                  3
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold mt-1.5 ${step === 3 ? 'text-[#8E004B]' : 'text-[#594047]'}`}>
                  03 Verify
                </span>
              </div>
            </div>

            {/* WIZARD COMPLETION STATE */}
            {isComplete ? (
              <div className="p-8 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-300 my-4">
                <div className="w-16 h-16 rounded-full bg-[#E8F5E9] border-2 border-[#10B981] flex items-center justify-center text-[#10B981] mb-4 shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C1B1B]">Continuing to Nexora sign up…</h3>
                <p className="text-xs text-[#594047] mt-2 max-w-md">
                  Your business profile for <strong className="text-[#8E004B]">{businessName}</strong> will be created securely with your Nexora account, so you can use the same identity across every Nexora app.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] bg-[#E8F5E9] border border-[#A7F3D0] px-4 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Redirecting to Nexora sign up</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ================= STEP 1: VERIFY PHONE NUMBER ================= */}
                {step === 1 && (
                  <div className="bg-white rounded-2xl border border-[#E0BEC6] p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#F1EDEC] pb-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#8E004B]" />
                        <h3 className="text-sm font-bold text-[#1C1B1B]">Step 1: Verify Mobile Number</h3>
                      </div>
                      <span className="text-[10px] font-bold text-[#8E004B] bg-[#FDE7F3] px-2.5 py-0.5 rounded-full">
                        Instant SMS OTP
                      </span>
                    </div>

                    {/* Account Role Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-[#594047] uppercase block mb-1.5">
                        Registration Role
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole('supplier')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            role === 'supplier'
                              ? 'border-[#8E004B] bg-[#FDE7F3] text-[#8E004B] font-bold'
                              : 'border-[#E0BEC6] bg-[#FCF9F8] text-[#594047]'
                          }`}
                        >
                          <Building2 className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="text-xs">Brand / Wholesaler</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole('buyer')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            role === 'buyer'
                              ? 'border-[#8E004B] bg-[#FDE7F3] text-[#8E004B] font-bold'
                              : 'border-[#E0BEC6] bg-[#FCF9F8] text-[#594047]'
                          }`}
                        >
                          <Store className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="text-xs">Salon / Spa Buyer</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Number Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                        Mobile Number
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-[#8C7077] focus-within:border-[#8E004B] focus-within:ring-1 focus-within:ring-[#8E004B]">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-[#F7F2F2] border-r border-[#E0BEC6] px-3 py-2 text-xs font-semibold text-[#1C1B1B] focus:outline-none"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+33">+33 (FR)</option>
                          <option value="+1">+1 (US)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+971">+971 (UAE)</option>
                        </select>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="flex-1 px-3 py-2 text-xs text-[#1C1B1B] font-semibold bg-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Send OTP button or OTP verification boxes */}
                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="w-full bg-[#8E004B] hover:bg-[#B90064] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Send OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="space-y-3 pt-2 border-t border-[#F1EDEC]">
                        <p className="text-xs text-[#594047]">
                          Enter the 6-digit code sent to <strong className="text-[#1C1B1B]">{countryCode} {mobileNumber}</strong>:
                        </p>
                        
                        {/* 6 OTP boxes */}
                        <div className="flex justify-between gap-2">
                          {otpValues.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={otpRefs[idx]}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpInput(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-10 h-12 text-center text-lg font-bold border border-[#E0BEC6] rounded-xl bg-[#F7F2F2] focus:bg-white focus:border-[#8E004B] focus:outline-none transition-all"
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            className="flex-1 bg-[#8E004B] hover:bg-[#B90064] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify & Continue</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="px-3 py-2.5 border border-[#8E004B] text-[#8E004B] hover:bg-[#FDE7F3] font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Resend
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= STEP 2: BUSINESS DETAILS ================= */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-[#E0BEC6] p-5 shadow-xs space-y-5">
                      <div className="flex items-center justify-between border-b border-[#F1EDEC] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#1C1B1B]">Step 02: Build Your Business Profile</h3>
                          <p className="text-[11px] text-[#594047]">Provide visual branding, location, and trade capabilities.</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#10B981] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Phone Verified
                        </span>
                      </div>

                      {/* SECTION 1: VISUAL IDENTITY */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider text-[#8E004B]">
                          1. Visual Identity
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Square Logo Upload */}
                          <div className="col-span-1">
                            <label className="block text-[11px] font-bold text-[#594047] mb-1">Brand Logo</label>
                            <div 
                              onClick={() => setLogoUploaded(!logoUploaded)}
                              className="aspect-square bg-[#F7F2F2] border border-dashed border-[#E0BEC6] rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-[#FDE7F3]/40 hover:border-[#8E004B] transition-all group"
                            >
                              {logoUploaded ? (
                                <div className="w-12 h-12 rounded-lg bg-white border border-[#E0BEC6] flex items-center justify-center text-[#8E004B] font-bold text-lg shadow-xs">
                                  AB
                                </div>
                              ) : (
                                <Upload className="w-6 h-6 text-[#8E004B] mb-1 group-hover:scale-110 transition-transform" />
                              )}
                              <span className="text-[10px] font-bold text-[#1C1B1B] mt-1">Square Logo</span>
                              <span className="text-[9px] text-[#594047]">JPG, PNG • Max 5MB</span>
                            </div>
                          </div>

                          {/* Landscape Cover Upload */}
                          <div className="col-span-1 sm:col-span-2">
                            <label className="block text-[11px] font-bold text-[#594047] mb-1">Cover Banner (16:9)</label>
                            <div 
                              onClick={() => setCoverUploaded(!coverUploaded)}
                              className="w-full h-[110px] bg-[#F7F2F2] border border-dashed border-[#E0BEC6] rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-[#FDE7F3]/40 hover:border-[#8E004B] transition-all group relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{
                                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDQuwT0m3RI0-eaRJhlOHwDC5wgfF3JxwBtPpjsDT6Fwb5jJ0uihdGvcf645AsUiTMNtsbb6L9Ad_MA8t2ApumdA5-LRSMUL9L_HB9OyfYXjPSngq3SxZ-5pIhE1q8muTFwxuiSek9o3Iu232TZEEo8V8eBvufIAHcCnegeo0p1kkpCAHobhR2iLfP4ZlxNUw1aMx_QjBCUVHCbW53eHLLMfaLJkiXPlRjYMlg5dBzVIKN-BPjxA4Sv')`
                              }} />
                              <Upload className="w-5 h-5 text-[#8E004B] mb-1 z-10 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold text-[#1C1B1B] z-10">Upload Landscape Cover (16:9)</span>
                              <span className="text-[9px] text-[#594047] z-10">JPG, PNG, WebP • Max 5MB</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: BUSINESS DETAILS */}
                      <div className="space-y-3 pt-2 border-t border-[#F1EDEC]">
                        <h4 className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider text-[#8E004B]">
                          2. Business Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                              Business Name *
                            </label>
                            <input
                              type="text"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              required
                              className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs font-semibold text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                              Business Type *
                            </label>
                            <select
                              value={businessType}
                              onChange={(e) => setBusinessType(e.target.value)}
                              className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs font-semibold text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                            >
                              <option value="Brand / Manufacturer">Brand / Manufacturer</option>
                              <option value="Distributor">Distributor</option>
                              <option value="Salon / Spa">Salon / Spa</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                              Contact Person
                            </label>
                            <input
                              type="text"
                              value={contactPerson}
                              onChange={(e) => setContactPerson(e.target.value)}
                              placeholder="e.g. Jane Doe"
                              className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs font-semibold text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                              Year Established
                            </label>
                            <input
                              type="text"
                              value={yearEstablished}
                              onChange={(e) => setYearEstablished(e.target.value)}
                              placeholder="YYYY"
                              className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs font-semibold text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[11px] font-bold text-[#594047] uppercase">
                                Business Description
                              </label>
                              <span className="text-[10px] text-[#8C7077] font-medium">{businessDescription.length} / 500</span>
                            </div>
                            <textarea
                              value={businessDescription}
                              onChange={(e) => setBusinessDescription(e.target.value.slice(0, 500))}
                              rows={2}
                              placeholder="Describe your luxury offerings..."
                              className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: LOCATION & REACH */}
                      <div className="space-y-3 pt-2 border-t border-[#F1EDEC]">
                        <h4 className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider text-[#8E004B]">
                          3. Location & Supply Reach
                        </h4>
                        
                        <div>
                          <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1">
                            Headquarters Address *
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street Address, City, Country"
                            required
                            className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2 px-3 text-xs font-semibold text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1.5">
                            Supply Regions *
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {availableRegions.map((region) => {
                              const isSelected = supplyRegions.includes(region);
                              return (
                                <button
                                  key={region}
                                  type="button"
                                  onClick={() => toggleRegion(region)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-[#FDE7F3] text-[#8E004B] border border-[#8E004B]/30'
                                      : 'bg-[#F7F2F2] text-[#594047] border border-[#E0BEC6] hover:bg-[#FDE7F3]/50'
                                  }`}
                                >
                                  <span>{region}</span>
                                  {isSelected ? <X className="w-3 h-3" /> : <span className="text-xs">+</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4: CATEGORIES & TRUST BADGES */}
                      <div className="space-y-3 pt-2 border-t border-[#F1EDEC]">
                        <h4 className="text-xs font-bold text-[#1C1B1B] uppercase tracking-wider text-[#8E004B]">
                          4. Categories & Business Highlights
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1.5">
                              Beauty Categories
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {categories.slice(0, 5).map((cat) => {
                                const isSelected = selectedCategories.includes(cat.id);
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#FDE7F3] text-[#8E004B] border border-[#8E004B]/30'
                                        : 'bg-[#F7F2F2] text-[#594047] border border-[#E0BEC6]'
                                    }`}
                                  >
                                    {cat.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#594047] uppercase mb-1.5">
                              Business Highlights
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {['Direct Manufacturer', 'Cruelty Free', 'Organic Certified', 'ISO 9001'].map((hl) => {
                                const isSelected = selectedHighlights.includes(hl);
                                return (
                                  <button
                                    key={hl}
                                    type="button"
                                    onClick={() => toggleHighlight(hl)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#FDE7F3] text-[#8E004B] border border-[#8E004B]/30'
                                        : 'bg-[#F7F2F2] text-[#594047] border border-[#E0BEC6]'
                                    }`}
                                  >
                                    {hl}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LIVE PUBLIC PREVIEW CARD */}
                      <div className="pt-3 border-t border-[#F1EDEC]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#1C1B1B] flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-[#8E004B]" />
                            <span>Live Public Preview Card</span>
                          </span>
                          <span className="text-[10px] font-bold text-[#594047] bg-[#F7F2F2] px-2 py-0.5 rounded">
                            Buyer View
                          </span>
                        </div>

                        <div className="bg-[#FCF9F8] border border-[#E0BEC6] rounded-2xl overflow-hidden shadow-xs relative">
                          <div className="h-20 w-full bg-[#1C1B1B] relative">
                            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{
                              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6C94sLZ5T4rO1RJ_4UbfINmAIT9f1G3NA4cj3kI6pVQEKBeKazqlxRMe2a5Nhmjl7fiFBG_IdFXr4L2S87cBaseqQwjLVT-Evzn1vCmVDkDhDcZxVVwXJF2e-ykRS5TKfpmgSUeMw9SpfTqomPX816voMlcmL8MXBk3w5BQGubE9sxNL1vzoO0JITJZUIpATLxN_llAPIfvGS_7mV2B-nwl8VsaRkPKUTty6nklF67qm__vA4By5i')`
                            }} />
                          </div>

                          <div className="p-4 pt-0 relative">
                            <div className="w-12 h-12 bg-white rounded-xl border border-[#E0BEC6] shadow-sm -mt-6 relative z-10 flex items-center justify-center font-bold text-sm text-[#8E004B]">
                              AB
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center gap-1">
                                <h5 className="font-bold text-sm text-[#1C1B1B]">{businessName || 'Aurum Botanics Jaipur'}</h5>
                                <BadgeCheck className="w-4 h-4 text-[#8E004B]" />
                              </div>
                              <p className="text-[11px] text-[#594047]">
                                {businessType} • Est. {yearEstablished}
                              </p>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="bg-[#FDE7F3] text-[#8E004B] text-[10px] font-bold px-2 py-0.5 rounded">
                                {selectedCategories[0] || 'Skincare'}
                              </span>
                              <span className="bg-[#E6E1E1] text-[#1C1B1B] text-[10px] font-medium px-2 py-0.5 rounded">
                                {supplyRegions[0] || 'Pan India'}
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-[#E0BEC6]/50 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="flex-1 bg-[#10B981] text-white text-[11px] font-bold py-2 rounded-xl text-center shadow-xs"
                              >
                                Send WhatsApp Enquiry
                              </button>
                              <button
                                type="button"
                                className="px-3 py-2 border border-[#8E004B] text-[#8E004B] text-[11px] font-bold rounded-xl"
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ================= STEP 3: VERIFICATION & FINALIZE ================= */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Business Verification Card */}
                    <div className="bg-white rounded-2xl border border-[#E0BEC6] p-4 sm:p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-[#1C1B1B] flex items-center gap-2 pb-2 border-b border-[#F1EDEC]">
                        <BadgeCheck className="w-5 h-5 text-[#8E004B]" />
                        <span>Business Verification</span>
                      </h3>

                      <div className="space-y-3.5">
                        {/* GSTIN Number Input */}
                        <div>
                          <label className="block text-xs font-semibold text-[#594047] mb-1">
                            GSTIN Number <span className="text-[#594047]/60 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={gstinNumber}
                            onChange={(e) => setGstinNumber(e.target.value)}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            className="w-full bg-[#F7F2F2] focus:bg-white border-b border-[#E0BEC6] focus:border-[#8E004B] py-2.5 px-3 text-xs font-medium text-[#1C1B1B] rounded-t-lg focus:outline-none transition-all"
                          />
                        </div>

                        {/* Document Upload Area */}
                        <div>
                          <label className="block text-xs font-semibold text-[#594047] mb-1.5">
                            Document Upload
                          </label>
                          <div 
                            onClick={() => setUploadedDocName('GST_Certificate_Aurum_Botanics.pdf')}
                            className="border border-dashed border-[#E0BEC6] bg-[#F7F2F2] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FDE7F3]/40 hover:border-[#8E004B] transition-all group"
                          >
                            <div className="flex gap-3 mb-3 text-[#8C7077] group-hover:text-[#8E004B] transition-colors">
                              <FileText className="w-7 h-7" />
                              <Building2 className="w-7 h-7" />
                            </div>
                            <p className="text-xs font-bold text-[#1C1B1B] mb-1">
                              Click to upload GST Certificate or Business License
                            </p>
                            <p className="text-[11px] text-[#594047]">
                              PDF, JPG, PNG up to 10MB
                            </p>

                            {uploadedDocName && (
                              <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#A7F3D0] text-[#10B981] text-xs font-medium shadow-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{uploadedDocName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wholesale Product Line Quick Section */}
                    <div className="bg-white rounded-2xl border border-[#E0BEC6] p-4 sm:p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-[#F1EDEC]">
                        <h3 className="text-sm font-bold text-[#1C1B1B] flex items-center gap-2">
                          <Upload className="w-4 h-4 text-[#8E004B]" />
                          <span>Initial Wholesale Line Sheet</span>
                        </h3>
                        <span className="text-[10px] font-bold text-[#8E004B] bg-[#FDE7F3] px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#594047] mb-1">Product Name</label>
                          <input 
                            type="text" 
                            value={productTitle} 
                            onChange={(e) => setProductTitle(e.target.value)} 
                            className="w-full bg-[#F7F2F2] border-b border-[#E0BEC6] py-1.5 px-2.5 text-xs font-medium text-[#1C1B1B] rounded-t focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#594047] mb-1">Wholesale Price (₹) / MOQ</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={`₹${wholesalePrice}`} 
                              onChange={(e) => setWholesalePrice(e.target.value.replace('₹', ''))} 
                              className="w-1/2 bg-[#F7F2F2] border-b border-[#E0BEC6] py-1.5 px-2.5 text-xs font-medium text-[#1C1B1B] rounded-t focus:outline-none" 
                            />
                            <input 
                              type="text" 
                              value={`${moq} Units`} 
                              onChange={(e) => setMoq(e.target.value.replace(' Units', ''))} 
                              className="w-1/2 bg-[#F7F2F2] border-b border-[#E0BEC6] py-1.5 px-2.5 text-xs font-medium text-[#1C1B1B] rounded-t focus:outline-none" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Action & Agreement Section */}
                    <div className="pt-2 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.value === 'true')}
                          className="mt-0.5 w-4 h-4 rounded border-[#E0BEC6] text-[#8E004B] focus:ring-[#8E004B] cursor-pointer"
                        />
                        <span className="text-xs text-[#594047] group-hover:text-[#1C1B1B] transition-colors">
                          I agree to Nexora <a href="#" className="text-[#8E004B] underline font-medium">Terms of Service</a> & <a href="#" className="text-[#8E004B] underline font-medium">Privacy Policy</a>.
                        </span>
                      </label>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onClose()}
                          className="w-full sm:w-1/2 py-3 px-5 rounded-full text-xs font-bold border border-[#8E004B] text-[#8E004B] hover:bg-[#FDE7F3] transition-colors text-center cursor-pointer"
                        >
                          Save & Continue Later
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !agreedToTerms}
                          className="w-full sm:w-1/2 py-3 px-5 rounded-full text-xs font-bold bg-gradient-to-r from-[#8E004B] to-[#B90064] text-white hover:opacity-90 transition-opacity text-center shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <span>{isSubmitting ? 'Creating Profile...' : 'Create My Profile'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Navigation Back Button for Steps 2 & 3 */}
                {step < 3 && (
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="w-1/3 py-2.5 px-4 rounded-xl border border-[#E0BEC6] text-xs font-bold text-[#594047] hover:bg-[#F7F2F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 bg-[#8E004B] hover:bg-[#B90064] text-white py-2.5 px-6 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Bottom Trust Area */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-4 mt-4 border-t border-[#E0BEC6]/50 text-[#594047]">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8E004B]" />
              <span className="text-[11px] font-medium">Secure Registration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[11px] font-medium">Business Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#346BF0]" />
              <span className="text-[11px] font-medium">Privacy Protected</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
