import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Send,
  ShieldCheck,
  Building2,
  Check,
  Copy,
  ArrowRight,
  Package,
  Star,
  MapPin,
  UploadCloud,
  FileText,
  AlertCircle,
  Sparkles,
  Phone,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../db/database';
import { BuyerProfileData } from './EditProfileModal';

export type EnquiryIntent = 'Wholesale Purchase' | 'OEM / Private Label' | 'Sample Request' | 'Distributorship Enquiry';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: any | null;
  buyerProfile?: BuyerProfileData;
  onCallSupplier?: (supplierName: string) => void;
  onWhatsAppSupplier?: (supplierName: string) => void;
  onNavigateToDashboard?: () => void;
}

const PINCODE_CITY_MAP: Record<string, string> = {
  '400001': 'Mumbai, Maharashtra',
  '400050': 'Bandra, Mumbai',
  '110001': 'New Delhi, Delhi',
  '110020': 'Okhla, New Delhi',
  '560001': 'Bengaluru, Karnataka',
  '560034': 'Koramangala, Bengaluru',
  '600001': 'Chennai, Tamil Nadu',
  '500001': 'Hyderabad, Telangana',
  '700001': 'Kolkata, West Bengal',
  '380001': 'Ahmedabad, Gujarat',
  '411001': 'Pune, Maharashtra'
};

const SIMILAR_SUPPLIERS_FALLBACK = [
  {
    id: 'supp-aura-labs',
    name: 'Aura Beauty Labs',
    city: 'Mumbai, MH',
    rating: 4.9,
    verified: true,
    badge: 'OEM / Contract Lab',
    responseRate: '98% Response'
  },
  {
    id: 'supp-dermaglow-in',
    name: 'Dermaglow Cosmeceuticals India',
    city: 'New Delhi, DL',
    rating: 4.8,
    verified: true,
    badge: 'GMP Manufacturer',
    responseRate: '95% Response'
  },
  {
    id: 'supp-luxeform-lab',
    name: 'LuxeForm Cosmetics & Packaging',
    city: 'Ahmedabad, GJ',
    rating: 4.7,
    verified: true,
    badge: 'Private Label Specialist',
    responseRate: '92% Response'
  },
  {
    id: 'supp-bioveda-botanicals',
    name: 'BioVeda Ayurvedic Herbals',
    city: 'Bengaluru, KA',
    rating: 4.9,
    verified: true,
    badge: 'Ayush / Organic Certified',
    responseRate: '99% Response'
  }
];

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  buyerProfile,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigateToDashboard
}) => {
  // Section A: Requirement Details
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('Units');
  const [intent, setIntent] = useState<EnquiryIntent>('Wholesale Purchase');
  const [description, setDescription] = useState(
    'Please provide your best quotation for bulk supply. Kindly share tier pricing, COA documentation, dispatch timeline, and MOQ terms.'
  );
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Section B: Buyer Contact Details
  const [buyerName, setBuyerName] = useState('Priya Sharma');
  const [companyName, setCompanyName] = useState('Luxe Glow Aesthetic Clinics');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('98201 44521');
  const [pincode, setPincode] = useState('400001');
  const [cityLocation, setCityLocation] = useState('Mumbai, Maharashtra');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Section C: Lead Routing & Multi-Sourcing Switch
  const [broadcastToSimilar, setBroadcastToSimilar] = useState(true);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [copiedRef, setCopiedRef] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [dispatchedSuppliers, setDispatchedSuppliers] = useState<typeof SIMILAR_SUPPLIERS_FALLBACK>([]);

  // Sync / Initialize when modal opens or target item changes
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setIsSubmitting(false);
      setFormErrors({});
      setShowOtpInput(false);
      setReferenceId(`NX-${Math.floor(100000 + Math.random() * 900000)}`);

      // Pre-fill profile data if available
      if (buyerProfile) {
        if (buyerProfile.contactName) setBuyerName(buyerProfile.contactName);
        if (buyerProfile.companyName) setCompanyName(buyerProfile.companyName);
        if (buyerProfile.phone) setMobileNumber(buyerProfile.phone.replace('+91', '').trim());
        if (buyerProfile.city) setCityLocation(`${buyerProfile.city}, ${buyerProfile.state || ''}`);
        if (buyerProfile.pincode) setPincode(buyerProfile.pincode);
      }

      // Pre-fill quantity from product MOQ
      if (targetItem?.moq) {
        const numericMoq = parseInt(String(targetItem.moq).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numericMoq) && numericMoq > 0) {
          setQuantity(String(numericMoq));
        }
      }

      // Set default unit based on product title/category
      if (targetItem?.title?.toLowerCase().includes('oil') || targetItem?.title?.toLowerCase().includes('liquid') || targetItem?.name?.toLowerCase().includes('oil')) {
        setUnit('Liters');
      } else if (targetItem?.title?.toLowerCase().includes('powder') || targetItem?.title?.toLowerCase().includes('extract')) {
        setUnit('Kg');
      } else if (targetItem?.title?.toLowerCase().includes('jar') || targetItem?.title?.toLowerCase().includes('bottle')) {
        setUnit('Pieces');
      } else {
        setUnit('Units');
      }
    }
  }, [isOpen, targetItem, buyerProfile]);

  // Handle Pincode Auto-lookup
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(val);
    if (val.length === 6) {
      if (PINCODE_CITY_MAP[val]) {
        setCityLocation(PINCODE_CITY_MAP[val]);
      } else {
        setCityLocation('India');
      }
    }
  };

  // Handle Attachment Drag & Drop / File Select
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      setFormErrors((prev) => ({ ...prev, file: 'Supported formats: .pdf, .png, .jpg, .jpeg' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, file: 'File size must be under 5MB' }));
      return;
    }
    setFormErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });
    setAttachedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });
  };

  // Quick intent chip select
  const handleIntentSelect = (selected: EnquiryIntent) => {
    setIntent(selected);
    if (selected === 'Wholesale Purchase') {
      setDescription('Please provide your best quotation for bulk wholesale supply. Kindly share tier pricing, batch COA, dispatch timeline, and MOQ terms.');
    } else if (selected === 'OEM / Private Label') {
      setDescription('Seeking OEM / Private Label manufacturing for this formulation. Please share custom active options, primary packaging catalog, and private label batch MOQ.');
    } else if (selected === 'Sample Request') {
      setDescription('We would like to request an evaluation batch sample along with COA specification sheets before finalizing a recurring commercial purchase order.');
    } else if (selected === 'Distributorship Enquiry') {
      setDescription('Interested in exclusive regional or retail distributorship rights. Please share distribution margins, wholesale catalog, and minimum monthly commitment.');
    }
  };

  // Form Validation & Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      errors.quantity = 'Please enter a valid quantity greater than 0';
    }

    if (!buyerName.trim()) {
      errors.buyerName = 'Full name is required';
    }

    if (!companyName.trim()) {
      errors.companyName = 'Company name is required';
    }

    const cleanPhone = mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      errors.mobile = 'Enter a valid mobile phone number';
    }

    if (!pincode.trim() || pincode.length < 5) {
      errors.pincode = 'Valid delivery pincode is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      // Normalizing Target Item info
      const productName = targetItem?.title || targetItem?.name || 'Professional Argan Repair Hair Serum';
      const primarySupplierId = targetItem?.supplierId || targetItem?.id || 'supp-aura-labs';
      const productId = targetItem?.productId || targetItem?.id || 'prod_beauty_456';
      const categoryName = targetItem?.category || 'Skincare & Serums';

      // 1. Write to Phase 4 Relational Database
      db.createRFQEnquiry({
        buyer_id: buyerProfile ? 'buyer-prof-priya' : 'usr_guest_procure',
        supplier_id: primarySupplierId,
        product_id: productId,
        requirement_title: `${intent}: ${quantity} ${unit} - ${productName}`,
        category: categoryName,
        quantity_required: qtyNum,
        quantity_unit: unit,
        target_budget: targetItem?.price ? (parseFloat(String(targetItem.price).replace(/[^0-9.]/g, '')) || 350) * qtyNum : undefined,
        delivery_location: `${cityLocation} (PIN: ${pincode})`,
        details: `${description}\n\n[Contact: ${buyerName} | ${companyName} | ${countryCode} ${mobileNumber}]`,
        attachments: attachedFile ? [`https://storage.nexoraluxe.com/reqs/${attachedFile.name}`] : [],
        status: 'new',
        type: 'direct_enquiry',
        send_to_similar_suppliers: broadcastToSimilar
      });

      // 2. Prepare matched suppliers list for the success screen
      const matched = [
        {
          id: primarySupplierId,
          name: targetItem?.supplier || targetItem?.brand || 'Aura Beauty Labs',
          city: targetItem?.location || 'Mumbai, MH',
          rating: 4.9,
          verified: true,
          badge: 'Primary Supplier',
          responseRate: '15m avg response'
        }
      ];

      if (broadcastToSimilar) {
        matched.push(...SIMILAR_SUPPLIERS_FALLBACK.slice(1, 4));
      }

      setDispatchedSuppliers(matched);
    } catch (err) {
      console.warn('[EnquiryModal] DB write error handled gracefully', err);
    }

    // Interactive realistic submit latency
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 750);
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (!isOpen || !targetItem) return null;

  // Normalized product details for display
  const productName = targetItem.title || targetItem.name || 'Professional Argan Repair Hair Serum';
  const productImage = targetItem.image || targetItem.thumbnail || 'https://images.unsplash.com/photo-1608248597359-07f2a1b9f71c?auto=format&fit=crop&q=80&w=400';
  const supplierName = targetItem.supplier || targetItem.brand || targetItem.company || 'Aura Beauty Labs';
  const location = targetItem.location || targetItem.city || 'Mumbai, Maharashtra';
  const moqText = targetItem.moq || '50 Units';
  const priceDisplay = targetItem.price ? `₹${targetItem.price}` : targetItem.priceRange || '₹380 - ₹450 / unit';

  return (
    <div
      id="enquiry-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[6px] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        id="enquiry-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FCF9F8] rounded-2xl border border-[#E8DFE3] w-full max-w-[640px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-[#1C1B1B]"
      >
        {/* Top Header */}
        <header className="px-5 py-3.5 border-b border-[#E8DFE3] flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1C1B1B] flex items-center gap-2">
              <span>Send Product Enquiry</span>
              <span className="bg-[#FDE7F3] text-[#B90064] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                B2B Sourcing
              </span>
            </h2>
            <p className="text-xs text-[#594047] mt-0.5">
              Connect directly with verified beauty manufacturers and request wholesale quotes.
            </p>
          </div>
          <button
            id="btn-close-enquiry-modal"
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-[#F7F2F2] flex items-center justify-center transition-colors text-[#594047] hover:text-[#1C1B1B] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Modal Content / Scrollable Area */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 custom-scrollbar">
          
          {/* Header Section: Product & Supplier Summary Card (Compact Top Strip) */}
          <div className="bg-white p-3.5 rounded-xl border border-[#E8DFE3] flex items-center gap-3.5 shadow-2xs">
            {/* 80x80px Thumbnail Image */}
            <div className="w-20 h-20 min-w-20 min-h-20 rounded-lg overflow-hidden border border-[#E8DFE3] bg-[#F7F2F2] shrink-0">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Product & Supplier Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1C1B1B] truncate" title={productName}>
                {productName}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <span className="font-extrabold text-[#B90064]">{priceDisplay}</span>
                <span className="text-[#8C7077]">•</span>
                <span className="text-[#594047] font-medium bg-[#F7F2F2] px-2 py-0.5 rounded">MOQ: {moqText}</span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-[#594047]">
                <span className="font-semibold text-[#1C1B1B] truncate">{supplierName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Nexora Verified
                </span>
                <span className="text-[#8C7077] hidden sm:inline">•</span>
                <span className="text-[#8C7077] hidden sm:inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              </div>
            </div>
          </div>

          {/* Form Body or Success State */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* SECTION A: REQUIREMENT DETAILS */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] space-y-4">
                <div className="flex items-center justify-between border-b border-[#F0EDEC] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B90064] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Section A: Requirement Details
                  </span>
                  <span className="text-[11px] text-[#8C7077]">Step 1 of 2</span>
                </div>

                {/* Quantity Required (Numeric Input + Unit Select) */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1B] mb-1.5">
                    Quantity Required <span className="text-[#B90064]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 relative">
                      <input
                        id="input-enquiry-quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="e.g. 500"
                        className={`w-full bg-[#FCF9F8] border rounded-lg px-3.5 py-2 text-sm font-medium text-[#1C1B1B] focus:outline-none focus:border-[#B90064] focus:ring-1 focus:ring-[#B90064] transition-all ${
                          formErrors.quantity ? 'border-red-500 bg-red-50/20' : 'border-[#E8DFE3]'
                        }`}
                      />
                    </div>
                    <div>
                      <select
                        id="select-enquiry-unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg px-3 py-2 text-sm font-semibold text-[#1C1B1B] focus:outline-none focus:border-[#B90064] transition-all cursor-pointer"
                      >
                        <option value="Units">Units</option>
                        <option value="Pieces">Pieces</option>
                        <option value="Kg">Kilograms (Kg)</option>
                        <option value="Liters">Liters</option>
                        <option value="Boxes">Boxes / Cartons</option>
                        <option value="Sets">Sets / Kits</option>
                      </select>
                    </div>
                  </div>
                  {formErrors.quantity && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.quantity}
                    </p>
                  )}
                </div>

                {/* Requirement Type / Intent (Choice Chips) */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1B] mb-1.5">
                    Requirement Type / Intent <span className="text-[#B90064]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'Wholesale Purchase',
                        'OEM / Private Label',
                        'Sample Request',
                        'Distributorship Enquiry'
                      ] as EnquiryIntent[]
                    ).map((type) => {
                      const isSelected = intent === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleIntentSelect(type)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#FDE7F3] border-[#B90064] text-[#B90064] shadow-2xs'
                              : 'bg-[#FCF9F8] border-[#E8DFE3] text-[#594047] hover:border-[#B90064] hover:text-[#1C1B1B]'
                          }`}
                        >
                          <span className="truncate">{type}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#B90064] shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Requirement Details (Textarea) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#1C1B1B]">
                      Requirement Specifications & Notes
                    </label>
                    <span className={`text-[11px] font-mono ${description.length > 480 ? 'text-red-500 font-bold' : 'text-[#8C7077]'}`}>
                      {description.length}/500 chars
                    </span>
                  </div>
                  <textarea
                    id="textarea-enquiry-notes"
                    rows={3}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify custom formulations, packaging preferences, estimated order frequency, or target delivery timelines..."
                    className="w-full bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg p-3 text-xs text-[#1C1B1B] focus:outline-none focus:border-[#B90064] focus:ring-1 focus:ring-[#B90064] resize-none leading-relaxed transition-all"
                  />
                </div>

                {/* Attachment Upload (Optional Drag & Drop Zone) */}
                <div>
                  <label className="block text-xs font-bold text-[#1C1B1B] mb-1.5">
                    Specs / Packaging Reference Attachment <span className="text-[#8C7077] font-normal">(Optional)</span>
                  </label>
                  {!attachedFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all cursor-pointer ${
                        isDragOver ? 'border-[#B90064] bg-[#FDE7F3]/30' : 'border-[#E8DFE3] bg-[#FCF9F8] hover:border-[#B90064]'
                      }`}
                      onClick={() => document.getElementById('enquiry-file-upload')?.click()}
                    >
                      <input
                        id="enquiry-file-upload"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      <UploadCloud className="w-5 h-5 mx-auto text-[#B90064] mb-1" />
                      <p className="text-xs font-semibold text-[#1C1B1B]">
                        Drag & Drop or <span className="text-[#B90064] underline">Browse File</span>
                      </p>
                      <p className="text-[10px] text-[#8C7077] mt-0.5">
                        Supports .pdf, .png, .jpg up to 5MB (Artwork, COA request, benchmark packaging)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#FAF1F5] border border-[#E0BEC6] rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#B90064] shrink-0" />
                        <span className="text-xs font-bold text-[#1C1B1B] truncate">{attachedFile.name}</span>
                        <span className="text-[10px] text-[#8C7077] shrink-0">({attachedFile.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-[#8C7077] hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {formErrors.file && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.file}
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION B: BUYER CONTACT DETAILS */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#F0EDEC] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B90064] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Section B: Buyer Contact Details
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    Direct Supplier Access
                  </span>
                </div>

                {/* 2-Column: Full Name & Company Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1B1B] mb-1">
                      Full Name <span className="text-[#B90064]">*</span>
                    </label>
                    <input
                      id="input-enquiry-buyer-name"
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full bg-[#FCF9F8] border rounded-lg px-3 py-2 text-xs font-medium text-[#1C1B1B] focus:outline-none focus:border-[#B90064] transition-all ${
                        formErrors.buyerName ? 'border-red-500 bg-red-50/20' : 'border-[#E8DFE3]'
                      }`}
                    />
                    {formErrors.buyerName && (
                      <p className="text-[10px] text-red-600 mt-0.5">{formErrors.buyerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1B1B] mb-1">
                      Company / Business Name <span className="text-[#B90064]">*</span>
                    </label>
                    <input
                      id="input-enquiry-company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Luxe Glow Clinics"
                      className={`w-full bg-[#FCF9F8] border rounded-lg px-3 py-2 text-xs font-medium text-[#1C1B1B] focus:outline-none focus:border-[#B90064] transition-all ${
                        formErrors.companyName ? 'border-red-500 bg-red-50/20' : 'border-[#E8DFE3]'
                      }`}
                    />
                    {formErrors.companyName && (
                      <p className="text-[10px] text-red-600 mt-0.5">{formErrors.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Mobile Number with Country Code & OTP status */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#1C1B1B]">
                      Mobile Number <span className="text-[#B90064]">*</span>
                    </label>
                    {!isOtpVerified ? (
                      <button
                        type="button"
                        onClick={() => setShowOtpInput(true)}
                        className="text-[10px] font-bold text-[#B90064] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Verify via OTP
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        OTP Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <div>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full bg-[#FCF9F8] border border-[#E8DFE3] rounded-lg px-2.5 py-2 text-xs font-bold text-[#1C1B1B] focus:outline-none focus:border-[#B90064]"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+971">+971 (UAE)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+65">+65 (SG)</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <input
                        id="input-enquiry-mobile"
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="98201 44521"
                        className={`w-full bg-[#FCF9F8] border rounded-lg px-3 py-2 text-xs font-medium text-[#1C1B1B] focus:outline-none focus:border-[#B90064] ${
                          formErrors.mobile ? 'border-red-500 bg-red-50/20' : 'border-[#E8DFE3]'
                        }`}
                      />
                    </div>
                  </div>
                  {formErrors.mobile && (
                    <p className="text-[10px] text-red-600 mt-0.5">{formErrors.mobile}</p>
                  )}

                  {/* Optional OTP Verification Popout */}
                  {showOtpInput && !isOtpVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 p-2.5 bg-[#FAF1F5] rounded-lg border border-[#E0BEC6] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 4-digit OTP (1234)"
                        className="w-40 bg-white border border-[#E8DFE3] rounded px-2.5 py-1 text-xs text-center font-bold tracking-widest text-[#1C1B1B] focus:outline-none focus:border-[#B90064]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (otpCode.length === 4 || otpCode === '1234') {
                            setIsOtpVerified(true);
                            setShowOtpInput(false);
                          }
                        }}
                        className="px-3 py-1 bg-[#B90064] text-white text-xs font-bold rounded hover:bg-[#a00057] transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowOtpInput(false)}
                        className="text-xs text-[#8C7077] hover:text-[#1C1B1B] ml-auto cursor-pointer"
                      >
                        Skip
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Delivery Pincode / City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1B1B] mb-1">
                      Delivery Pincode <span className="text-[#B90064]">*</span>
                    </label>
                    <input
                      id="input-enquiry-pincode"
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={handlePincodeChange}
                      placeholder="e.g. 400001"
                      className={`w-full bg-[#FCF9F8] border rounded-lg px-3 py-2 text-xs font-medium text-[#1C1B1B] focus:outline-none focus:border-[#B90064] ${
                        formErrors.pincode ? 'border-red-500 bg-red-50/20' : 'border-[#E8DFE3]'
                      }`}
                    />
                    {formErrors.pincode && (
                      <p className="text-[10px] text-red-600 mt-0.5">{formErrors.pincode}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1C1B1B] mb-1">
                      Destination City / State
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cityLocation}
                        onChange={(e) => setCityLocation(e.target.value)}
                        placeholder="Mumbai, Maharashtra"
                        className="w-full bg-[#FAF1F5] border border-[#E8DFE3] rounded-lg px-3 py-2 text-xs font-semibold text-[#594047] focus:outline-none focus:border-[#B90064]"
                      />
                      <MapPin className="w-3.5 h-3.5 text-[#8C7077] absolute right-3 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: LEAD ROUTING & MULTI-SOURCING (IndiaMART-style Core Switch) */}
              <div className="bg-[#FAF1F5] p-3.5 rounded-xl border border-[#E0BEC6] space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    id="checkbox-multi-sourcing"
                    type="checkbox"
                    checked={broadcastToSimilar}
                    onChange={(e) => setBroadcastToSimilar(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#B90064] focus:ring-[#B90064] border-[#E0BEC6] accent-[#B90064] cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1C1B1B] flex items-center gap-1.5">
                      Send this enquiry to other verified suppliers of similar beauty products to get competitive rates.
                      <Sparkles className="w-3.5 h-3.5 text-[#B90064] shrink-0" />
                    </span>
                    <p className="text-[11px] text-[#594047] mt-0.5 leading-relaxed">
                      Increases response speed by <strong className="text-[#B90064]">3x</strong> by notifying up to 4 top-rated beauty manufacturers matching your specs.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit CTA & Trust Footer */}
              <div className="pt-2">
                <button
                  id="btn-submit-enquiry"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#B90064] hover:bg-[#a00057] active:bg-[#88004a] text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Sourcing Brief...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Business Enquiry</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-[#8C7077] mt-2 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Free B2B matchmaking • Zero commission • Direct supplier contact
                </p>
              </div>
            </form>
          ) : (
            /* SUCCESS STATE */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28 }}
              className="py-4 space-y-5"
            >
              {/* Checkmark Animation & Title */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C1B1B]">
                  Enquiry Sent Successfully!
                </h3>
                <p className="text-xs text-[#594047] max-w-md mx-auto">
                  Your business requirement has been delivered directly to the primary supplier's sales desk and recorded in the Nexora Sourcing Network.
                </p>

                {/* Reference ID badge */}
                <div className="inline-flex items-center gap-2 bg-[#FAF1F5] px-3 py-1.5 rounded-lg border border-[#E0BEC6] mt-2">
                  <span className="text-xs font-bold text-[#594047]">Reference ID:</span>
                  <span className="text-xs font-mono font-black text-[#B90064]">{referenceId}</span>
                  <button
                    onClick={handleCopyReference}
                    className="text-[#8C7077] hover:text-[#B90064] p-1 transition-colors cursor-pointer"
                    title="Copy Reference ID"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Matched Suppliers List */}
              <div className="bg-white p-4 rounded-xl border border-[#E8DFE3] space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EDEC] pb-2">
                  <span className="text-xs font-bold text-[#1C1B1B] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Suppliers Notified ({dispatchedSuppliers.length})
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Dispatched via Platform & Email
                  </span>
                </div>

                <div className="space-y-2">
                  {dispatchedSuppliers.map((supp, index) => (
                    <div
                      key={supp.id || index}
                      className="p-2.5 rounded-lg border border-[#F0EDEC] bg-[#FCF9F8] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF1F5] text-[#B90064] font-bold flex items-center justify-center text-xs shrink-0 border border-[#E0BEC6]">
                          {supp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1C1B1B] truncate flex items-center gap-1">
                            {supp.name}
                            <span className="text-[10px] text-emerald-600 font-normal">✓</span>
                          </p>
                          <p className="text-[11px] text-[#8C7077] truncate">
                            {supp.city} • {supp.badge}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 block">
                          {supp.responseRate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: [ View Sent Enquiries ] | [ Continue Browsing ] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  id="btn-view-sent-enquiries"
                  type="button"
                  onClick={() => {
                    if (onNavigateToDashboard) {
                      onNavigateToDashboard();
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full bg-[#B90064] hover:bg-[#a00057] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Sent Enquiries</span>
                </button>

                <button
                  id="btn-continue-browsing"
                  type="button"
                  onClick={onClose}
                  className="w-full bg-white hover:bg-[#F7F2F2] border border-[#E8DFE3] text-[#594047] hover:text-[#1C1B1B] font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue Browsing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
