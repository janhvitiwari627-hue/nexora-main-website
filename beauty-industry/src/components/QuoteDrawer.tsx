import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, CheckCircle2, ArrowRight, ShieldCheck, FileText, Send } from 'lucide-react';
import { QuoteItem } from '../types';

interface QuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuoteItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearQuote: () => void;
}

export const QuoteDrawer: React.FC<QuoteDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearQuote
}) => {
  const [businessName, setBusinessName] = useState('Jaipur Luxury Beauty Hub');
  const [contactEmail, setContactEmail] = useState('ananya@royalglamour.in');
  const [shippingCity, setShippingCity] = useState('Jaipur');
  const [notes, setNotes] = useState('Please include estimated transport timeline and tester unit samples.');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');

  const grandTotal = items.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `RFQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryId(id);
    setIsSubmitted(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-[#EDEDED] relative overflow-hidden"
          >
            {/* Top Header */}
            <div className="p-6 border-b border-[#F0E6EC] bg-gradient-to-r from-[#FFF5F8] to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FFF0F5] border border-[#FFD1E3] flex items-center justify-center text-[#B8005A] shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1E1E]">Wholesale Quote Request (RFQ)</h2>
                  <p className="text-xs text-[#737373]">{items.length} product lines selected</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="py-12 text-center flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] flex items-center justify-center text-[#10B981] mb-4 shadow-sm"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#1E1E1E]">Inquiry Dispatched!</h3>
                  <p className="text-xs text-[#737373] mt-1 font-mono bg-[#FAFAFA] px-3 py-1 rounded-full border border-[#EDEDED] inline-block">
                    Reference: {inquiryId}
                  </p>
                  <p className="text-xs text-[#525252] mt-3 max-w-xs leading-relaxed">
                    Direct wholesale quotes and lead-time schedules have been sent to <strong>{contactEmail}</strong>.
                  </p>

                  <button
                    onClick={() => {
                      onClearQuote();
                      setIsSubmitted(false);
                      onClose();
                    }}
                    className="mt-6 bg-[#B8005A] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-[#A0004E] cursor-pointer transition-transform active:scale-95"
                  >
                    Done & Return to Catalog
                  </button>
                </motion.div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-[#8E8E93] flex flex-col items-center">
                  <FileText className="w-12 h-12 text-[#E5E5E5] mb-3" />
                  <h3 className="text-sm font-bold text-[#1E1E1E]">Your RFQ list is empty</h3>
                  <p className="text-xs text-[#737373] mt-1 max-w-xs">
                    Browse our catalog and add items with their minimum order quantities to generate wholesale quotes.
                  </p>
                </div>
              ) : (
                <>
                  {/* Product Lines List */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.product.id}
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          className="p-3.5 rounded-2xl border border-[#EDEDED] bg-white flex items-center justify-between gap-3 shadow-2xs overflow-hidden"
                        >
                          <img
                            src={item.product.image || undefined}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#EDEDED] shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-[#8E8E93] uppercase block truncate">
                              {item.product.brand} • {item.product.supplierName}
                            </span>
                            <h4 className="text-xs font-bold text-[#1E1E1E] truncate">{item.product.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-[#737373] mt-1">
                              <span className="font-bold text-[#B8005A]">₹{item.unitPrice.toLocaleString('en-IN')}/{item.product.unit || 'unit'}</span>
                              <span>•</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-xs font-bold text-[#1E1E1E]">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-[#EF4444] hover:text-[#DC2626] p-1 text-xs cursor-pointer transition-colors"
                              title="Remove product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Inquiry Form */}
                  <form onSubmit={handleSubmitInquiry} className="space-y-4 pt-4 border-t border-[#F0F0F0]">
                    <h3 className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wider">
                      Buyer & Shipping Information
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Business Name</label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required
                          className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Destination City</label>
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          required
                          className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#525252] uppercase block mb-1">Notes & Questions</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A] resize-none"
                      />
                    </div>

                    {/* Total Summary */}
                    <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#FFD6E5] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#737373] block">Estimated Wholesale Total</span>
                        <span className="text-lg font-bold text-[#1E1E1E]">₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Direct Tier Discount Applied</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#B8005A] hover:bg-[#A0004E] text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Wholesale RFQ to Verified Suppliers</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
