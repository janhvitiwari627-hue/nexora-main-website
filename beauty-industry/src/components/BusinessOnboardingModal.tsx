import React, { useState } from 'react';
import { X, Sparkles, Building2, Store, CheckCircle2, ArrowRight, ShieldCheck, HeartHandshake, MapPin, Camera, Link, Image as ImageIcon, Upload, Plus, Trash2, Clock } from 'lucide-react';

const popularSubcategories: Record<string, string[]> = {
  'Skincare': ['Anti-Aging', 'Acne Treatment', 'Moisturizers', 'Serums & Essences', 'Sun Protection', 'Facial Cleansers', 'Face Masks', 'Chemical Peels', 'Brightening'],
  'Haircare': ['Shampoos', 'Conditioners', 'Hair Masks', 'Hair Oils & Serums', 'Hair Thinning', 'Scalp Care', 'Keratin Treatments', 'Styling Creams'],
  'Hair Color': ['Permanent Color', 'Semi-Permanent', 'Bleach & Lighteners', 'Highlights & Balayage', 'Root Touch-Up', 'Developer', 'Color Care Shampoos'],
  'Makeup': ['Foundations & Primers', 'Lipsticks & Liners', 'Eye Palettes', 'Mascara', 'Blush & Highlighters', 'Setting Sprays', 'Concealers', 'Makeup Brushes'],
  'Nails': ['Gel Polish', 'Acrylic Nail Kits', 'Nail Art Decor', 'Nail Dehydrator', 'Cuticle Care', 'LED/UV Lamps', 'Manicure Tools', 'Pedicure Kits'],
  'Spa & Massage': ['Massage Oils', 'Essential Oils', 'Body Scrubs', 'Aroma Diffusers', 'Hot Stones', 'Massage Cream'],
  'Tattoo': ['Tattoo Ink', 'Tattoo Needles', 'Tattoo Machines', 'Aftercare Creams', 'Stencil Paper', 'Disinfectants'],
  'Salon Furniture': ['Styling Chairs', 'Shampoo Chairs', 'Manicure Tables', 'Pedicure Chairs', 'Reception Desks', 'Beauty Beds', 'Trolleys & Carts'],
  'Salon Tools & Equipment': ['Professional Dryers', 'Straighteners', 'Curling Wands', 'Clippers & Trimmers', 'Sterilizers', 'Facial Steamers', 'Ring Lights'],
  'Professional Beauty Products': ['Organic Formulations', 'Vegan Cosmetics', 'Ayurvedic Care', 'Korean Skincare', 'Cruelty-Free', 'Clinical Grade']
};

const popularBrands: Record<string, string[]> = {
  'Skincare': ['Dermalogica', 'Cetaphil', 'O3+', 'Lotus Herbals', "Cheryl's Cosmeceuticals", 'The Derma Co', 'Forest Essentials'],
  'Haircare': ["L'Oréal Professionnel", 'Wella Professionals', 'Schwarzkopf', 'Matrix', 'Olaplex', 'Streax Professional', 'Majestic Keratin'],
  'Hair Color': ["L'Oréal Professionnel", 'Wella Professionals', 'Schwarzkopf', 'Matrix', 'Streax Professional', 'Majestic Keratin'],
  'Makeup': ['MAC Cosmetics', 'Maybelline', 'Kryolan', 'PAC Cosmetics', 'Sugar Cosmetics', 'Bobbi Brown', 'Huda Beauty'],
  'Nails': ['OPI', 'Gelish', 'Bluesky', 'Shills Professional', 'Glam'],
  'Salon Tools & Equipment': ['Ikonic Professional', 'Vega Professional', 'BaBylissPRO', 'Dyson', 'Wahl Professional', 'Alan Truman'],
  'Spa & Massage': ['Aroma Magic', 'Biotique', "Cheryl's"],
  'Tattoo': ['Kuro Sumi', 'Dynamic Ink', 'Intenze Ink'],
  'Salon Furniture': ['Takara Belmont', 'Esthetica', 'Rem', 'BeautyStar'],
  'Professional Beauty Products': ["L'Oréal Professionnel", 'Dermalogica', 'Olaplex', 'OPI', 'Kryolan']
};

const getRecommendedBrands = (cat: string, subs: string[]): string[] => {
  const brands = new Set<string>();
  
  // Add primary category brands
  const catBrands = popularBrands[cat] || [];
  catBrands.forEach(b => brands.add(b));
  
  // Add subcategory brands if any subcategory matches keys in popularBrands
  subs.forEach(sub => {
    Object.keys(popularBrands).forEach(key => {
      if (sub.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(sub.toLowerCase())) {
        popularBrands[key].forEach(b => brands.add(b));
      }
    });
  });
  
  return Array.from(brands);
};

const handleImageResizeUpload = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  callback: (base64: string) => void
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

interface BusinessOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (onboardingData: any) => void;
  initialCity?: string;
}

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialCity = 'Mumbai'
}) => {
  const [step, setStep] = useState<number>(1);
  const [companyType, setCompanyType] = useState<string>('Salon & Spa Chain');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Skincare & Facials',
    'Haircare & Treatments'
  ]);
  const [scale, setScale] = useState<string>('₹1L - ₹5L / month');
  const [city, setCity] = useState<string>(initialCity);
  
  // Step 4: Branding
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [logo, setLogo] = useState('');
  const [cover, setCover] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  // Step 5: Categories
  const [primaryCategory, setPrimaryCategory] = useState('Skincare');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subCategoryInput, setSubCategoryInput] = useState('');
  const [keyBrands, setKeyBrands] = useState<string[]>(['Dermalogica', 'Cetaphil', 'O3+']);
  const [keyBrandInput, setKeyBrandInput] = useState('');

  // Step 6: Operating Hours
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [operatingHours, setOperatingHours] = useState<Record<string, { closed: boolean; open: string; close: string }>>(
    daysOfWeek.reduce((acc, day) => ({
      ...acc,
      [day]: { closed: day === 'Sun', open: '09:00', close: '18:00' }
    }), {})
  );


  // Step 7: Wholesale/MOQ
  const [generalMoq, setGeneralMoq] = useState('');
  const [moqNote, setMoqNote] = useState('');

  // Step 8: Products
  const [initialProducts, setInitialProducts] = useState<any[]>([]);
  const [currentProduct, setCurrentProduct] = useState({
    image: '', name: '', brand: '', category: '', variant: '', description: '', mrp: '', wholesalePrice: '', moq: '', stockStatus: 'In Stock'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const companyTypes = [
    { title: 'Salon & Spa Chain / Studio', desc: 'Professional salon, spa, or multi-location salon business', icon: Building2 },
    { title: 'Aesthetic Clinic & Dermatology', desc: 'Medical aesthetic clinic, laser center or dermatologist office', icon: ShieldCheck },
    { title: 'Wholesaler & Regional Distributor', desc: 'B2B distributor supplying brands to salons & retail stores', icon: Store },
    { title: 'Beauty Brand / OEM Manufacturer', desc: 'Formulating or manufacturing private label beauty & cosmetics', icon: Sparkles },
    { title: 'Independent Professional / MUA', desc: 'Freelance makeup artist, hairstylist or boutique aesthetician', icon: HeartHandshake }
  ];

  const serviceOptions = [
    'Skincare & Facials',
    'Haircare & Treatments',
    'Hair Color & Bleach',
    'Professional Makeup',
    'Nail Care & Extensions',
    'Spa & Body Massages',
    'Laser & Aesthetic Devices',
    'Salon Furniture & Fitouts',
    'Backbar Essentials'
  ];

  const scaleOptions = [
    'Under ₹50,000 / month',
    '₹50,000 - ₹2,00,000 / month',
    '₹2,00,000 - ₹10,00,000 / month',
    '₹10,00,000+ / month (Enterprise)'
  ];

  const toggleService = (srv: string) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter(s => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleFinish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onComplete({
        companyType,
        services: selectedServices,
        scale,
        city,
        branding: { website, instagram, facebook, linkedin, logo, cover, gallery },
        categories: { primaryCategory, subCategories, keyBrands },
        operatingHours,
        wholesale: { generalMoq, moqNote },
        initialProducts
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#F0E6EC] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#FFF0F5] to-white border-b border-[#F0E6EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B8005A] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1E1E]">Business Sourcing Onboarding</h2>
              <p className="text-xs text-[#737373]">Tailor your Nexora B2B dashboard to your salon & clinic catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#1E1E1E] hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F0E6EC] h-1.5 flex">
          <div
            className="bg-[#B8005A] transition-all duration-300"
            style={{ width: (step / 7) * 100 + '%' }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: Company Type */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 1 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">What best describes your business?</h3>
                <p className="text-xs text-[#737373]">This helps us match you with verified manufacturers and wholesale pricing tiers.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {companyTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = companyType === item.title;
                  return (
                    <div
                      key={item.title}
                      onClick={() => setCompanyType(item.title)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                        isSelected
                          ? 'border-[#B8005A] bg-[#FFF0F5]/50 shadow-sm'
                          : 'border-[#EAE5DE] hover:border-[#B8005A]/40 bg-white'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${isSelected ? 'bg-[#B8005A] text-white' : 'bg-[#F4F1ED] text-[#525252]'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#1E1E1E]">{item.title}</h4>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#B8005A]" />}
                        </div>
                        <p className="text-xs text-[#737373] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-[#1E1E1E] mb-1">Primary Operating City</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm font-medium focus:outline-none focus:border-[#B8005A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Primary Beauty Services / Sourcing Categories */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 2 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Select your primary services & sourcing needs</h3>
                <p className="text-xs text-[#737373]">Choose all categories you regularly stock or provide to your clientele.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {serviceOptions.map((srv) => {
                  const isChecked = selectedServices.includes(srv);
                  return (
                    <div
                      key={srv}
                      onClick={() => toggleService(srv)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isChecked
                          ? 'border-[#B8005A] bg-[#FFF0F5] text-[#B8005A] font-bold shadow-xs'
                          : 'border-[#EAE5DE] bg-white text-[#4A4A4A] hover:border-[#B8005A]/40'
                      }`}
                    >
                      <span className="text-xs">{srv}</span>
                      <div className="flex justify-end mt-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'bg-[#B8005A] border-[#B8005A] text-white' : 'border-[#D1D5DB]'}`}>
                          {isChecked && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Monthly Sourcing Scale */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 3 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Estimated Monthly Sourcing Budget</h3>
                <p className="text-xs text-[#737373]">This unlocks bulk wholesale volume discounts & direct factory rebates.</p>
              </div>

              <div className="space-y-2.5">
                {scaleOptions.map((opt) => {
                  const isSelected = scale === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => setScale(opt)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#B8005A] bg-[#FFF0F5] shadow-xs'
                          : 'border-[#EAE5DE] bg-white hover:border-[#B8005A]/40'
                      }`}
                    >
                      <span className={`text-sm ${isSelected ? 'font-bold text-[#B8005A]' : 'font-medium text-[#1E1E1E]'}`}>
                        {opt}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[#B8005A] border-[#B8005A] text-white' : 'border-[#D1D5DB]'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: BRANDING & VISUAL IDENTITY */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 4 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Branding & Visual Identity</h3>
                <p className="text-xs text-[#737373]">Help buyers recognize your business with your logo and showcase photos.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                    Business Logo <span className="text-[10px] font-normal text-[#737373]">(Recommended: Square 200 × 200 px • Auto-resized)</span>
                  </label>
                  <input
                    type="file"
                    id="business-logo-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageResizeUpload(file, 200, 200, (base64) => setLogo(base64));
                      }
                    }}
                  />
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => document.getElementById('business-logo-input')?.click()}
                      className="w-16 h-16 rounded-xl bg-[#FAFAFA] border-2 border-dashed border-[#EAE5DE] flex items-center justify-center text-[#B8005A] overflow-hidden shrink-0 cursor-pointer hover:bg-[#FFF0F5] hover:border-[#B8005A]/40 transition-all duration-150"
                    >
                      {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6" />}
                    </div>
                    <button 
                      type="button"
                      onClick={() => document.getElementById('business-logo-input')?.click()}
                      className="text-xs font-semibold text-[#B8005A] border border-[#B8005A] px-3 py-1.5 rounded-lg hover:bg-[#FFF0F5] transition-colors"
                    >
                      {logo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-1">
                    Wide Cover Banner <span className="text-[10px] font-normal text-[#737373]">(Recommended: Wide 1200 × 400 px • Auto-resized)</span>
                  </label>
                  <input
                    type="file"
                    id="wide-cover-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageResizeUpload(file, 1200, 400, (base64) => setCover(base64));
                      }
                    }}
                  />
                  <div 
                    onClick={() => document.getElementById('wide-cover-input')?.click()}
                    className="h-24 rounded-xl bg-[#FAFAFA] border-2 border-dashed border-[#EAE5DE] flex items-center justify-center text-[#B8005A] overflow-hidden cursor-pointer hover:bg-[#FFF0F5] hover:border-[#B8005A]/40 transition-all duration-150"
                  >
                    {cover ? <img src={cover} alt="Cover" className="w-full h-full object-cover" /> : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-semibold">Upload Cover</span>
                        <span className="text-[9px] text-[#8E8E93] mt-0.5">Click or drag & drop</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-1 flex items-center justify-between">
                    <span>
                      Showcase / Gallery Photos <span className="text-[10px] font-normal text-[#737373]">(Recommended: Standard 800 × 600 px • Auto-resized)</span>
                    </span>
                    <span className="text-[#8E8E93] font-normal">{gallery.length}/5</span>
                  </label>
                  <input
                    type="file"
                    id="gallery-photos-input"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && gallery.length < 5) {
                        handleImageResizeUpload(file, 800, 600, (base64) => {
                          setGallery([...gallery, base64]);
                        });
                      }
                    }}
                  />
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {gallery.map((img, i) => (
                      <div key={i} className="w-20 h-20 rounded-xl border border-[#EAE5DE] shrink-0 overflow-hidden relative group">
                        <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                        <button 
                          type="button"
                          onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {gallery.length < 5 && (
                      <button 
                        type="button"
                        onClick={() => document.getElementById('gallery-photos-input')?.click()}
                        className="w-20 h-20 rounded-xl bg-[#FAFAFA] border-2 border-dashed border-[#EAE5DE] flex flex-col items-center justify-center text-[#B8005A] shrink-0 hover:bg-[#FFF0F5] hover:border-[#B8005A]/40 transition-all duration-150"
                      >
                        <Plus className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-semibold">Add</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[#1E1E1E]">Social & Web Links</label>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
                    <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]" />
                  </div>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]" />
                  </div>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
                    <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]" />
                  </div>
                  <div className="relative">
                    <Link className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
                    <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn URL" className="w-full pl-10 pr-4 py-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BUSINESS CATEGORIES & SPECIALIZATION */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 5 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Business Categories</h3>
                <p className="text-xs text-[#737373]">Select your primary beauty category and key brands handled.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-2">Primary Beauty Category</label>
                  <select
                    value={primaryCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryCategory(val);
                      setSubCategories([]);
                      const defaultBrands = popularBrands[val] ? popularBrands[val].slice(0, 3) : [];
                      setKeyBrands(defaultBrands);
                    }}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]"
                  >
                    {['Skincare', 'Haircare', 'Hair Color', 'Makeup', 'Nails', 'Spa & Massage', 'Tattoo', 'Salon Furniture', 'Salon Tools & Equipment', 'Professional Beauty Products'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-1">Subcategories</label>
                  <p className="text-[10px] text-[#737373] mb-2">Type a subcategory and press Enter, or click the suggestions below:</p>
                  
                  {/* Popular Subcategories suggestions */}
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl max-h-[140px] overflow-y-auto">
                    {(popularSubcategories[primaryCategory] || []).map(item => {
                      const isAdded = subCategories.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setSubCategories(subCategories.filter(s => s !== item));
                            } else {
                              setSubCategories([...subCategories, item]);
                            }
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150 ${
                            isAdded
                              ? 'bg-[#B8005A] border-[#B8005A] text-white shadow-xs'
                              : 'bg-white border-[#EAE5DE] text-[#525252] hover:bg-[#FFF0F5] hover:text-[#B8005A] hover:border-[#FFD1E3]'
                          }`}
                        >
                          {isAdded ? `✓ ${item}` : `+ ${item}`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {subCategories.map(sub => (
                      <span key={sub} className="bg-[#F0FDF4] text-[#10B981] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 border border-[#A7F3D0]">
                        {sub}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setSubCategories(subCategories.filter(s => s !== sub))} />
                      </span>
                    ))}
                  </div>
                  <div className="mb-1 text-[10px] text-[#B8005A] bg-[#FFF0F5] px-2.5 py-1 rounded-lg border border-[#FFD1E3] font-medium">
                    💡 <strong>What to write:</strong> Type any specific treatment, service name, or product type (e.g. <em>Deep Hydration, Scalp Treatment, Nail Extensions</em>) and press <strong>Enter</strong> to add.
                  </div>
                  <input
                    type="text"
                    value={subCategoryInput}
                    onChange={(e) => setSubCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && subCategoryInput.trim()) {
                        e.preventDefault();
                        if (!subCategories.includes(subCategoryInput.trim())) {
                          setSubCategories([...subCategories, subCategoryInput.trim()]);
                        }
                        setSubCategoryInput('');
                      }
                    }}
                    placeholder="Type custom subcategory (e.g. Hydrating Facial) & press Enter..."
                    className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1E1E] mb-1">Key Brands Handled</label>
                  <p className="text-[10px] text-[#737373] mb-2">Type a brand and press Enter, or select from trending brands below:</p>
                  
                  {/* Dynamic brand suggestions list based on primaryCategory and subcategories */}
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl max-h-[140px] overflow-y-auto">
                    {getRecommendedBrands(primaryCategory, subCategories).map(brand => {
                      const isAdded = keyBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setKeyBrands(keyBrands.filter(b => b !== brand));
                            } else {
                              setKeyBrands([...keyBrands, brand]);
                            }
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150 ${
                            isAdded
                              ? 'bg-[#B8005A] border-[#B8005A] text-white shadow-xs'
                              : 'bg-white border-[#EAE5DE] text-[#525252] hover:bg-[#FFF0F5] hover:text-[#B8005A] hover:border-[#FFD1E3]'
                          }`}
                        >
                          {isAdded ? `✓ ${brand}` : `+ ${brand}`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {keyBrands.map(brand => (
                      <span key={brand} className="bg-[#FFF0F5] text-[#B8005A] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 border border-[#FFD1E3]">
                        {brand}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setKeyBrands(keyBrands.filter(b => b !== brand))} />
                      </span>
                    ))}
                  </div>
                  <div className="mb-1 text-[10px] text-[#B8005A] bg-[#FFF0F5] px-2.5 py-1 rounded-lg border border-[#FFD1E3] font-medium">
                    💡 <strong>What to write:</strong> Type any professional, premium, or local cosmetic/salon brands you work with (e.g. <em>CeraVe, Mamaearth, L'Oréal</em>) and press <strong>Enter</strong> to add.
                  </div>
                  <input
                    type="text"
                    value={keyBrandInput}
                    onChange={(e) => setKeyBrandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && keyBrandInput.trim()) {
                        e.preventDefault();
                        if (!keyBrands.includes(keyBrandInput.trim())) {
                          setKeyBrands([...keyBrands, keyBrandInput.trim()]);
                        }
                        setKeyBrandInput('');
                      }
                    }}
                    placeholder="Type custom brand name (e.g. CeraVe) & press Enter..."
                    className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-[#EAE5DE] rounded-xl text-sm focus:outline-none focus:border-[#B8005A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: OPERATING HOURS */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 6 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Operating Hours</h3>
                <p className="text-xs text-[#737373]">Set your standard business working hours.</p>
              </div>
              <div className="space-y-3">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center justify-between bg-[#FAFAFA] p-3 rounded-xl border border-[#EAE5DE]">
                    <div className="flex items-center gap-3 w-24">
                      <input
                        type="checkbox"
                        checked={!operatingHours[day].closed}
                        onChange={(e) => setOperatingHours({ ...operatingHours, [day]: { ...operatingHours[day], closed: !e.target.checked } })}
                        className="w-4 h-4 accent-[#B8005A] rounded"
                      />
                      <span className="text-sm font-bold text-[#1E1E1E]">{day}</span>
                    </div>
                    {!operatingHours[day].closed ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={operatingHours[day].open}
                          onChange={(e) => setOperatingHours({ ...operatingHours, [day]: { ...operatingHours[day], open: e.target.value } })}
                          className="px-2 py-1 bg-white border border-[#EAE5DE] rounded text-xs focus:outline-none focus:border-[#B8005A]"
                        />
                        <span className="text-xs text-[#737373]">to</span>
                        <input
                          type="time"
                          value={operatingHours[day].close}
                          onChange={(e) => setOperatingHours({ ...operatingHours, [day]: { ...operatingHours[day], close: e.target.value } })}
                          className="px-2 py-1 bg-white border border-[#EAE5DE] rounded text-xs focus:outline-none focus:border-[#B8005A]"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 text-xs font-semibold text-[#8E8E93]">Closed</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: FINAL REVIEW */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider">Step 7 of 7</span>
                <h3 className="text-lg font-bold text-[#1E1E1E]">Review Profile</h3>
                <p className="text-xs text-[#737373]">Please review your business details before publishing.</p>
              </div>
              
              <div className="bg-[#F9F6F8] rounded-2xl border border-[#F0E6EC] overflow-hidden">
                <div className="h-20 bg-gray-200 relative">
                  {cover ? <div className="w-full h-full bg-[#EAE5DE]"></div> : <div className="w-full h-full bg-[#EAE5DE] flex items-center justify-center text-xs text-[#737373]">Cover Banner</div>}
                  <div className="absolute -bottom-6 left-4 w-12 h-12 bg-white rounded-lg border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-[#B8005A]">
                    {logo ? 'LOGO' : 'LOGO'}
                  </div>
                </div>
                <div className="p-4 pt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">Business Summary</h4>
                    <button onClick={() => setStep(1)} className="text-[10px] text-[#B8005A] font-bold underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-[#525252]">
                    <div><span className="text-[#737373] block mb-0.5">Type</span> {companyType}</div>
                    <div><span className="text-[#737373] block mb-0.5">Location</span> {city}</div>
                    <div className="col-span-2"><span className="text-[#737373] block mb-0.5">Focus</span> {selectedServices.join(', ')}</div>
                    <div className="col-span-2"><span className="text-[#737373] block mb-0.5">Primary Category</span> {primaryCategory}</div>
                    <div className="col-span-2"><span className="text-[#737373] block mb-0.5">Subcategories</span> {subCategories.join(', ') || 'None added'}</div>
                    <div className="col-span-2"><span className="text-[#737373] block mb-0.5">Key Brands</span> {keyBrands.join(', ') || 'None added'}</div>
                    <div className="col-span-2"><span className="text-[#737373] block mb-0.5">Operating Hours</span> {Object.values(operatingHours).filter((d: any) => !d.closed).length} days a week</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#F9F6F8] border-t border-[#F0E6EC] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border border-[#EAE5DE] bg-white text-xs font-bold text-[#525252] hover:bg-[#F5F5F5] transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs font-semibold text-[#737373] hover:text-[#1E1E1E]"
            >
              Skip for now
            </button>
          )}
          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-[#B8005A] hover:bg-[#A0004E] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessOnboardingModal;
