import React, { useState, useEffect } from 'react';
import { B2B_CATEGORIES } from '../data/categories';
import { 
  ShieldCheck, 
  ArrowRight, 
  Upload, 
  X, 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Building2, 
  Smartphone, 
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
  Briefcase,
  MapPin,
  Tag
} from 'lucide-react';

interface SupplierOnboardingScreenProps {
  onComplete: () => void;
  onNavigateToExplore: () => void;
  /** Authentication is completed by AuthModal before this screen is mounted. */
  authenticated?: boolean;
}

export const SupplierOnboardingScreen: React.FC<SupplierOnboardingScreenProps> = ({
  onComplete,
  onNavigateToExplore,
  authenticated = false
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(authenticated ? 2 : 1);
  
  // Step 1: Mobile Auth
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 2: Business Details
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [supplierType, setSupplierType] = useState('');
  const [isGstVerifying, setIsGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Draft Persistence Logic
  const saveDraft = () => {
    const draftData = {
      step,
      mobile,
      businessName,
      gstin,
      pincode,
      selectedState,
      selectedDistrict,
      supplierType,
      products
    };
    localStorage.setItem('nexora_onboarding_draft', JSON.stringify(draftData));
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Load Draft on Mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('nexora_onboarding_draft');
    if (savedDraft) {
      try {
        const data = JSON.parse(savedDraft);
        // A registered user resumes business onboarding, never the auth step.
        setStep(authenticated ? Math.max(2, data.step || 2) as 2 | 3 | 4 : (data.step || 1));
        setMobile(data.mobile || '');
        setBusinessName(data.businessName || '');
        setGstin(data.gstin || '');
        setPincode(data.pincode || '');
        setSelectedState(data.selectedState || '');
        setSelectedDistrict(data.selectedDistrict || '');
        setSupplierType(data.supplierType || '');
        setProducts(data.products || [{ id: '1', name: '', category: '', subCategory: '', price: '', moq: '', image: '' }]);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Clear draft on completion
  const handleFinalComplete = () => {
    localStorage.removeItem('nexora_onboarding_draft');
    onComplete();
  };

  // All India States and Union Territories Data
  const STATE_DISTRICT_DATA: Record<string, string[]> = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro"],
    "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
    "Goa": ["North Goa", "South Goa", "Panaji"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
    "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi-Dharwad", "Mangaluru"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Gwalior", "Jabalpur"],
    "Maharashtra": ["Mumbai Suburban", "Mumbai City", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
    "Manipur": ["Imphal", "Churachandpur"],
    "Meghalaya": ["Shillong", "Tura"],
    "Mizoram": ["Aizawl", "Lunglei"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    "Sikkim": ["Gangtok", "Namchi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Rangareddy"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Prayagraj"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani"],
    "West Bengal": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Durgapur"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Delhi": ["New Delhi", "North Delhi", "South Delhi", "West Delhi", "Central Delhi", "East Delhi"],
    "Jammu and Kashmir": ["Srinagar", "Jammu"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti"],
    "Puducherry": ["Puducherry"]
  };

  // Beauty Industry Category Data derived from standard taxonomy
  const BEAUTY_CATEGORY_DATA: Record<string, string[]> = B2B_CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = cat.subcategories;
    return acc;
  }, {} as Record<string, string[]>);

  // Mock Pincode Lookup for Major Sourcing Hubs
  const PINCODE_LOOKUP: Record<string, { state: string, district: string }> = {
    "400001": { state: "Maharashtra", district: "Mumbai City" },
    "411001": { state: "Maharashtra", district: "Pune" },
    "110001": { state: "Delhi", district: "New Delhi" },
    "380001": { state: "Gujarat", district: "Ahmedabad" },
    "560001": { state: "Karnataka", district: "Bengaluru Urban" },
    "600001": { state: "Tamil Nadu", district: "Chennai" },
    "700001": { state: "West Bengal", district: "Kolkata" },
    "500001": { state: "Telangana", district: "Hyderabad" },
    "302001": { state: "Rajasthan", district: "Jaipur" },
    "201301": { state: "Uttar Pradesh", district: "Noida" }
  };

  useEffect(() => {
    if (pincode.length === 6) {
      const data = PINCODE_LOOKUP[pincode];
      if (data) {
        setSelectedState(data.state);
        setSelectedDistrict(data.district);
      }
    }
  }, [pincode]);

  useEffect(() => {
    if (selectedState && selectedDistrict) {
      setLocation(`${selectedDistrict}, ${selectedState}`);
    }
  }, [selectedState, selectedDistrict]);

  // Step 3: Product Catalog
  const [products, setProducts] = useState<Array<{ id: string; name: string; category: string; subCategory: string; price: string; moq: string; image?: string }>>([
    { id: '1', name: '', category: '', subCategory: '', price: '', moq: '', image: '' }
  ]);

  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now().toString(), name: '', category: '', subCategory: '', price: '', moq: '', image: '' }]);
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProducts(products.map(p => p.id === id ? { ...p, image: reader.result as string } : p));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleProductChange = (id: string, field: string, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    
    setTimeout(() => {
      setIsVerifying(false);
      // Demo OTP check
      if (otp === '1234') {
        setStep(2);
        setOtp(''); // Clear for next potential use
      } else {
        alert('Invalid OTP. For Demo, please enter: 1234');
        setOtp('');
        // Reset inputs would be better, but clearing state is first step
      }
    }, 1200);
  };

  const handleVerifyGst = () => {
    setIsGstVerifying(true);
    setTimeout(() => {
      setIsGstVerifying(false);
      setGstVerified(true);
    }, 1200);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f8] flex flex-col md:flex-row font-sans">
      
      {/* LEFT COLUMN: Premium Context Panel */}
      <div className="hidden md:flex w-full md:w-5/12 lg:w-4/12 relative overflow-hidden flex-col justify-between p-10 border-r border-[#e8e8e8] bg-[#f0edec]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2087&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-[#fdf8f8]/60 to-white/95 z-0" />

        <div className="relative z-10">
          <span 
            onClick={onNavigateToExplore}
            className="text-xl font-black text-[#b90064] tracking-tight hover:underline cursor-pointer"
          >
            Nexora Luxe
          </span>
          <div className="mt-12 space-y-8">
            <h2 className="text-3xl font-black text-[#1c1b1b] leading-tight">
              Grow your B2B Beauty Business
            </h2>
            <div className="space-y-6">
              {[
                { title: 'Verified Identity', desc: 'Join India\'s most trusted directory of beauty manufacturers.' },
                { title: 'Global Discovery', desc: 'Reach thousands of premium professional buyers daily.' },
                { title: 'Smart Enquiries', desc: 'Receive high-quality commercial leads directly.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1c1b1b]">{item.title}</p>
                    <p className="text-[12px] text-[#594047]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white/70 backdrop-blur-md border border-[#e8e8e8] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#b90064]" />
            <p className="text-[13px] font-bold text-[#1c1b1b]">Onboarding Progress</p>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                  step > s ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  step === s ? 'bg-[#b90064] border-[#b90064] text-white shadow-md' : 
                  'bg-white border-[#e8e8e8] text-[#8c7077]'
                }`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                <span className={`text-[12px] font-bold ${step === s ? 'text-[#b90064]' : 'text-[#8c7077]'}`}>
                  {s === 1 && 'Authentication'}
                  {s === 2 && 'Business Details'}
                  {s === 3 && 'Product Catalog'}
                  {s === 4 && 'Verification & Launch'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form Content */}
      <div className="w-full md:w-7/12 lg:w-8/12 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[640px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* STEP 1: MOBILE AUTH */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black text-[#1c1b1b]">List Your Business</h1>
                <p className="text-[14px] text-[#594047]">Join the premier B2B network for beauty manufacturers and suppliers.</p>
              </div>

              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-8 shadow-sm space-y-6">
                {!isOtpSent ? (
                  <div className="space-y-4">
                    <label className="block text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8c7077]" />
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-12 pr-4 py-4 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl text-base font-bold text-[#1c1b1b] focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setIsOtpSent(true)}
                      className="w-full py-4 bg-[#b90064] hover:bg-[#8e004b] text-white font-black text-[14px] rounded-xl shadow-md transition-all active:scale-[0.98]"
                    >
                      Send OTP
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <p className="text-[13px] text-[#594047]">Enter 4-digit code sent to <span className="font-bold text-[#1c1b1b]">{mobile}</span></p>
                      <button onClick={() => setIsOtpSent(false)} className="text-[12px] font-bold text-[#b90064] hover:underline">Change Number</button>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            value={otp[i] || ''}
                            className="w-12 h-14 bg-[#fcf9f8] border-2 border-[#e8e8e8] focus:border-[#b90064] rounded-xl text-center text-xl font-bold text-[#1c1b1b] focus:outline-none transition-all"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) {
                                const newOtp = otp.split('');
                                newOtp[i] = val;
                                const combined = newOtp.join('');
                                setOtp(combined);
                                
                                // Auto-focus next input
                                if (val && i < 3) {
                                  const next = e.target.nextElementSibling as HTMLInputElement;
                                  if (next) next.focus();
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
                                if (prev) prev.focus();
                              }
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Demo Hint */}
                      <div className="bg-[#fde7f3]/30 border border-[#fde7f3] px-4 py-2 rounded-lg animate-pulse">
                        <p className="text-[11px] font-bold text-[#b90064] uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          For Demo, enter OTP: 1234
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={saveDraft}
                        className="flex-1 py-4 border border-[#e8e8e8] text-[#594047] font-bold text-[14px] rounded-xl hover:bg-[#fcf9f8] transition-all flex items-center justify-center gap-2"
                      >
                        Save Progress
                      </button>
                      <button
                        onClick={handleVerifyOtp}
                        disabled={isVerifying}
                        className="flex-[2] py-4 bg-[#b90064] hover:bg-[#8e004b] text-white font-black text-[14px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify & Continue</span>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS DETAILS */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black text-[#1c1b1b]">Business Details</h1>
                <p className="text-[14px] text-[#594047]">Tell us about your company to build your professional profile.</p>
              </div>

              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7077]" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Aura Cosmetics Labs"
                        className="w-full pl-10 pr-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">Business Type</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7077]" />
                      <select
                        value={supplierType}
                        onChange={(e) => setSupplierType(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064] appearance-none"
                      >
                        <option value="">Select Type</option>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Wholesaler">Wholesaler</option>
                        <option value="OEM">OEM / Private Label</option>
                        <option value="Raw Materials">Raw Materials</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">GST Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="15-digit GSTIN"
                        className="flex-1 px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064]"
                      />
                      <button
                        onClick={handleVerifyGst}
                        className="px-4 py-2 bg-[#fde7f3] text-[#b90064] font-black text-[11px] uppercase rounded-xl hover:bg-[#ffd9e2] transition-all"
                      >
                        Verify
                      </button>
                    </div>
                    {gstVerified && <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3" /> GST Verified</p>}
                  </div>
                  {/* Address Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 400001"
                        className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">State / UT</label>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedDistrict(''); // Reset district when state changes
                        }}
                        className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064] appearance-none"
                        required
                      >
                        <option value="">Select State</option>
                        {Object.keys(STATE_DISTRICT_DATA).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-[#1c1b1b] uppercase tracking-wider">District</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedState}
                      className="w-full px-4 py-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[13px] font-bold focus:outline-none focus:border-[#b90064] appearance-none disabled:opacity-50"
                      required
                    >
                      <option value="">{selectedState ? 'Select District' : 'Select State First'}</option>
                      {selectedState && STATE_DISTRICT_DATA[selectedState].map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={saveDraft}
                    className="flex-1 py-4 border border-[#e8e8e8] text-[#594047] font-bold text-[14px] rounded-xl hover:bg-[#fcf9f8] transition-all flex items-center justify-center gap-2"
                  >
                    Save Progress
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedState || !selectedDistrict || !pincode}
                    className="flex-[2] py-4 bg-[#b90064] hover:bg-[#8e004b] disabled:opacity-50 text-white font-black text-[14px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PRODUCT CATALOG */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-black text-[#1c1b1b]">Product Catalog</h1>
                <p className="text-[14px] text-[#594047]">Add your primary products to start receiving enquiries.</p>
              </div>

              <div className="space-y-4">
                {products.map((product, idx) => (
                  <div key={product.id} className="bg-white border border-[#e8e8e8] rounded-2xl p-6 shadow-sm space-y-4 relative animate-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-black text-[#b90064] uppercase tracking-widest">Product {idx + 1}</span>
                      {products.length > 1 && (
                        <button onClick={() => handleRemoveProduct(product.id)} className="text-[#8c7077] hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Interactive Image Upload Section */}
                      <div className="w-full md:w-32 lg:w-40 shrink-0 space-y-2">
                        <label className="text-[11px] font-bold text-[#594047] uppercase">Product Image</label>
                        <div className="relative group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(product.id, file);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          />
                          <div className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                            product.image 
                              ? 'border-[#b90064] bg-white' 
                              : 'border-[#e8e8e8] bg-[#fcf9f8] group-hover:border-[#b90064] group-hover:bg-[#fde7f3]/20'
                          }`}>
                            {product.image ? (
                              <div className="relative w-full h-full p-1">
                                <img 
                                  src={product.image} 
                                  alt="Product Preview" 
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Upload className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-[#8c7077] group-hover:text-[#b90064] mb-1" />
                                <span className="text-[10px] font-bold text-[#8c7077] group-hover:text-[#b90064]">Upload</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#594047] uppercase">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                            placeholder="e.g. Vitamin C Serum"
                            className="w-full px-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#b90064]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#594047] uppercase">Category</label>
                          <select
                            value={product.category}
                            onChange={(e) => {
                              handleProductChange(product.id, 'category', e.target.value);
                              handleProductChange(product.id, 'subCategory', ''); // Reset subcategory
                            }}
                            className="w-full px-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#b90064] appearance-none"
                          >
                            <option value="">Select Category</option>
                            {Object.keys(BEAUTY_CATEGORY_DATA).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#594047] uppercase">Sub-Category</label>
                          <select
                            value={product.subCategory}
                            onChange={(e) => handleProductChange(product.id, 'subCategory', e.target.value)}
                            disabled={!product.category}
                            className="w-full px-4 py-2.5 bg-[#fdf2f7]/30 border border-[#e8e8e8] hover:border-[#b90064]/30 focus:border-[#b90064] rounded-xl text-[12px] font-bold focus:outline-none focus:ring-4 focus:ring-[#b90064]/5 transition-all appearance-none disabled:opacity-50"
                          >
                            <option value="">{product.category ? 'Select Sub-Category' : 'Select Category First'}</option>
                            {product.category && BEAUTY_CATEGORY_DATA[product.category].map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#594047] uppercase">Price Range (₹)</label>
                          <input
                            type="text"
                            value={product.price}
                            onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                            placeholder="e.g. 250 - 450"
                            className="w-full px-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#b90064]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#594047] uppercase">Min Order (MOQ)</label>
                          <input
                            type="text"
                            value={product.moq}
                            onChange={(e) => handleProductChange(product.id, 'moq', e.target.value)}
                            placeholder="e.g. 500 Units"
                            className="w-full px-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-[12px] font-bold focus:outline-none focus:border-[#b90064]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddProduct}
                  className="w-full py-4 border-2 border-dashed border-[#e8e8e8] rounded-2xl text-[#8c7077] hover:text-[#b90064] hover:border-[#b90064] hover:bg-[#fde7f3]/10 transition-all flex items-center justify-center gap-2 font-bold text-[13px]"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Product</span>
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={saveDraft}
                    className="flex-1 py-4 border border-[#e8e8e8] text-[#594047] font-bold text-[14px] rounded-xl hover:bg-[#fcf9f8] transition-all flex items-center justify-center gap-2"
                  >
                    Save Progress
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-[2] py-4 bg-[#b90064] hover:bg-[#8e004b] text-white font-black text-[14px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-0"
                  >
                    <span>Build My Profile</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: VERIFICATION & SUMMARY */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50/50">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-[#1c1b1b]">Profile Ready for Review</h1>
                  <p className="text-[14px] text-[#594047]">Your business and catalog are ready. Submit them for Nexora review to unlock the verified badge.</p>
                </div>
              </div>

              <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#e8e8e8] bg-[#fcf9f8] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-[#e8e8e8] rounded-xl flex items-center justify-center text-[#b90064]">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1c1b1b]">{businessName || 'Your Business Name'}</h3>
                      <p className="text-[11px] text-[#594047] flex items-center gap-1"><MapPin className="w-3 h-3" /> {location || 'Location Not Set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pending Review
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-[#fdf8f8] rounded-xl border border-[#e8e8e8] text-center">
                      <p className="text-[9px] text-[#8c7077] uppercase font-black mb-1">Catalog</p>
                      <p className="text-lg font-black text-[#1c1b1b]">{products.length}</p>
                    </div>
                    <div className="p-3 bg-[#fdf8f8] rounded-xl border border-[#e8e8e8] text-center">
                      <p className="text-[9px] text-[#8c7077] uppercase font-black mb-1">Status</p>
                      <p className="text-[12px] font-black text-emerald-600">Active</p>
                    </div>
                    <div className="p-3 bg-[#fdf8f8] rounded-xl border border-[#e8e8e8] text-center">
                      <p className="text-[9px] text-[#8c7077] uppercase font-black mb-1">Reach</p>
                      <p className="text-lg font-black text-[#1c1b1b]">0</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-[#1c1b1b] uppercase tracking-widest border-b border-[#e8e8e8] pb-1">Listed Products</p>
                    {products.slice(0, 2).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[12px] text-[#594047]">
                        <div className="flex items-center gap-2">
                          {p.image ? (
                            <img src={p.image} className="w-8 h-8 rounded object-cover border border-[#e8e8e8]" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-[#fcf9f8] border border-[#e8e8e8] flex items-center justify-center">
                              <Tag className="w-3 h-3 text-[#8c7077]" />
                            </div>
                          )}
                          <span className="font-bold text-[#1c1b1b]">{p.name || 'Untitled Product'}</span>
                        </div>
                        <span>MOQ: {p.moq || 'Contact for MOQ'}</span>
                      </div>
                    ))}
                    {products.length > 2 && <p className="text-[10px] text-[#8c7077] font-bold">+ {products.length - 2} more items</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleFinalComplete}
                  className="w-full py-4 bg-[#b90064] hover:bg-[#8e004b] text-white font-black text-[14px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit for Nexora Review</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-[11px] text-[#8c7077] text-center">
                  By clicking launch, you agree to our B2B Marketplace Terms and Quality Standards.
                </p>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showSaveToast && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-[#e8e8e8] text-[#1c1b1b] px-6 py-3 rounded-2xl text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Progress saved as draft</span>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
