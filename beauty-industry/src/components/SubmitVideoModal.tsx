import React, { useState } from 'react';
import {
  X,
  Video,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Tag,
  Star,
  Film
} from 'lucide-react';
import { SupplierPartner, Product, VideoTestimonial } from '../types';

interface SubmitVideoModalProps {
  isOpen: boolean;
  distributors: SupplierPartner[];
  products: Product[];
  onClose: () => void;
  onSubmit: (newVideo: VideoTestimonial) => void;
}

export const SubmitVideoModal: React.FC<SubmitVideoModalProps> = ({
  isOpen,
  distributors,
  products,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [selectedDistributorId, setSelectedDistributorId] = useState(distributors[0]?.id || '');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState('Master Stylist & Salon Director');
  const [salonOrBusiness, setSalonOrBusiness] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [category, setCategory] = useState('Haircare & Tools');
  const [keyHighlight, setKeyHighlight] = useState('');
  const [quote, setQuote] = useState('');
  const [duration, setDuration] = useState('02:15');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const currentDistributor = distributors.find((d) => d.id === selectedDistributorId) || distributors[0];
  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!speakerName.trim()) newErrors.speakerName = 'Speaker name is required';
    if (!salonOrBusiness.trim()) newErrors.salonOrBusiness = 'Salon or facility name is required';
    if (!keyHighlight.trim()) newErrors.keyHighlight = 'Key highlight / performance metric is required';
    if (!quote.trim()) newErrors.quote = 'Commercial quote is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newVideo: VideoTestimonial = {
      id: `vid-${Date.now()}`,
      title: title.trim(),
      distributorId: currentDistributor.id,
      distributorName: currentDistributor.name,
      distributorLocation: currentDistributor.location,
      distributorInitials: currentDistributor.initials,
      distributorVerified: currentDistributor.verified,
      speakerName: speakerName.trim(),
      speakerRole: speakerRole.trim(),
      salonOrBusiness: salonOrBusiness.trim(),
      thumbnail: thumbnailUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
      videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: duration || '02:00',
      viewsCount: 1,
      likesCount: 1,
      rating: 5.0,
      featuredProductId: currentProduct?.id,
      featuredProductName: currentProduct?.name,
      featuredProductImage: currentProduct?.image,
      featuredProductPrice: currentProduct?.price,
      featuredProductMoq: currentProduct?.moq,
      category: category,
      tags: ['Verified Demonstration', 'Salon Backbar Tested'],
      keyHighlight: keyHighlight.trim(),
      quote: quote.trim(),
      date: 'Just now'
    };

    onSubmit(newVideo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-[#EAE5DE] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#FFF5F8] to-white border-b border-[#F5F2EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] border border-[#FFD6E5] text-[#B8005A] flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                Submit Distributor Video Showcase
              </h2>
              <p className="text-xs text-[#737373]">
                Showcase backbar demonstrations, formula breakdowns & salon endorsements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#737373] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Distributor Selection */}
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1.5">
              Verified Distributor / Lab Entity *
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
            >
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.location}) • {d.verified ? 'Verified Partner' : 'Registered Partner'}
                </option>
              ))}
            </select>
          </div>

          {/* Video Title */}
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1.5">
              Video Title / Showcase Headline *
            </label>
            <input
              type="text"
              placeholder="e.g. Ionic Salon Dryer X2 Backbar Stress Test & Cuticle Scan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-[#FCFCFA] border ${
                errors.title ? 'border-red-400' : 'border-[#EAE5DE]'
              } rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]`}
            />
            {errors.title && <p className="text-red-500 text-[11px] mt-1">{errors.title}</p>}
          </div>

          {/* Speaker Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Speaker / Demonstrator Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Jean-Luc Moreau"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                className={`w-full bg-[#FCFCFA] border ${
                  errors.speakerName ? 'border-red-400' : 'border-[#EAE5DE]'
                } rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]`}
              />
              {errors.speakerName && <p className="text-red-500 text-[11px] mt-1">{errors.speakerName}</p>}
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Master Stylist & Salon Director"
                value={speakerRole}
                onChange={(e) => setSpeakerRole(e.target.value)}
                className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
              />
            </div>
          </div>

          {/* Salon / Facility Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Salon / Clinic / Facility Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Glamour Lounge Mumbai"
                value={salonOrBusiness}
                onChange={(e) => setSalonOrBusiness(e.target.value)}
                className={`w-full bg-[#FCFCFA] border ${
                  errors.salonOrBusiness ? 'border-red-400' : 'border-[#EAE5DE]'
                } rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]`}
              />
              {errors.salonOrBusiness && <p className="text-red-500 text-[11px] mt-1">{errors.salonOrBusiness}</p>}
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
              >
                <option value="Haircare & Tools">Haircare & Tools</option>
                <option value="Skincare">Skincare</option>
                <option value="Spa & Wellness">Spa & Wellness</option>
                <option value="Salon Tools & Eq.">Salon Tools & Eq.</option>
                <option value="Hair Color">Hair Color</option>
              </select>
            </div>
          </div>

          {/* Tagged Featured Product */}
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1.5">
              Tagged Wholesale Product from Line Sheet
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} • ₹{p.price.toLocaleString('en-IN')} (MOQ: {p.moq})
                </option>
              ))}
            </select>
          </div>

          {/* Key Highlight Metric */}
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1.5">
              Key Performance Metric / Commercial Highlight *
            </label>
            <input
              type="text"
              placeholder="e.g. Cuts blowout service turnaround by 45% while preserving cuticle moisture"
              value={keyHighlight}
              onChange={(e) => setKeyHighlight(e.target.value)}
              className={`w-full bg-[#FCFCFA] border ${
                errors.keyHighlight ? 'border-red-400' : 'border-[#EAE5DE]'
              } rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]`}
            />
            {errors.keyHighlight && <p className="text-red-500 text-[11px] mt-1">{errors.keyHighlight}</p>}
          </div>

          {/* Quote / Salon Takeaway */}
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1.5">
              Salon Testimonial / Formulation Quote *
            </label>
            <textarea
              rows={3}
              placeholder="Describe real in-cabin results, client retention feedback, or formulation stability..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className={`w-full bg-[#FCFCFA] border ${
                errors.quote ? 'border-red-400' : 'border-[#EAE5DE]'
              } rounded-xl p-3 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]`}
            />
            {errors.quote && <p className="text-red-500 text-[11px] mt-1">{errors.quote}</p>}
          </div>

          {/* Video Duration & Thumbnail Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Video Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="02:15"
                className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1A1A1A] mb-1.5">
                Video Stream URL (MP4 / WebM)
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#FCFCFA] border border-[#EAE5DE] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#B8005A]"
              />
            </div>
          </div>

          {/* Notice banner */}
          <div className="bg-[#FFF5F8] border border-[#FFD6E5] rounded-xl p-3 flex items-start gap-2.5 text-[#8E0045]">
            <ShieldCheck className="w-4 h-4 text-[#B8005A] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Videos submitted by Nexora Verified Distributors receive automatic high-priority placement and a verified badge across directory line sheets.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-[#F5F2EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#EAE5DE] text-[#525252] hover:bg-[#FAFAFA] font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#B8005A] hover:bg-[#960049] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Video Highlight</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
