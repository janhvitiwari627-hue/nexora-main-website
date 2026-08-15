import React, { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle2, AlertCircle, Image as ImageIcon, Camera } from 'lucide-react';
import { GalleryItem, MediaType, SalonTheme } from '../types/gallery';
import { MOCK_LINKED_SERVICES, SALON_THEMES_INFO } from '../data/galleryData';

interface UploadGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSubmit: (newItem: GalleryItem) => void;
  defaultTheme?: SalonTheme;
}

export const UploadGalleryModal: React.FC<UploadGalleryModalProps> = ({
  isOpen,
  onClose,
  onUploadSubmit,
  defaultTheme = 'hair_studio'
}) => {
  const [theme, setTheme] = useState<SalonTheme>(defaultTheme);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [beforeImageUrl, setBeforeImageUrl] = useState('');
  const [afterImageUrl, setAfterImageUrl] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [uploaderName, setUploaderName] = useState('Alexandre Stylist');
  const [uploaderRole, setUploaderRole] = useState<'staff' | 'customer'>('staff');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');

  if (!isOpen) return null;

  // Services available for the selected theme
  const themeServices = MOCK_LINKED_SERVICES.filter(s => s.theme === theme);
  const selectedService = themeServices.find(s => s.id === selectedServiceId) || themeServices[0];

  // Default sample image helpers
  const sampleImages = {
    barber: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800',
    hair_studio: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800',
    beauty_spa: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
    family: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800',
    nail_lash: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800'
  };

  // Image processing & compression utility (<5MB, HD resize, frame-fitting)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isBefore = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File is too large. Please upload an image under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1400; // Optimal HD dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress and maintain HD quality (<5MB guarantee)
          let quality = 0.90;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Ensure under 5MB base64 size check
          while (dataUrl.length > 5 * 1024 * 1024 && quality > 0.4) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          if (isBefore) {
            setBeforeImageUrl(dataUrl);
          } else {
            setImageUrl(dataUrl);
            if (mediaType === 'before_after') {
              setAfterImageUrl(dataUrl);
            }
          }
          setUploadNotice('✨ Photo auto-resized, converted to HD, compressed (<5MB), & frame-fitted!');
          setTimeout(() => setUploadNotice(''), 5000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a transformation title.');
      return;
    }

    if (mediaType === 'image' && !imageUrl.trim()) {
      setErrorMsg('Please provide an image URL or upload/use a sample photo.');
      return;
    }

    if (mediaType === 'before_after' && (!beforeImageUrl.trim() || !afterImageUrl.trim())) {
      setErrorMsg('Please provide both Before and After images for comparison.');
      return;
    }

    const linkedSrv = selectedService || {
      id: `srv-${theme}-default`,
      name: `Signature ${SALON_THEMES_INFO[theme].name} Treatment`,
      theme: theme,
      category: SALON_THEMES_INFO[theme].categories[0],
      price: 95
    };

    const newItem: GalleryItem = {
      id: `gal-new-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Professional salon transformation.',
      theme,
      category: linkedSrv.category,
      linkedServiceId: linkedSrv.id,
      linkedServiceName: linkedSrv.name,
      linkedServiceTheme: linkedSrv.theme,
      salonId: 'salon-101',
      salonName: 'Maison de Luxe Salon Group',
      mediaType,
      imageUrl: mediaType === 'image' ? (imageUrl.trim() || sampleImages[theme]) : (afterImageUrl.trim() || sampleImages[theme]),
      beforeImageUrl: mediaType === 'before_after' ? beforeImageUrl.trim() : undefined,
      afterImageUrl: mediaType === 'before_after' ? afterImageUrl.trim() : undefined,
      uploadedBy: {
        id: `usr-${Date.now()}`,
        name: uploaderName.trim() || 'Staff Member',
        role: uploaderRole
      },
      uploadedAt: new Date().toISOString(),
      status: 'pending', // Starts as pending moderation!
      likesCount: 0
    };

    onUploadSubmit(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0E6EC] relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E6EC]">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] border border-[#FFD1E3] flex items-center justify-center text-[#B8005A]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1E1E1E]">Submit Gallery Media</h3>
              <p className="text-xs text-[#737373]">Submitted media requires Owner/Admin approval before going live.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#1E1E1E] hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="mt-4 p-3 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
          <p className="text-xs text-[#9A3412]">
            <strong className="font-bold">Auto-Compression & Frame-Fixing:</strong> Uploaded photos are automatically resized to HD, compressed (&lt;5MB), and frame-fitted for the salon aesthetic. All submissions enter <span className="underline font-semibold">Pending Status</span> for moderation.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {uploadNotice && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1.5">
              Target Salon Theme *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(SALON_THEMES_INFO) as SalonTheme[]).map((tKey) => {
                const info = SALON_THEMES_INFO[tKey];
                const isSelected = theme === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => {
                      setTheme(tKey);
                      setSelectedServiceId('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#B8005A] bg-[#FFF0F5] text-[#B8005A] shadow-xs'
                        : 'border-[#EDEDED] bg-white text-[#4A4A4A] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{info.name}</span>
                    <span className="text-[10px] opacity-75 truncate">{info.categories[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                Transformation Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Honey Balayage & Gloss"
                className="w-full px-3 py-2 text-xs font-medium border border-[#EDEDED] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                Linked Salon Service *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium border border-[#EDEDED] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] focus:bg-white transition-all"
              >
                {themeServices.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name} (${srv.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
              Description / Technique Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail products, formulas, or styling techniques used..."
              rows={2}
              className="w-full px-3 py-2 text-xs font-medium border border-[#EDEDED] rounded-xl focus:outline-none focus:border-[#B8005A] bg-[#FAFAFA] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Media Format & Upload */}
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1E1E]">Media Format & Upload</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    mediaType === 'image'
                      ? 'bg-[#B8005A] text-white shadow-xs'
                      : 'bg-white text-[#737373] border border-[#E5E7EB]'
                  }`}
                >
                  Single Photo
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('before_after')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    mediaType === 'before_after'
                      ? 'bg-[#B8005A] text-white shadow-xs'
                      : 'bg-white text-[#737373] border border-[#E5E7EB]'
                  }`}
                >
                  Before & After Pair
                </button>
              </div>
            </div>

            {mediaType === 'image' ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#737373]">
                  Upload Photo (Auto HD resize, &lt;5MB compression, & frame fit) or Paste URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or upload photo ->"
                    className="flex-1 px-3 py-2 text-xs border border-[#EDEDED] rounded-xl focus:outline-none focus:border-[#B8005A] bg-white"
                  />
                  <label className="cursor-pointer px-4 py-2 bg-[#FFF0F5] hover:bg-[#FFE0EC] text-[#B8005A] font-bold rounded-xl border border-[#FFD1E3] flex items-center gap-1.5 shrink-0 transition-colors text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageFileChange(e, false)} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageUrl(sampleImages[theme])}
                    className="px-3 py-2 bg-white text-[#737373] border border-[#EDEDED] rounded-xl text-xs font-medium hover:bg-[#F5F5F5]"
                  >
                    Sample
                  </button>
                </div>
                {imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#EDEDED] bg-black/5 flex items-center justify-center group">
                    <img src={imageUrl} alt="Frame Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Camera className="w-4 h-4 text-[#FFD700]" /> HD Frame Fitted (&lt;5MB)
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#737373]">
                    Before Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={beforeImageUrl}
                      onChange={(e) => setBeforeImageUrl(e.target.value)}
                      placeholder="Before image..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-[#EDEDED] rounded-xl bg-white"
                    />
                    <label className="cursor-pointer px-3 py-1.5 bg-[#FFF0F5] text-[#B8005A] font-bold rounded-xl border border-[#FFD1E3] flex items-center gap-1 text-[11px]">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageFileChange(e, true)} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {beforeImageUrl && (
                    <div className="h-20 rounded-lg overflow-hidden border border-[#EDEDED]">
                      <img src={beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#737373]">
                    After Image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={afterImageUrl}
                      onChange={(e) => setAfterImageUrl(e.target.value)}
                      placeholder="After image..."
                      className="flex-1 px-2.5 py-1.5 text-xs border border-[#EDEDED] rounded-xl bg-white"
                    />
                    <label className="cursor-pointer px-3 py-1.5 bg-[#FFF0F5] text-[#B8005A] font-bold rounded-xl border border-[#FFD1E3] flex items-center gap-1 text-[11px]">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageFileChange(e, false)} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {afterImageUrl && (
                    <div className="h-20 rounded-lg overflow-hidden border border-[#EDEDED]">
                      <img src={afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Uploader Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F0E6EC]">
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                Submitter Name
              </label>
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="e.g. Alexandre Stylist"
                className="w-full px-3 py-2 text-xs font-medium border border-[#EDEDED] rounded-xl bg-[#FAFAFA]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A4A4A] uppercase tracking-wider mb-1">
                Submitter Role
              </label>
              <select
                value={uploaderRole}
                onChange={(e) => setUploaderRole(e.target.value as 'staff' | 'customer')}
                className="w-full px-3 py-2 text-xs font-medium border border-[#EDEDED] rounded-xl bg-[#FAFAFA]"
              >
                <option value="staff">Salon Staff / Stylist</option>
                <option value="customer">Verified Customer</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0E6EC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#EDEDED] text-[#4A4A4A] text-xs font-bold rounded-xl hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#B8005A] hover:bg-[#A0004E] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit for Moderation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
