import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShoppingBag, 
  Building2, 
  MapPin, 
  Truck, 
  Clock, 
  Award, 
  SlidersHorizontal,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';
import { Product, SupplierPartner } from '../types';
import { StarRating } from './StarRating';

interface CompareModalProps {
  isOpen: boolean;
  selectedProducts: Product[];
  allProducts: Product[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onAddProduct: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onAddToQuote: (product: Product, quantity: number) => void;
  onMessageSupplier?: (supplier: string, product?: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  selectedProducts,
  allProducts,
  onClose,
  onRemoveProduct,
  onAddProduct,
  onSelectProduct,
  onAddToQuote,
  onMessageSupplier
}) => {
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [isAddPickerOpen, setIsAddPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract all unique specification keys across selected products
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    (selectedProducts || []).forEach((p) => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [selectedProducts]);

  // Extract all unique certifications
  const allCertifications = useMemo(() => {
    const certs = new Set<string>();
    (selectedProducts || []).forEach((p) => {
      p.certifications?.forEach((c) => certs.add(c));
    });
    return Array.from(certs);
  }, [selectedProducts]);

  if (!isOpen) return null;

  // Available products to add (not currently selected)
  const availableToAdd = (allProducts || []).filter(
    (p) => !(selectedProducts || []).some((sp) => sp.id === p.id)
  );

  // Check if a row has differences
  const hasRowDifference = (getValue: (p: Product) => any) => {
    const list = selectedProducts || [];
    if (list.length <= 1) return false;
    const firstVal = JSON.stringify(getValue(list[0]));
    return list.some((p) => JSON.stringify(getValue(p)) !== firstVal);
  };

  // Copy textual summary of comparison to clipboard
  const handleCopyComparison = () => {
    const lines: string[] = [
      `=== NEXORA LUXE - PRODUCT COMPARISON ===`,
      `Date: ${new Date().toLocaleDateString()}`,
      ''
    ];

    (selectedProducts || []).forEach((p, idx) => {
      lines.push(
        `[Product ${idx + 1}] ${p.name} (${p.brand})`,
        `Price: ₹${p.price.toLocaleString('en-IN')} / ${p.unit} | MOQ: ${p.moq} units | Total Min: ₹${(p.price * p.moq).toLocaleString('en-IN')}`,
        `Stock: ${p.stockStatus} | Lead Time: ${p.leadTimeDays} days | Supplier: ${p.supplierName} (${p.supplierLocation})`,
        `Certifications: ${p.certifications?.join(', ') || 'N/A'}`,
        'Specifications:'
      );
      if (p.specifications) {
        Object.entries(p.specifications).forEach(([k, v]) => {
          lines.push(`  - ${k}: ${v}`);
        });
      }
      lines.push('----------------------------------------');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const safeSelectedProducts = selectedProducts || [];
  // Find lowest price
  const lowestPrice = safeSelectedProducts.length > 0 ? Math.min(...safeSelectedProducts.map((p) => p.price)) : 0;
  // Find lowest MOQ
  const lowestMoq = safeSelectedProducts.length > 0 ? Math.min(...safeSelectedProducts.map((p) => p.moq)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl border border-[#EDEDED] flex flex-col relative">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#F0ECE4] bg-[#FCFBF8] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] flex items-center justify-center shadow-xs shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1A1A1A] tracking-tight">
                  Product & Wholesale Comparison
                </h2>
                <span className="bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {selectedProducts.length} of 3 Selected
                </span>
              </div>
              <p className="text-xs text-[#737373] mt-0.5">
                Analyze technical specifications, B2B wholesale tiers, certifications, and supplier credentials side-by-side.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Highlight Differences Switch */}
            {selectedProducts.length > 1 && (
              <button
                onClick={() => setHighlightDifferences(!highlightDifferences)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  highlightDifferences
                    ? 'bg-[#FFF0F5] text-[#B8005A] border-[#FFD1E3] shadow-xs'
                    : 'bg-white text-[#737373] border-[#EAE5DE] hover:border-gray-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${
                  highlightDifferences ? 'bg-[#B8005A] border-[#B8005A] text-white' : 'border-[#CCCCCC]'
                }`}>
                  {highlightDifferences && <Check className="w-2.5 h-2.5" />}
                </div>
                <span>Highlight Differences</span>
              </button>
            )}

            {/* Copy / Export Button */}
            <button
              onClick={handleCopyComparison}
              disabled={selectedProducts.length === 0}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-[#EAE5DE] text-[#4A4A4A] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Copy side-by-side summary to clipboard"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981] font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#FFF0F5] text-[#737373] hover:text-[#B8005A] border border-[#EAE5DE] flex items-center justify-center transition-all shadow-xs cursor-pointer"
              aria-label="Close comparison modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-white">
          {selectedProducts.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#FFF0F5] text-[#B8005A] flex items-center justify-center mx-auto mb-4 border border-[#FFD1E3]">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">No products selected for comparison</h3>
              <p className="text-xs text-[#737373] mt-2">
                Browse our catalog and select up to 3 luxury beauty & salon products to compare specifications, prices, and suppliers side-by-side.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-[#B8005A] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#A0004E] cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="min-w-[700px]">
              
              {/* Product Header Cards Row */}
              <div className="grid grid-cols-12 gap-4 pb-6 border-b border-[#F0ECE4]">
                {/* Feature Label Column */}
                <div className="col-span-3 flex flex-col justify-end pr-3">
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EFEBE4]">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                      <Sparkles className="w-4 h-4 text-[#B8005A]" />
                      <span>Comparison Matrix</span>
                    </div>
                    <p className="text-[11px] text-[#737373] mt-1 leading-snug">
                      Review key specifications, minimum orders, certifications, and volume pricing.
                    </p>
                  </div>
                </div>

                {/* Product Column Cards (up to 3) */}
                {selectedProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`${
                      selectedProducts.length === 1 
                        ? 'col-span-6' 
                        : selectedProducts.length === 2 
                        ? 'col-span-4' 
                        : 'col-span-3'
                    } flex flex-col justify-between bg-[#FCFBF8] border border-[#EAE5DE] hover:border-[#B8005A]/40 rounded-2xl p-3.5 transition-all relative group shadow-2xs`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-[#FFF0F5] text-[#8E8E93] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all shadow-xs cursor-pointer"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Image & Badges */}
                    <div 
                      onClick={() => onSelectProduct(product)}
                      className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-[#EFEBE4] mb-3 cursor-pointer group/img"
                    >
                      <img
                        src={product.image || undefined}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <span className="bg-white/95 backdrop-blur-xs text-[#1A1A1A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/40 shadow-xs">
                          {product.tag}
                        </span>
                        {product.isVerified && (
                          <span className="bg-gradient-to-r from-[#B8005A] to-[#931248] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            VERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Name & Brand */}
                    <div className="flex-1">
                      <div className="text-[10px] font-extrabold text-[#8E8E93] uppercase tracking-wider mb-1">
                        {product.brand}
                      </div>
                      <h4 
                        onClick={() => onSelectProduct(product)}
                        className="text-sm font-bold text-[#1A1A1A] hover:text-[#B8005A] transition-colors line-clamp-2 cursor-pointer leading-tight mb-2"
                      >
                        {product.name}
                      </h4>
                      <StarRating rating={product.rating || 4.9} reviewsCount={product.reviewsCount || 40} size="xs" compact={true} />
                    </div>

                    {/* Pricing Highlight */}
                    <div className="mt-3 pt-3 border-t border-[#EFEBE4] flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-[#1A1A1A]">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] font-medium">
                          / {product.unit}
                        </span>
                      </div>
                      {product.price === lowestPrice && selectedProducts.length > 1 && (
                        <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          Best Price
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex flex-col gap-1.5">
                      <button
                        onClick={() => onAddToQuote(product, product.moq)}
                        className="w-full bg-[#B8005A] hover:bg-[#A0004E] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add MOQ ({product.moq}) to RFQ</span>
                      </button>
                      <button
                        onClick={() => onSelectProduct(product)}
                        className="w-full bg-white hover:bg-gray-50 text-[#1A1A1A] border border-[#EAE5DE] text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#737373]" />
                        <span>Full Specs</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Another Product Card Slot (when < 3) */}
                {selectedProducts.length < 3 && (
                  <div 
                    className={`${
                      selectedProducts.length === 1 ? 'col-span-3' : 'col-span-3'
                    } flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E0DAD0] hover:border-[#B8005A]/50 bg-[#FAFAFA] rounded-2xl text-center transition-all relative`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE5DE] text-[#B8005A] flex items-center justify-center shadow-xs mb-3">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h5 className="text-xs font-bold text-[#1A1A1A]">Compare Another Product</h5>
                    <p className="text-[11px] text-[#737373] mt-1 mb-3">
                      Add {3 - selectedProducts.length} more item{3 - selectedProducts.length > 1 ? 's' : ''} to compare side-by-side.
                    </p>
                    
                    <div className="relative w-full">
                      <button
                        onClick={() => setIsAddPickerOpen(!isAddPickerOpen)}
                        className="w-full py-2 px-3 bg-white hover:bg-[#FFF0F5] border border-[#EAE5DE] hover:border-[#FFD1E3] text-[#B8005A] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Select Product...</span>
                      </button>

                      {/* Dropdown product picker */}
                      {isAddPickerOpen && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 z-30 bg-white rounded-2xl shadow-xl border border-[#EDEDED] p-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
                          <div className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider px-2.5 py-1.5 border-b border-gray-100">
                            Available in Catalog ({availableToAdd.length})
                          </div>
                          {availableToAdd.length === 0 ? (
                            <div className="p-3 text-xs text-gray-500 text-center">All products already added</div>
                          ) : (
                            availableToAdd.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  onAddProduct(p);
                                  setIsAddPickerOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FFF0F5] text-left transition-colors cursor-pointer group"
                              >
                                <img
                                  src={p.image || undefined}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#B8005A] truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-[10px] text-[#737373]">
                                    ₹{p.price.toLocaleString('en-IN')} • MOQ: {p.moq}
                                  </div>
                                </div>
                                <Plus className="w-3.5 h-3.5 text-[#B8005A] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 1: Commercial & Wholesale Terms */}
              <div className="mt-6 mb-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B8005A] bg-[#FFF0F5] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Commercial & Wholesale Terms</span>
                </div>

                <div className="border border-[#EAE5DE] rounded-2xl overflow-hidden divide-y divide-[#EAE5DE] text-xs">
                  {/* Row: Price per Unit */}
                  {(!highlightDifferences || hasRowDifference((p) => p.price)) && (
                    <div className="grid grid-cols-12 items-center p-3.5 hover:bg-gray-50/70 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A] flex items-center gap-1.5">
                        <span>Wholesale Unit Price</span>
                      </div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-semibold text-[#1A1A1A]`}>
                          <span className="text-sm font-extrabold text-[#1A1A1A]">₹{p.price.toLocaleString('en-IN')}</span>
                          <span className="text-[#8E8E93] text-[11px] ml-1">/ {p.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row: Minimum Order Quantity (MOQ) */}
                  {(!highlightDifferences || hasRowDifference((p) => p.moq)) && (
                    <div className="grid grid-cols-12 items-center p-3.5 bg-[#FAF8F5]/60 hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A]">Minimum Order (MOQ)</div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-semibold text-[#1A1A1A] flex items-center gap-2`}>
                          <span className="bg-white border border-[#EAE5DE] px-2.5 py-1 rounded-lg font-bold">
                            {p.moq} {p.unit}s
                          </span>
                          {p.moq === lowestMoq && selectedProducts.length > 1 && (
                            <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                              Lowest MOQ
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row: Est. Minimum Order Total */}
                  {(!highlightDifferences || hasRowDifference((p) => p.price * p.moq)) && (
                    <div className="grid grid-cols-12 items-center p-3.5 hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A]">Min. Order Investment</div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-extrabold text-[#B8005A]`}>
                          ₹{(p.price * p.moq).toLocaleString('en-IN')}
                          <span className="text-[10px] text-[#8E8E93] font-normal block">
                            ({p.moq} units × ₹{p.price.toLocaleString('en-IN')})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row: Volume Pricing Tiers */}
                  {(!highlightDifferences || hasRowDifference((p) => p.wholesaleTiers)) && (
                    <div className="grid grid-cols-12 items-start p-3.5 bg-[#FAF8F5]/60 hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A] pt-1">Volume Tier Pricing</div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 space-y-1`}>
                          {p.wholesaleTiers && p.wholesaleTiers.length > 0 ? (
                            p.wholesaleTiers.map((tier, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] bg-white border border-[#EFEBE4] px-2 py-1 rounded-lg">
                                <span className="text-[#555] font-medium">{tier.minUnits}+ units:</span>
                                <span className="font-extrabold text-[#1A1A1A]">₹{tier.pricePerUnit.toLocaleString('en-IN')}/ea</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[#8E8E93] text-[11px]">Standard wholesale only</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row: Stock Status */}
                  {(!highlightDifferences || hasRowDifference((p) => p.stockStatus)) && (
                    <div className="grid grid-cols-12 items-center p-3.5 hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A]">Availability & Stock</div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 flex items-center gap-1.5`}>
                          <span className={`w-2 h-2 rounded-full ${
                            p.stockStatus === 'In Stock'
                              ? 'bg-[#10B981]'
                              : p.stockStatus === 'Low Stock'
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#6366F1]'
                          }`} />
                          <span className={`font-bold ${
                            p.stockStatus === 'In Stock'
                              ? 'text-[#059669]'
                              : p.stockStatus === 'Low Stock'
                              ? 'text-[#D97706]'
                              : 'text-[#4F46E5]'
                          }`}>
                            {p.stockStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row: Lead Time */}
                  {(!highlightDifferences || hasRowDifference((p) => p.leadTimeDays)) && (
                    <div className="grid grid-cols-12 items-center p-3.5 bg-[#FAF8F5]/60 hover:bg-gray-50 transition-colors">
                      <div className="col-span-3 font-bold text-[#4A4A4A] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8E8E93]" />
                        <span>Fulfillment Lead Time</span>
                      </div>
                      {selectedProducts.map((p) => (
                        <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-semibold text-[#1A1A1A]`}>
                          {p.leadTimeDays} Business Days
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: Technical Specifications Matrix */}
              <div className="mb-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B8005A] bg-[#FFF0F5] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Technical & Formulation Specifications</span>
                </div>

                <div className="border border-[#EAE5DE] rounded-2xl overflow-hidden divide-y divide-[#EAE5DE] text-xs">
                  {allSpecKeys.map((key, idx) => {
                    const differs = hasRowDifference((p) => p.specifications?.[key] || '—');
                    if (highlightDifferences && !differs) return null;

                    return (
                      <div 
                        key={key} 
                        className={`grid grid-cols-12 items-center p-3.5 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]/60'
                        } ${differs && highlightDifferences ? 'bg-[#FFF5F8] border-l-4 border-l-[#B8005A]' : ''}`}
                      >
                        <div className="col-span-3 font-bold text-[#4A4A4A]">{key}</div>
                        {selectedProducts.map((p) => (
                          <div 
                            key={p.id} 
                            className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 text-[#1A1A1A] font-medium leading-relaxed`}
                          >
                            {p.specifications?.[key] ? (
                              <span className="font-semibold">{p.specifications[key]}</span>
                            ) : (
                              <span className="text-[#A0A0A0] italic">Not Applicable</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Certifications & Quality Standards */}
              <div className="mb-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B8005A] bg-[#FFF0F5] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                  <Award className="w-3.5 h-3.5" />
                  <span>Certifications & Compliance Standards</span>
                </div>

                <div className="border border-[#EAE5DE] rounded-2xl overflow-hidden divide-y divide-[#EAE5DE] text-xs">
                  {allCertifications.map((cert) => {
                    const differs = hasRowDifference((p) => p.certifications?.includes(cert));
                    if (highlightDifferences && !differs) return null;

                    return (
                      <div key={cert} className="grid grid-cols-12 items-center p-3.5 bg-white hover:bg-gray-50 transition-colors">
                        <div className="col-span-3 font-bold text-[#4A4A4A]">{cert}</div>
                        {selectedProducts.map((p) => {
                          const hasCert = p.certifications?.includes(cert);
                          return (
                            <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 flex items-center gap-1.5`}>
                              {hasCert ? (
                                <span className="inline-flex items-center gap-1 text-[#059669] font-bold bg-[#ECFDF5] px-2 py-0.5 rounded-md text-[11px]">
                                  <Check className="w-3 h-3 text-[#059669]" />
                                  <span>Certified</span>
                                </span>
                              ) : (
                                <span className="text-[#A0A0A0] text-[11px]">Not Listed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Supplier Credentials & Logistics */}
              <div className="mb-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B8005A] bg-[#FFF0F5] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Supplier Credentials & Logistics</span>
                </div>

                <div className="border border-[#EAE5DE] rounded-2xl overflow-hidden divide-y divide-[#EAE5DE] text-xs">
                  {/* Supplier Name */}
                  <div className="grid grid-cols-12 items-center p-3.5 bg-white hover:bg-gray-50 transition-colors">
                    <div className="col-span-3 font-bold text-[#4A4A4A]">Distributor / Supplier</div>
                    {selectedProducts.map((p) => (
                      <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-bold text-[#1A1A1A]`}>
                        {p.supplierName}
                      </div>
                    ))}
                  </div>

                  {/* Sourcing Location */}
                  <div className="grid grid-cols-12 items-center p-3.5 bg-[#FAF8F5]/60 hover:bg-gray-50 transition-colors">
                    <div className="col-span-3 font-bold text-[#4A4A4A] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                      <span>Origin / Hub Location</span>
                    </div>
                    {selectedProducts.map((p) => (
                      <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 font-medium text-[#4A4A4A]`}>
                        {p.supplierLocation}
                      </div>
                    ))}
                  </div>

                  {/* Partner Verification */}
                  <div className="grid grid-cols-12 items-center p-3.5 bg-white hover:bg-gray-50 transition-colors">
                    <div className="col-span-3 font-bold text-[#4A4A4A]">Verification Tier</div>
                    {selectedProducts.map((p) => (
                      <div key={p.id} className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} pr-3 flex items-center gap-1.5`}>
                        {p.isVerified ? (
                          <span className="bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Nexora Gold Verified
                          </span>
                        ) : (
                          <span className="text-[#737373] text-[11px]">Standard Partner</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 5: Description & Summary */}
              <div className="mb-8">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#B8005A] bg-[#FFF0F5] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                  <Info className="w-3.5 h-3.5" />
                  <span>Product Overview & Salon Use Case</span>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3 text-xs font-bold text-[#4A4A4A] p-2">
                    Commercial Summary
                  </div>
                  {selectedProducts.map((p) => (
                    <div 
                      key={p.id} 
                      className={`${selectedProducts.length === 1 ? 'col-span-6' : selectedProducts.length === 2 ? 'col-span-4' : 'col-span-3'} bg-[#FAF8F5] border border-[#EAE5DE] rounded-2xl p-4 text-xs text-[#525252] leading-relaxed`}
                    >
                      {p.description}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-[#F0ECE4] bg-[#FCFBF8] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#737373]">
            Comparing <span className="font-bold text-[#1A1A1A]">{selectedProducts.length}</span> of 3 products • Click any product to view 360° detail views or message distributor
          </div>

          <div className="flex items-center gap-3">
            {safeSelectedProducts.length > 0 && (
              <button
                onClick={() => {
                  safeSelectedProducts.forEach((p) => onRemoveProduct(p.id));
                }}
                className="px-4 py-2 text-xs font-bold text-[#737373] hover:text-[#B8005A] cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done & Return to Catalog
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
