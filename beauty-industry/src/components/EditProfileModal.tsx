import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Trash2, User, Building2, Mail, MapPin, Check, Sparkles, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, LogOut, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSaveProfile: (updatedUser: UserProfile) => void;
  onOpenOnboarding?: () => void;
  onOpenRegister?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
  onOpenOnboarding,
  onOpenRegister
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<string>('Salon / Beauty Parlour Owner');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{name?: string, email?: string, city?: string}>({});
  const [logoutMessage, setLogoutMessage] = useState('');

  // Notification Settings States
  const [notifAccount, setNotifAccount] = useState(true);
  const [notifBusiness, setNotifBusiness] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifPrice, setNotifPrice] = useState(true);
  const [notifNewProducts, setNotifNewProducts] = useState(true);
  const [notifOffers, setNotifOffers] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setCompanyName(currentUser.companyName || '');
      setRole(currentUser.role || 'Salon / Beauty Parlour Owner');
      setCity(currentUser.city || '');
      setAvatarUrl(currentUser.avatarUrl);
      setErrors({});
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogoutAllDevices = () => {
    setLogoutMessage('All other sessions have been signed out.');
    setTimeout(() => {
      setLogoutMessage('');
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const newErrors: {name?: string, email?: string, city?: string} = {};
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = 'Valid email format is required';
    }
    
    if (!city.trim()) {
      newErrors.city = 'City / Location is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      name,
      email,
      companyName,
      role,
      city,
      avatarUrl
    };
    onSaveProfile(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#EDEDED] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#FFF5F8] to-white border-b border-[#F0E6EC] relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-[#B8005A] uppercase tracking-wider bg-[#FFF0F5] border border-[#FFD1E3] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Account Settings
          </span>
          <h2 className="text-xl font-bold text-[#1E1E1E] mt-2">Edit B2B Profile</h2>
          <p className="text-xs text-[#737373] mt-0.5">Update your business profile picture and contact information</p>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Profile Picture Upload Section */}
          <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-[#B8005A]/30 overflow-hidden bg-white shadow-md flex items-center justify-center text-[#B8005A] font-bold text-2xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FFF0F5] to-[#FFD1E3] flex items-center justify-center text-[#B8005A]">
                    {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 bg-[#B8005A] text-white rounded-full shadow-md hover:bg-[#A0004E] transition-all cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="text-xs font-bold text-[#1E1E1E]">Profile Picture</h4>
              <p className="text-[11px] text-[#737373] leading-tight">
                Upload a professional photo to be displayed across the Nexora Luxe platform and in navbar.
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] hover:border-[#B8005A] text-[#1E1E1E] hover:text-[#B8005A] rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-[#B8005A]" />
                  <span>Select Image</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
              <h4 className="text-xs font-bold text-[#1E1E1E] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B8005A]" />
                <span>Account & Business</span>
              </h4>
              <span className="text-[10px] font-bold text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3] px-2 py-0.5 rounded-full">
                {currentUser?.role === 'supplier' || currentUser?.companyName ? 'Supplier Account' : 'Registered User'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <span className="text-[11px] font-semibold text-[#525252] block">
                  Account Type: <strong className="text-[#1E1E1E] font-bold">Registered User</strong>
                </span>
                <p className="text-[11px] text-[#737373] mt-0.5">
                  {currentUser?.companyName ? `Linked Business: ${currentUser.companyName}` : 'Standard buyer account for luxury salons & spas'}
                </p>
              </div>

              {currentUser?.companyName || currentUser?.role === 'supplier' ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenOnboarding) {
                      onOpenOnboarding();
                    } else if (onOpenRegister) {
                      onOpenRegister();
                    }
                  }}
                  className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#333333] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Manage Business</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenOnboarding) {
                      onOpenOnboarding();
                    } else if (onOpenRegister) {
                      onOpenRegister();
                    }
                  }}
                  className="px-4 py-2 bg-[#B8005A] hover:bg-[#A0004E] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Become a Supplier / Register Business</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">
                Full Name / Contact Person
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({...errors, name: undefined}); }}
                  required
                  placeholder="e.g. Ananya Sharma"
                  className={`w-full bg-[#FAFAFA] border ${errors.name ? 'border-red-500' : 'border-[#E5E5E5]'} rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">
                Business Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({...errors, email: undefined}); }}
                  required
                  placeholder="name@company.com"
                  className={`w-full bg-[#FAFAFA] border ${errors.email ? 'border-red-500' : 'border-[#E5E5E5]'} rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">
                Company / Business Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Jaipur Luxury Beauty Hub"
                  className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">
                  Business Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A] cursor-pointer"
                >
                  <option value="Salon / Beauty Parlour Owner">Salon / Beauty Parlour Owner</option>
                  <option value="Spa / Wellness Business Owner">Spa / Wellness Business Owner</option>
                  <option value="Nail Studio Owner">Nail Studio Owner</option>
                  <option value="Tattoo Studio Owner">Tattoo Studio Owner</option>
                  <option value="Makeup / Hair / Beauty Professional">Makeup / Hair / Beauty Professional</option>
                  <option value="Company / Brand Owner">Company / Brand Owner</option>
                  <option value="Manufacturer / OEM">Manufacturer / OEM</option>
                  <option value="Wholesaler / Stockist">Wholesaler / Stockist</option>
                  <option value="Regional Distributor">Regional Distributor</option>
                  <option value="Distributor / Supplier">Distributor / Supplier</option>
                  <option value="Beauty Product Retailer">Beauty Product Retailer</option>
                  <option value="Importer / Exporter">Importer / Exporter</option>
                  <option value="Other Beauty Business">Other Beauty Business</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">
                  City / Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors({...errors, city: undefined}); }}
                    required
                    placeholder="e.g. Mumbai"
                    className={`w-full bg-[#FAFAFA] border ${errors.city ? 'border-red-500' : 'border-[#E5E5E5]'} rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]`}
                  />
                </div>
                {errors.city && <p className="text-red-500 text-[10px] mt-1">{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Profile Security Section */}
          <div className="mt-8 border-t border-[#E5E5E5] pt-6">
            <h3 className="text-[13px] font-bold text-[#1E1E1E] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B8005A]" />
              Security Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5E5]/50 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-[#525252]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1E1E1E]">+91 98765 43210</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <p className="text-[10px] text-[#737373] mt-0.5">Primary Mobile Number</p>
                  </div>
                </div>
                <button type="button" className="text-xs font-bold text-[#B8005A] hover:underline cursor-pointer">
                  Change Number
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5E5]/50 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#525252]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1E1E1E]">{email || 'No email provided'}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" />
                        Not Verified
                      </span>
                    </div>
                    <p className="text-[10px] text-[#737373] mt-0.5">Primary Email Address</p>
                  </div>
                </div>
                <button type="button" className="text-xs font-bold text-[#B8005A] hover:underline cursor-pointer">
                  Verify Email
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5E5]/50 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-[#525252]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1E1E1E]">Active Sessions</span>
                    </div>
                    <p className="text-[10px] text-[#737373] mt-0.5">Log out from all other devices</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleLogoutAllDevices}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[11px] font-bold text-[#1E1E1E] transition-all cursor-pointer"
                >
                  Log Out Others
                </button>
              </div>
              
              {logoutMessage && (
                <div className="text-[11px] font-bold text-[#10B981] flex items-center gap-1.5 mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {logoutMessage}
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold text-[#525252]">Account Security Status:</span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-semibold text-[#525252] flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-[#10B981]" /> Verified
                </span>
                <span className="text-[10px] font-semibold text-[#525252] flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#F59E0B]" /> Not Verified
                </span>
                <span className="text-[10px] font-semibold text-[#525252] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#10B981]" /> Secure
                </span>
              </div>
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="mt-8 border-t border-[#E5E5E5] pt-6">
            <h3 className="text-[13px] font-bold text-[#1E1E1E] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#B8005A]" />
              Notification Settings
            </h3>
            
            <div className="space-y-3">
              {/* Account Notifications */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Account & Security</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">Account updates, login & security alerts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifAccount(!notifAccount)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifAccount ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifAccount ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Business Enquiries */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Business Enquiries</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">New buyer / business enquiry notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifBusiness(!notifBusiness)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifBusiness ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifBusiness ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* WhatsApp Enquiries */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">WhatsApp Enquiries</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">WhatsApp enquiry notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifWhatsapp ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifWhatsapp ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Price Alerts */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Price Alerts</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">Price change alerts & saved product updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifPrice(!notifPrice)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifPrice ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifPrice ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* New Products */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">New Products</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">New product notifications from followed businesses</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifNewProducts(!notifNewProducts)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifNewProducts ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifNewProducts ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Offers & Updates */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Offers & Updates</h4>
                  <p className="text-[10px] text-[#737373] mt-0.5">Offers, discounts & Nexora announcements</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifOffers(!notifOffers)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${notifOffers ? 'bg-[#10B981]' : 'bg-[#E5E5E5]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${notifOffers ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 mt-6 border-t border-[#EDEDED] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-semibold text-[#525252] hover:bg-[#F5F5F5] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#B8005A] hover:bg-[#A0004E] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
