import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Check, 
  Upload, 
  Camera, 
  Lock, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  BadgeCheck, 
  RefreshCw,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

export interface BuyerProfileData {
  id?: string;
  fullName: string;
  contactName?: string;
  companyName?: string;
  businessName: string;
  businessType: 'Salon / Spa' | 'Retailer / Wholesaler' | 'E-commerce Brand' | 'Cosmetics Distributor' | 'OEM / Private Brand' | 'Other';
  designation: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  gstin: string;
  pancard: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  annualProcurementBudget: string;
  primaryCategories: string[];
  preferredDeliveryTimeline: string;
  whatsappAlerts: boolean;
  emailAlerts: boolean;
  isGstVerified: boolean;
  isBusinessVerified: boolean;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  joinedDate?: string;
  followersCount?: string;
  partnerCardNumber?: string;
  partnerTier?: string;
  sourcingDistrict?: string;
  responseSla?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
    website?: string;
  };
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<BuyerProfileData>;
  onSave: (data: BuyerProfileData) => void;
}

const CATEGORY_OPTIONS = [
  'Skincare & Serums',
  'Haircare & Treatments',
  'Salon Equipment',
  'Cosmetics & Makeup',
  'Essential Oils & Botanicals',
  'OEM & Private Label Packaging',
  'Spa & Wellness Formulations',
  'Personal Care & Hygiene'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'business' | 'verification' | 'preferences' | 'social'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [formData, setFormData] = useState<BuyerProfileData>({
    fullName: initialData?.fullName || 'Priya Sharma',
    businessName: initialData?.businessName || 'Radiant Beauty Solutions',
    businessType: initialData?.businessType || 'Salon / Spa',
    designation: initialData?.designation || 'Head of Procurement',
    email: initialData?.email || 'priya.procurement@radiantbeauty.in',
    phone: initialData?.phone || '+91 98201 54321',
    alternatePhone: initialData?.alternatePhone || '',
    gstin: initialData?.gstin || '27AAACR1234F1Z5',
    pancard: initialData?.pancard || 'AAACR1234F',
    address: initialData?.address || 'Plot No. 42, Bandra-Kurla Complex',
    city: initialData?.city || 'Mumbai',
    state: initialData?.state || 'Maharashtra',
    pincode: initialData?.pincode || '400051',
    annualProcurementBudget: initialData?.annualProcurementBudget || '₹25 Lakhs - ₹1 Crore',
    primaryCategories: initialData?.primaryCategories || ['Skincare & Serums', 'Haircare & Treatments'],
    preferredDeliveryTimeline: initialData?.preferredDeliveryTimeline || '3 - 7 Days',
    whatsappAlerts: initialData?.whatsappAlerts ?? true,
    emailAlerts: initialData?.emailAlerts ?? true,
    isGstVerified: initialData?.isGstVerified ?? true,
    isBusinessVerified: initialData?.isBusinessVerified ?? true,
    avatarUrl: initialData?.avatarUrl,
    coverPhotoUrl: initialData?.coverPhotoUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    bio: initialData?.bio || 'Head of Procurement at Radiant Beauty Solutions. Sourcing premium salon formulations, organic serums, and advanced aesthetic equipment across India.',
    joinedDate: initialData?.joinedDate || 'January 2024',
    socialLinks: initialData?.socialLinks || {
      facebook: 'https://facebook.com/radiantbeauty',
      instagram: 'https://instagram.com/radiantbeauty_in',
      linkedin: 'https://linkedin.com/company/radiant-beauty-solutions',
      youtube: 'https://youtube.com/@radiantbeautytv',
      twitter: 'https://twitter.com/radiantbeauty',
      website: 'https://radiantbeauty.in'
    }
  });

  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerifySuccess, setGstVerifySuccess] = useState<boolean | null>(true);
  
  // Photo upload & auto-resize state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isProcessingCover, setIsProcessingCover] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB limit check (5 * 1024 * 1024 = 5,242,880 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError(`Selected photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max limit is 5MB.`);
      setPhotoSuccessMsg(null);
      return;
    }

    setPhotoError(null);
    setIsProcessingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Auto resize image to max 400x400 while preserving aspect ratio
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setFormData(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
          setPhotoSuccessMsg(`Photo uploaded and auto-resized (${width}x${height}px)`);
          setTimeout(() => setPhotoSuccessMsg(null), 3500);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setPhotoError('Unable to process selected image file.');
        setIsProcessingPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
      setIsProcessingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError(`Selected cover banner is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max limit is 5MB.`);
      setPhotoSuccessMsg(null);
      return;
    }

    setPhotoError(null);
    setIsProcessingCover(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, coverPhotoUrl: compressedDataUrl }));
          setPhotoSuccessMsg(`Cover banner uploaded successfully! (${width}x${height}px)`);
          setTimeout(() => setPhotoSuccessMsg(null), 3500);
        }
        setIsProcessingCover(false);
      };
      img.onerror = () => {
        setPhotoError('Unable to process selected image file.');
        setIsProcessingCover(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file.');
      setIsProcessingCover(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const exists = prev.primaryCategories.includes(category);
      if (exists) {
        return { ...prev, primaryCategories: prev.primaryCategories.filter(c => c !== category) };
      } else {
        return { ...prev, primaryCategories: [...prev.primaryCategories, category] };
      }
    });
  };

  const handleVerifyGST = () => {
    if (!formData.gstin || formData.gstin.length < 15) return;
    setGstVerifying(true);
    setTimeout(() => {
      setGstVerifying(false);
      setGstVerifySuccess(true);
      setFormData(prev => ({ ...prev, isGstVerified: true, isBusinessVerified: true }));
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 900);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#e8e8e8] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#fcf9f8] px-6 py-4.5 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1c1b1b]">Edit Buyer & Business Profile</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-bold">
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-[#594047]">Update personal contact, salon/business credentials, and sourcing settings</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#594047] hover:bg-[#f0edec] hover:text-[#1c1b1b] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-white border-b border-[#e8e8e8] overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#b90064] text-[#b90064]'
                : 'border-transparent text-[#594047] hover:text-[#1c1b1b]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Personal & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'business'
                ? 'border-[#b90064] text-[#b90064]'
                : 'border-transparent text-[#594047] hover:text-[#1c1b1b]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Business & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'verification'
                ? 'border-[#b90064] text-[#b90064]'
                : 'border-transparent text-[#594047] hover:text-[#1c1b1b]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            GST & Trust Badges
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-[#b90064] text-[#b90064]'
                : 'border-transparent text-[#594047] hover:text-[#1c1b1b]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sourcing & Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'social'
                ? 'border-[#b90064] text-[#b90064]'
                : 'border-transparent text-[#594047] hover:text-[#1c1b1b]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Social & Bio
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoFileSelect}
              />
              <input
                type="file"
                ref={coverFileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverFileSelect}
              />

              {/* Profile Photo Block */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8]">
                <div className="relative shrink-0">
                  <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white flex items-center justify-center text-xl font-black shadow-md overflow-hidden border-2 border-white">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt={formData.fullName} className="w-full h-full object-cover" />
                    ) : (
                      formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'PS'
                    )}
                  </div>
                  <button 
                    type="button" 
                    title="Upload or Change Photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 bg-white border border-[#e8e8e8] rounded-full text-[#1c1b1b] hover:text-[#b90064] hover:border-[#b90064] shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[#1c1b1b]">{formData.fullName || 'Buyer Name'}</h4>
                    <span className="px-2 py-0.5 rounded bg-[#fde7f3] text-[#b90064] text-[10px] font-bold">
                      {formData.businessType}
                    </span>
                  </div>
                  <p className="text-xs text-[#594047] truncate mt-0.5">{formData.designation} • {formData.businessName}</p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="px-3 py-1.5 bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#b90064] rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#b90064]" />
                          <span>Resizing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo (Max 5MB)</span>
                        </>
                      )}
                    </button>

                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: undefined }))}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8c7077] mt-1.5">
                    Supports JPEG, PNG up to <strong>5MB</strong>. Automatically resizes to optimal 400x400px.
                  </p>
                </div>
              </div>

              {/* Cover Photo Block */}
              <div className="flex flex-col gap-4 p-4 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#1c1b1b] uppercase tracking-tight">Cover Photo Banner</h4>
                  <span className="text-[10px] text-[#8c7077] font-bold">Recommended: 1200 x 400px (Max 5MB)</span>
                </div>

                <div className="relative h-28 w-full rounded-xl border border-[#e8e8e8] bg-white overflow-hidden flex items-center justify-center">
                  {formData.coverPhotoUrl ? (
                    <img src={formData.coverPhotoUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-6 h-6 text-[#8c7077] mx-auto mb-1 opacity-55" />
                      <span className="text-[10px] text-[#8c7077] font-bold block">No cover banner set</span>
                    </div>
                  )}
                  <button 
                    type="button" 
                    title="Upload Cover Banner"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/95 hover:bg-white text-[#1c1b1b] hover:text-[#b90064] border border-[#e8e8e8] rounded-xl text-[10px] font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#b90064]" />
                    <span>Upload Banner</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isProcessingCover}
                    className="px-3 py-1.5 bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#b90064] rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingCover ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#b90064]" />
                        <span>Resizing Banner...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Banner File</span>
                      </>
                    )}
                  </button>

                  {formData.coverPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverPhotoUrl: undefined }))}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Remove Banner
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Error Banner */}
              {photoError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Upload Success Banner */}
              {photoSuccessMsg && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-xs font-bold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{photoSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Full Name <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Designation / Role <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                    placeholder="e.g. Procurement Lead, Salon Owner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Official Email <span className="text-[#b90064]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8c7077] absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Primary Mobile (WhatsApp Enabled) <span className="text-[#b90064]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8c7077] absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                      placeholder="+91 98200 00000"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Alternate Phone / Landline (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.alternatePhone}
                    onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                    placeholder="+91 22 2650 0000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Business & Address */}
          {activeTab === 'business' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Registered Business / Enterprise Name <span className="text-[#b90064]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#8c7077] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                      placeholder="e.g. Radiant Beauty Solutions Pvt Ltd"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Business Type <span className="text-[#b90064]">*</span>
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={e => setFormData({ ...formData, businessType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium cursor-pointer"
                  >
                    <option value="Salon / Spa">Salon / Luxury Spa Chain</option>
                    <option value="Retailer / Wholesaler">Cosmetics Retailer / Wholesaler</option>
                    <option value="E-commerce Brand">D2C / E-commerce Beauty Brand</option>
                    <option value="Cosmetics Distributor">Regional / State Distributor</option>
                    <option value="OEM / Private Brand">OEM Brand Seeking Formulations</option>
                    <option value="Other">Other Beauty Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Annual Sourcing Budget
                  </label>
                  <select
                    value={formData.annualProcurementBudget}
                    onChange={e => setFormData({ ...formData, annualProcurementBudget: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium cursor-pointer"
                  >
                    <option value="₹5 Lakhs - ₹10 Lakhs">₹5 Lakhs - ₹10 Lakhs</option>
                    <option value="₹10 Lakhs - ₹25 Lakhs">₹10 Lakhs - ₹25 Lakhs</option>
                    <option value="₹25 Lakhs - ₹1 Crore">₹25 Lakhs - ₹1 Crore</option>
                    <option value="₹1 Crore - ₹5 Crores">₹1 Crore - ₹5 Crores</option>
                    <option value="₹5 Crores+">₹5 Crores+</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Primary Sourcing / Delivery Address <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064] font-medium"
                    placeholder="Warehouse / Salon Unit address"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    City <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="e.g. Mumbai"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    State <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="e.g. Maharashtra"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    PIN Code <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="400051"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GST & Verification */}
          {activeTab === 'verification' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0050d6] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0369a1]">Why verify your Business GST?</h4>
                  <p className="text-[11px] text-[#0c4a6e] mt-0.5">
                    Verified buyers receive 3x faster quotes, unlock Tier-1 manufacturer credit terms, and access direct factory sample dispatch.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    15-Digit GST Identification Number (GSTIN)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={15}
                        value={formData.gstin}
                        onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] uppercase font-mono font-bold focus:outline-hidden focus:border-[#b90064]"
                        placeholder="27AAACR1234F1Z5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyGST}
                      disabled={gstVerifying || !formData.gstin}
                      className="px-4 py-2.5 bg-[#0050d6] text-white rounded-xl text-xs font-bold hover:bg-[#0040b0] transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {gstVerifying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify GST
                        </>
                      )}
                    </button>
                  </div>
                  {gstVerifySuccess && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-green-700">
                      <Check className="w-3.5 h-3.5" /> GST verified: Active & Registered under Govt Portal
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                    Business PAN Card
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pancard}
                    onChange={e => setFormData({ ...formData, pancard: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] uppercase font-mono font-bold focus:outline-hidden focus:border-[#b90064]"
                    placeholder="AAACR1234F"
                  />
                </div>

                <div className="border border-dashed border-[#d5c3c8] rounded-xl p-4 bg-[#fcf9f8] text-center">
                  <Upload className="w-6 h-6 text-[#b90064] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#1c1b1b]">Upload Business Registration / Trade License (Optional)</p>
                  <p className="text-[10px] text-[#8c7077] mt-0.5">Supports PDF, JPG, PNG up to 5MB</p>
                  <button 
                    type="button" 
                    className="mt-2.5 px-3 py-1.5 bg-white border border-[#e8e8e8] rounded-lg text-xs font-bold text-[#1c1b1b] hover:border-[#b90064] transition-colors cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sourcing & Alerts */}
          {activeTab === 'preferences' && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div>
                <label className="block text-xs font-bold text-[#1c1b1b] mb-2">
                  Primary Categories of Interest
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat, idx) => {
                    const isSelected = formData.primaryCategories.includes(cat);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCategoryToggle(cat)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]' 
                            : 'bg-[#fcf9f8] border-[#e8e8e8] text-[#594047] hover:bg-white'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#e8e8e8] pt-4 space-y-3">
                <h4 className="text-xs font-bold text-[#1c1b1b]">Notification & Lead Match Channels</h4>
                
                <label className="flex items-center justify-between p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-xs font-bold text-[#1c1b1b]">WhatsApp Instant Quotes & Updates</div>
                      <div className="text-[10px] text-[#8c7077]">Receive verified supplier quotations directly on WhatsApp</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.whatsappAlerts}
                    onChange={e => setFormData({ ...formData, whatsappAlerts: e.target.checked })}
                    className="w-4 h-4 text-[#b90064] rounded focus:ring-[#b90064] accent-[#b90064] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#0050d6]" />
                    <div>
                      <div className="text-xs font-bold text-[#1c1b1b]">Email Summary & RFQ Digest</div>
                      <div className="text-[10px] text-[#8c7077]">Weekly price movements, new OEM product catalogs</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailAlerts}
                    onChange={e => setFormData({ ...formData, emailAlerts: e.target.checked })}
                    className="w-4 h-4 text-[#b90064] rounded focus:ring-[#b90064] accent-[#b90064] cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: Social & Bio */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div>
                <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                  Professional Bio / About
                </label>
                <textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium resize-none"
                  placeholder="Describe your salon, brand, or procurement focus..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">
                  Cover Photo Banner URL
                </label>
                <input
                  type="url"
                  value={formData.coverPhotoUrl || ''}
                  onChange={e => setFormData({ ...formData, coverPhotoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">Facebook Profile / Page</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.facebook || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://facebook.com/yourbrand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">Instagram Handle / Link</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://instagram.com/yourbrand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">LinkedIn Profile / Company</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://linkedin.com/company/yourbrand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">YouTube Channel</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.youtube || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://youtube.com/@yourbrand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">Twitter / X Profile</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.twitter || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://twitter.com/yourbrand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1c1b1b] mb-1.5">Official Company Website</label>
                  <input
                    type="url"
                    value={formData.socialLinks?.website || ''}
                    onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, website: e.target.value } })}
                    className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                    placeholder="https://yourbrand.in"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {showSuccessToast && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs font-bold text-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Profile settings updated successfully!
            </div>
          )}

          {/* Footer Controls */}
          <div className="border-t border-[#e8e8e8] pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#e8e8e8] text-xs font-bold text-[#594047] hover:bg-[#f0edec] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#b90064] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#b90064]/20 hover:bg-[#8e004b] transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save Profile Settings
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};
