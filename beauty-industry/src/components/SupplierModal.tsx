import React, { useState } from 'react';
import { X, Sparkles, Building2, MapPin, Mail, Phone, Calendar, Star, FileText, Send, CheckCircle2, ArrowRight, MessageSquare, ShieldCheck, Award, Tag, Gift, Copy, Check, Globe, Shield } from 'lucide-react';
import { SupplierPartner, Product } from '../types';
import { StarRating } from './StarRating';

interface SupplierModalProps {
  supplier: SupplierPartner | null;
  products: Product[];
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onMessageSupplier?: (supplier: SupplierPartner) => void;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  supplier,
  products,
  onClose,
  onSelectProduct,
  onMessageSupplier
}) => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sampleRequested, setSampleRequested] = useState<string | null>(null);

  if (!supplier) return null;

  const supplierProducts = products.filter((p) => p.supplierId === supplier.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setMessage('');
      setSent(false);
    }, 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRequestSample = (productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSampleRequested(productName);
    setTimeout(() => setSampleRequested(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EDEDED] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all shadow-xs cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#FFF5F8] via-[#FFF0F5] to-white border-b border-[#F0E6EC]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#B8005A] text-[#B8005A] flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                {supplier.initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1E1E1E]">{supplier.name}</h2>
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-white uppercase tracking-wider bg-gradient-to-r from-[#B8005A] via-[#931248] to-[#1E1E1E] border border-[#FFD1E3] px-3 py-1 rounded-full shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                      VERIFIED PARTNER
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#737373] mt-1.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-[#B8005A]" />
                    {supplier.type}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                    {supplier.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#8E8E93]" />
                    Est. {supplier.establishedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Rating */}
            <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 text-xs w-full sm:w-auto justify-between">
              <div className="bg-white px-3.5 py-2 rounded-2xl border border-[#EDEDED] shadow-xs flex items-center gap-2">
                <StarRating
                  rating={supplier.rating}
                  reviewsCount={supplier.reviewsCount}
                  size="md"
                  showVerifiedBadge={true}
                />
              </div>
              <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
                ⚡ {supplier.responseRate}
              </span>

              <div className="flex items-center gap-2 mt-1">
                <a
                  href={`tel:${supplier.phone}`}
                  className="bg-[#B8005A] hover:bg-[#A0004E] text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs hover:shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Call Distributor</span>
                </a>
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(supplier.name)},%20I%20am%20interested%20in%20your%20wholesale%20salon%20catalog.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs hover:shadow flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-[#525252] max-w-3xl leading-relaxed">
            {supplier.description}
          </p>

          {/* NEXORA LUXE VERIFIED PARTNER CERTIFICATION BANNER */}
          {supplier.verified && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#1A1A1A] via-[#2D1B28] to-[#1A1A1A] border border-[#FFD1E3]/30 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8005A]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#B8005A] p-0.5 shrink-0 shadow-md">
                    <div className="w-full h-full bg-[#1A1A1A] rounded-[10px] flex items-center justify-center text-[#FFD700]">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#FFD700] uppercase tracking-wider">
                        Verified Partner Status
                      </span>
                      <span className="text-[10px] font-bold bg-[#B8005A] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Nexora Luxe Standard
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Complies with Nexora Luxe B2B Quality Standards: ISO-audited facilities, 100% genuine backbar formulation guarantee, & escrow protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                  <span>Grade A+ Certified Supplier</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
                <span className="text-[#FFD700] font-bold">Verification Seals:</span>
                <span className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> ISO 22716 CGMP Audit
                </span>
                <span className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Authentic Salon Guarantee
                </span>
                <span className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Chemical Safety Verified
                </span>
                <span className="bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> B2B Escrow Coverage
                </span>
              </div>
            </div>
          )}

          {/* Supplier Quality & Trust Badges */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#F0E6EC]">
            <div className="bg-white/80 p-2 rounded-xl border border-[#FFD6E5] text-center">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Distributor Score</span>
              <span className="text-xs font-bold text-[#1E1E1E] flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                {supplier.rating.toFixed(1)} / 5.0
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-[#FFD6E5] text-center">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Fulfillment Rate</span>
              <span className="text-xs font-bold text-[#059669] block mt-0.5">99.4% On-Time</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-[#FFD6E5] text-center">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Formulation Quality</span>
              <span className="text-xs font-bold text-[#1E1E1E] block mt-0.5">100% Certified</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-[#FFD6E5] text-center">
              <span className="text-[10px] text-[#8E8E93] block font-medium">Verified Reviews</span>
              <span className="text-xs font-bold text-[#B8005A] block mt-0.5">{supplier.reviewsCount} Pro Salons</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#8E8E93] font-medium mr-1">Specialties:</span>
            {supplier.tags?.map((tag) => (
              <span key={tag} className="text-xs font-semibold text-[#B8005A] bg-white border border-[#FFD1E3] px-2.5 py-1 rounded-lg">
                {tag}
              </span>
            ))}
            <span className="text-xs text-[#525252] bg-white border border-[#E5E5E5] px-2.5 py-1 rounded-lg ml-auto">
              Min. Order Value: <strong>${supplier.minOrderValue}</strong>
            </span>
          </div>
        </div>

        {/* CURRENT OFFERS SECTION FROM DESIGN MOCK */}
        <div className="px-6 sm:px-8 pt-6 pb-2 border-b border-[#F0E6EC]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-extrabold text-[#1E1E1E] flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#B8005A]" />
              <span>Active Wholesale Offers & Salon Discounts</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#B8005A] bg-[#FFF0F5] px-2.5 py-0.5 rounded-full border border-[#FFD1E3]">
              Verified Partner Specials
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Offer Card 1 */}
            <div className="bg-gradient-to-br from-white to-[#FFF8FA] border border-[#FFD1E3] rounded-2xl p-4 relative overflow-hidden shadow-xs flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-[#B8005A] text-white px-2.5 py-0.5 rounded-bl-xl font-black text-[10px] tracking-wider uppercase">
                15% OFF
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] shrink-0 mt-1">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Wholesale Bulk Offer</h4>
                  <p className="text-[11px] text-[#525252] mt-0.5">On orders above ₹2,50,000 across all professional skincare & backbar lines.</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F0E6EC] flex items-center justify-between">
                <button
                  onClick={() => handleCopyCode('BULK15')}
                  className="bg-white border border-[#E5E5E5] hover:border-[#B8005A] px-3 py-1 rounded-lg font-mono text-xs text-[#1E1E1E] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === 'BULK15' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#8E8E93]" />}
                  <span>{copiedCode === 'BULK15' ? 'COPIED!' : 'BULK15'}</span>
                </button>
                <span className="text-[10px] text-[#8E8E93] font-medium">Valid till Nov 30</span>
              </div>
            </div>

            {/* Offer Card 2 */}
            <div className="bg-gradient-to-br from-white to-[#FFF8FA] border border-[#FFD1E3] rounded-2xl p-4 relative overflow-hidden shadow-xs flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-[#B8005A] text-white px-2.5 py-0.5 rounded-bl-xl font-black text-[10px] tracking-wider uppercase">
                BUY 10 GET 2
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] shrink-0 mt-1">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E1E1E]">Seasonal Salon Discount</h4>
                  <p className="text-[11px] text-[#525252] mt-0.5">Buy 10 Hair Treatment Kits, Get 2 Free + Expedited Shipping Included.</p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F0E6EC] flex items-center justify-between">
                <button
                  onClick={() => handleCopyCode('HAIRKIT10')}
                  className="bg-white border border-[#E5E5E5] hover:border-[#B8005A] px-3 py-1 rounded-lg font-mono text-xs text-[#1E1E1E] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode === 'HAIRKIT10' ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-[#8E8E93]" />}
                  <span>{copiedCode === 'HAIRKIT10' ? 'COPIED!' : 'HAIRKIT10'}</span>
                </button>
                <span className="text-[10px] text-[#8E8E93] font-medium">Limited Time Offer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Supplier Catalog */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-[#1E1E1E]">
                Catalog Products ({supplierProducts.length})
              </h3>
              <button
                onClick={() => alert(`Downloading latest wholesale line sheet for ${supplier.name}...`)}
                className="text-xs font-bold text-[#B8005A] hover:underline flex items-center gap-1 cursor-pointer bg-[#FFF0F5] px-3 py-1.5 rounded-xl border border-[#FFD1E3]"
              >
                <FileText className="w-3.5 h-3.5" />
                Download Line Sheet (PDF)
              </button>
            </div>

            {sampleRequested && (
              <div className="mb-3 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Sample request for "{sampleRequested}" logged! Rep will contact you shortly.</span>
              </div>
            )}

            {supplierProducts.length === 0 ? (
              <div className="p-8 text-center bg-[#FAFAFA] rounded-2xl border border-[#EDEDED] text-xs text-[#8E8E93]">
                No live catalog items available for this supplier right now. Request their full line sheet via direct message.
              </div>
            ) : (
              <div className="space-y-3">
                {supplierProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectProduct(p);
                    }}
                    className="p-3.5 rounded-2xl border border-[#EDEDED] hover:border-[#B8005A]/40 bg-white hover:bg-[#FFFDFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image || undefined}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#EDEDED] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">{p.brand}</span>
                          <StarRating rating={p.rating || 4.9} showCount={false} showNumber={true} size="xs" />
                          <span className="text-[10px] font-bold bg-[#ECFDF5] text-[#059669] px-2 py-0.5 rounded-full">In Stock</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1E1E1E] group-hover:text-[#B8005A] transition-colors">{p.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-[#737373] mt-0.5">
                          <span className="font-bold text-[#1E1E1E]">${p.price.toFixed(2)} / {p.unit}</span>
                          <span>•</span>
                          <span>MOQ: {p.moq}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={(e) => handleRequestSample(p.name, e)}
                        className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] hover:border-[#B8005A] hover:bg-[#FFF0F5] text-[11px] font-bold text-[#525252] hover:text-[#B8005A] transition-colors cursor-pointer"
                      >
                        Sample
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectProduct(p);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#B8005A] hover:bg-[#A0004E] text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Business Details & Direct Wholesale Message */}
          <div className="lg:col-span-5 space-y-4">
            {/* Business Trust Credentials */}
            <div className="bg-[#FAFAFA] p-5 rounded-2xl border border-[#EDEDED]">
              <h4 className="text-xs font-black text-[#1E1E1E] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#B8005A]" />
                <span>Business Credentials</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#EDEDED] flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#B8005A] shrink-0" />
                  <div>
                    <strong className="text-[#1E1E1E] block font-bold">ISO 9001:2015</strong>
                    <span className="text-[#737373] text-[11px]">Certified Quality Management Facility</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EDEDED] flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#B8005A] shrink-0" />
                  <div>
                    <strong className="text-[#1E1E1E] block font-bold">{new Date().getFullYear() - (supplier.establishedYear || 2010)}+ Years in Business</strong>
                    <span className="text-[#737373] text-[11px]">Established in {supplier.establishedYear || 2010}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#EDEDED] flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#B8005A] shrink-0" />
                  <div>
                    <strong className="text-[#1E1E1E] block font-bold">Global Export & Pan-India Reach</strong>
                    <span className="text-[#737373] text-[11px]">Supplying 20+ Countries & Major Salon Hubs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Supplier Inquiry Form */}
            <div className="bg-[#FAFAFA] p-5 rounded-2xl border border-[#EDEDED] flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#B8005A]" />
                  Direct Supplier Inquiry
                </h3>
                <p className="text-xs text-[#737373] mt-1">
                  Ask about custom formulations, private label minimums, or European/US freight terms.
                </p>

                <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#525252] uppercase">Your Message</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hello, I represent a luxury salon group with 4 locations. We are interested in your wholesale pricing and distributor terms..."
                      className="mt-1 w-full bg-white border border-[#E5E5E5] rounded-xl p-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#B8005A] resize-none"
                      required
                    />
                  </div>

                  <div className="text-[11px] text-[#8E8E93] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#B8005A]" />
                    <span>Direct Rep: {supplier.phone}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="submit"
                      className="w-full bg-[#1E1E1E] hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Inquiry</span>
                    </button>

                    {onMessageSupplier && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onMessageSupplier(supplier);
                        }}
                        className="w-full bg-[#FFF0F5] hover:bg-[#FFE4EE] text-[#B8005A] border border-[#FFD1E3] py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Live Chat Now</span>
                      </button>
                    )}
                  </div>
                </form>

                {sent && (
                  <div className="mt-3 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Inquiry dispatched directly to {supplier.name} sales team!</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#EAEAEA] text-[11px] text-[#8E8E93]">
                🛡️ All transactions and distributor contracts on Nexora Luxe are protected by Verified B2B Escrow terms.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

