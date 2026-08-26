import React, { useState } from 'react';
import { CATEGORY_TAXONOMY, getSubcategoriesForCategoryName } from '../data/categories';
import {
  X,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  Radio,
  Copy,
  Check,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RFQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RFQModal: React.FC<RFQModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState('Skincare');
  const [subcategory, setSubcategory] = useState('Serums & Treatments');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Units');
  const [city, setCity] = useState('');
  const [supplierType, setSupplierType] = useState('Manufacturer / OEM');
  const [description, setDescription] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen) return null;

  const rfqReference = `RFQ-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !quantity.trim() || !buyerPhone.trim()) {
      setErrorMessage('Please fill in product name, required quantity, and your contact phone.');
      return;
    }
    setErrorMessage('');
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setProductName('');
    setQuantity('');
    setCity('');
    setDescription('');
    setBuyerName('');
    setBuyerPhone('');
    setCopiedRef(false);
    onClose();
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(rfqReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-2xl border border-[#e8e8e8] w-full max-w-xl shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#e8e8e8] flex items-center justify-between bg-[#fcf9f8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b90064] text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1c1b1b]">Post Sourcing Requirement (RFQ)</h3>
              <p className="text-[12px] text-[#594047]">Receive direct quotes from verified manufacturers across India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content with AnimatePresence */}
        <div className="p-6 relative">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="rfq-success-overlay"
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-4 space-y-5"
              >
                {/* Animated Pulsing Icon */}
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-[#fde7f3] rounded-full opacity-60"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="w-16 h-16 bg-[#b90064] text-white rounded-full flex items-center justify-center shadow-lg relative z-10"
                  >
                    <CheckCircle2 className="w-9 h-9" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-xs z-20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.div>
                </div>

                {/* Main Headline */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fde7f3] text-[#b90064] rounded-full text-[11px] font-bold tracking-wide uppercase mb-1.5 border border-[#e0bec6]">
                    <Radio className="w-3.5 h-3.5 text-[#b90064] animate-pulse" />
                    <span>Broadcast Active to 40+ Labs</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#1c1b1b]">Requirement Posted Successfully!</h4>
                  <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1">
                    Your RFQ has been broadcasted to verified beauty suppliers matching your requirement. Expect direct structured quotes in your inbox within 24 hours.
                  </p>
                </div>

                {/* Commercial Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#f7f2f2] p-4 rounded-xl text-left text-[12px] space-y-2 border border-[#e8e8e8] max-w-md mx-auto"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-[#e8e8e8]">
                    <span className="text-[#8c7077]">Requirement:</span>
                    <span className="font-bold text-[#1c1b1b] truncate max-w-[200px]">{productName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8c7077]">Quantity:</span>
                    <span className="font-bold text-[#1c1b1b]">{quantity} {unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8c7077]">Target Supplier Type:</span>
                    <span className="font-semibold text-[#b90064]">{supplierType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#8c7077]">Destination Hub:</span>
                    <span className="font-semibold text-[#1c1b1b]">{city || 'All India'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#e8e8e8] text-[11px]">
                    <span className="text-[#8c7077]">RFQ Reference ID:</span>
                    <button
                      onClick={handleCopyRef}
                      className="font-mono text-[#b90064] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{rfqReference}</span>
                      {copiedRef ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#8c7077]" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Workflow Progression Stepper */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[11.5px] text-left max-w-md mx-auto"
                >
                  <div className="flex items-center gap-2 text-[#1c1b1b] font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#b90064]" />
                    <span>Next step in your workspace</span>
                  </div>
                  <p className="text-[#594047]">
                    Suppliers will submit formal quotes. You can compare formulation lead times, batch pricing, and sample availability in your <strong>Buyer RFQ Hub</strong>.
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="w-full max-w-md bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Close &amp; Continue Browsing</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="rfq-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-lg">
                    {errorMessage}
                  </div>
                )}

                {/* Category & Subcategory Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Category <span className="text-[#b90064]">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setCategory(newCat);
                        const subs = getSubcategoriesForCategoryName(newCat);
                        if (subs.length > 0) setSubcategory(subs[0]);
                      }}
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[12.5px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                    >
                      {Object.keys(CATEGORY_TAXONOMY).map((catName) => (
                        <option key={catName} value={catName}>
                          {catName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Subcategory <span className="text-[#b90064]">*</span>
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3 py-2 text-[12.5px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                    >
                      {getSubcategoriesForCategoryName(category).map((subItem) => (
                        <option key={subItem} value={subItem}>
                          {subItem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product / Formulation Title */}
                <div>
                  <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                    Product / Formulation Needed <span className="text-[#b90064]">*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. 200L Botanical Hair Smoothing Treatment or 30ml Dropper Bottles"
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                    required
                  />
                </div>

                {/* Quantity & Unit Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Required Quantity <span className="text-[#b90064]">*</span>
                    </label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Measurement Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                    >
                      <option value="Units">Units / Pieces</option>
                      <option value="Liters">Liters</option>
                      <option value="Kilograms">Kilograms (kg)</option>
                      <option value="Bottles / Jars">Bottles / Jars</option>
                      <option value="Sets">Complete Sets</option>
                    </select>
                  </div>
                </div>

                {/* City & Supplier Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Delivery City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai, Bengaluru, Delhi"
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Preferred Supplier
                    </label>
                    <select
                      value={supplierType}
                      onChange={(e) => setSupplierType(e.target.value)}
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2.5 text-[13px] text-[#1c1b1b] focus:outline-none cursor-pointer"
                    >
                      <option value="Manufacturer / OEM">Manufacturer / OEM</option>
                      <option value="Wholesaler / Stockist">Wholesaler / Stockist</option>
                      <option value="Authorized Distributor">Authorized Distributor</option>
                      <option value="Any Verified Supplier">Any Verified Supplier</option>
                    </select>
                  </div>
                </div>

                {/* Requirement Notes */}
                <div>
                  <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                    Specifications / Lab Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mention formulation grade, active percentages, packaging requirements, sample need, or delivery deadlines..."
                    className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg p-3 text-[13px] text-[#1c1b1b] focus:outline-none resize-none"
                  />
                </div>

                {/* Buyer Contact Row */}
                <div className="pt-2 border-t border-[#f0edec] grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Your Name / Business
                    </label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Priya Sharma (Luxe Glow Salon)"
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#1c1b1b] mb-1">
                      Mobile Number <span className="text-[#b90064]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#f7f2f2] border border-[#e8e8e8] focus:border-[#b90064] rounded-lg px-3.5 py-2 text-[13px] text-[#1c1b1b] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-[13px] font-semibold text-[#594047] hover:bg-[#f7f2f2] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Post Requirement</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

