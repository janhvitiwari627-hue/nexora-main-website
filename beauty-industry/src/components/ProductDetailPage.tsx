import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Send,
  Phone,
  MessageCircle,
  FileText,
  Clock,
  Package,
  CheckCircle2,
  Award,
  Factory,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Layers,
  FlaskConical,
  Truck,
  HelpCircle
} from 'lucide-react';
import { ProductDetailData } from '../types';
import { SPONSORED_PRODUCTS_DB } from '../data/sponsoredProductsData';
import { VerifiedBadge } from './VerifiedBadge';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onOpenEnquiryModal: (item: { name: string; supplierName: string }) => void;
  onOpenRFQModal: () => void;
  onNavigateToSampleRequest?: () => void;
  onNavigateToSupplierProfile?: (supplierId: string) => void;
  onCallSupplier: (name: string, phone: string) => void;
  onWhatsAppSupplier: (name: string, whatsapp: string) => void;
  onOpenChat?: (
    supplier: { id: string; name: string; location: string; isVerified: boolean },
    product: { title: string; image: string; price?: string; moq?: string }
  ) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onOpenEnquiryModal,
  onOpenRFQModal,
  onNavigateToSampleRequest,
  onNavigateToSupplierProfile,
  onCallSupplier,
  onWhatsAppSupplier,
  onOpenChat,
}) => {
  // Retrieve product details from DB
  const product: ProductDetailData | undefined = SPONSORED_PRODUCTS_DB[productId];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'formulation' | 'packaging' | 'compliance'>('specs');

  // Fallback state if product ID is invalid or removed
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#1c1b1b]">Product Listing Unavailable</h2>
        <p className="text-sm text-[#594047] mt-2 max-w-md mx-auto">
          The requested product ID <code className="bg-gray-100 px-2 py-0.5 rounded text-red-600 font-mono text-xs">{productId}</code> is no longer active, unpublished, or has been updated by the seller.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#b90064] text-white font-bold text-sm hover:bg-[#a00056] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf8f8] pb-16">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-[#e8e8e8] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#594047]">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[#b90064] font-bold hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="hover:text-black cursor-pointer" onClick={onBack}>Explore</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#1c1b1b] font-medium truncate max-w-[200px] sm:max-w-none">
              {product.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
            <span className="text-gray-400 font-normal truncate max-w-[150px] hidden sm:inline">
              {product.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md">
              ID: {product.id}
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] rounded-md">
              SELLER: {product.seller_id}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Main Product Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden p-3 relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#b90064] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sponsored Listing
                </span>
              </div>
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#b90064] shadow-sm scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Supplier Card Summary */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase font-bold text-[#b90064] tracking-wider">
                    Official Supplier
                  </p>
                  <h3 className="text-base font-extrabold text-[#1c1b1b]">
                    {product.supplierName}
                  </h3>
                  <p className="text-xs text-[#594047] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#b90064]" />
                    {product.supplierLocation}
                  </p>
                </div>
                <VerifiedBadge />
              </div>

              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Trust Score</span>
                  <span className="font-extrabold text-[#1c1b1b]">
                    {product.sellerDetails.trustScore}/100 Verified
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Response Time</span>
                  <span className="font-extrabold text-[#1c1b1b]">
                    {product.sellerDetails.responseRate}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToSupplierProfile?.(product.seller_id)}
                className="w-full py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-[#1c1b1b] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-[#b90064]" />
                View Full Supplier Business Profile
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Right Column: B2B Buying & Specification Overview (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 md:p-8 space-y-6">
              {/* Product Header */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#fde7f3] border border-[#f7c5e0] text-[#b90064] text-xs font-bold">
                    {product.category}
                  </span>
                  {product.subcategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium">
                      {product.subcategory}
                    </span>
                  )}
                  {product.isGstVerified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> GST Verified
                    </span>
                  )}
                  {product.isIsoCertified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" /> ISO Certified
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-black text-[#1c1b1b] leading-tight">
                  {product.title}
                </h1>
                <p className="text-sm text-[#594047] mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* B2B Price & Tier Block */}
              <div className="p-4 bg-[#fdf8f8] border border-[#f7c5e0]/60 rounded-xl space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-[#594047]">Wholesale B2B Price</span>
                    <p className="text-2xl font-black text-[#b90064]">
                      {product.priceRange}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-bold text-[#594047]">Min. Order Quantity (MOQ)</span>
                    <p className="text-base font-extrabold text-[#1c1b1b]">
                      {product.moq}
                    </p>
                  </div>
                </div>

                {/* Bulk Tiers Table */}
                {product.bulkTiers.length > 0 && (
                  <div className="pt-3 border-t border-[#f7c5e0]/60">
                    <span className="text-[11px] font-bold text-[#1c1b1b] uppercase tracking-wider block mb-2">
                      Volume Discount Tiers
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {product.bulkTiers.map((tier, idx) => (
                        <div key={idx} className="bg-white border border-[#e8e8e8] p-2.5 rounded-lg text-center">
                          <span className="text-[10px] text-gray-500 block">{tier.quantityRange}</span>
                          <span className="text-xs font-extrabold text-[#b90064]">{tier.unitPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversion CTAs */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onOpenEnquiryModal({ name: product.title, supplierName: product.supplierName })}
                    className="w-full py-3.5 px-3 rounded-xl bg-[#b90064] text-white font-extrabold text-xs sm:text-sm hover:bg-[#a00056] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Enquiry
                  </button>

                  <button
                    onClick={() => {
                      onOpenChat?.(
                        {
                          id: product.seller_id || 'sup-1',
                          name: product.supplierName,
                          location: product.supplierLocation || 'Mumbai, MH',
                          isVerified: true
                        },
                        {
                          title: product.title,
                          image: product.images[0],
                          price: product.priceRange,
                          moq: product.moq
                        }
                      );
                    }}
                    className="w-full py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    Live Chat
                  </button>

                  <button
                    onClick={onOpenRFQModal}
                    className="w-full py-3.5 px-3 rounded-xl bg-white border-2 border-[#b90064] text-[#b90064] font-extrabold text-xs sm:text-sm hover:bg-[#fde7f3] transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Get Quote
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {onNavigateToSampleRequest && (
                    <button
                      onClick={onNavigateToSampleRequest}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1c1b1b] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-[#b90064]" />
                      Order Lab Sample
                    </button>
                  )}

                  <button
                    onClick={() => onCallSupplier(product.supplierName, product.sellerDetails.phone)}
                    className="py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    Call Supplier
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(product.supplierName, product.sellerDetails.whatsapp)}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Specs & Information Tabs */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'specs'
                        ? 'border-[#b90064] text-[#b90064]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Technical Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab('formulation')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'formulation'
                        ? 'border-[#b90064] text-[#b90064]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Formulation Base
                  </button>
                  <button
                    onClick={() => setActiveTab('packaging')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'packaging'
                        ? 'border-[#b90064] text-[#b90064]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Packaging & Private Label
                  </button>
                  <button
                    onClick={() => setActiveTab('compliance')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activeTab === 'compliance'
                        ? 'border-[#b90064] text-[#b90064]'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Certifications & Compliance
                  </button>
                </div>

                <div className="text-xs space-y-3 pt-2">
                  {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Monthly Production Capacity</span>
                        <span className="font-extrabold text-[#1c1b1b]">{product.specs.productionCapacity || '100,000 Units'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Sample Lead Time</span>
                        <span className="font-extrabold text-[#1c1b1b]">{product.specs.sampleLeadTime || '1 - 3 Days'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Shelf Life</span>
                        <span className="font-extrabold text-[#1c1b1b]">{product.specs.shelfLife || '24 Months'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-400 block text-[10px]">Facility Area</span>
                        <span className="font-extrabold text-[#1c1b1b]">{product.sellerDetails.facilityArea}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'formulation' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[#b90064] font-bold">
                        <FlaskConical className="w-4 h-4" />
                        Active Ingredients & Base
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {product.specs.formulationBase || 'Standard OEM cosmeceutical grade formulation.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'packaging' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-[#b90064] font-bold">
                        <Package className="w-4 h-4" />
                        Packaging Options & Custom Branding
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {product.specs.packagingType || 'Standard bulk containers. Custom silk-screen printing and labeling available.'}
                      </p>
                    </div>
                  )}

                  {activeTab === 'compliance' && (
                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        Quality & Regulatory Standards
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {product.specs.certifications?.map((cert, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md font-semibold text-gray-800">
                            ✓ {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
