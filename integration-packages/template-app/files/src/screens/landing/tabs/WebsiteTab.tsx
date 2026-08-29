import { Sparkles, Check, ExternalLink, Users, RefreshCw, Smartphone, Monitor, ChevronRight, Laptop, Sliders, Palette, ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { SALON_NAME_COLORS, SALON_NAME_FONTS } from '../../../lib/brandIdentity';
import { BRAND_COLORS, TAGLINE_CATEGORIES, TAGLINE_SUBCATEGORIES } from '../../../lib/websiteCustomization';
import { OWNER_PHOTO_ACCEPT, OWNER_ROLES, getCustomOwnerRoleText, getOwnerRoleSelectValue, resolveOwnerRoleFromSelect } from '../../../lib/ownerProfile';
import TemplateRenderer from '../../../components/TemplateRenderer';
import TemplateSelectionDashboard from '../../../components/TemplateSelectionDashboard';
import OwnerAvatar from '../../../components/OwnerAvatar';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function WebsiteTab() {
  const { setActiveTab, data, setData, onOpenStaffManagement, onThemeChange, platform, mode, setMode, updateTagline, taglineOptions, taglineCategory, setTaglineCategory, taglineSubcategory, setTaglineSubcategory, handlePolishText, polishingField, polishingStatus, ownerPhotoInputRef, ownerPhotoError, ownerPhotoBusy, handleOwnerPhotoFile, handleRemoveOwnerPhoto, setShowLiveSiteModal } = useDashboard();
  return (
              <motion.div 
                key="website"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-7xl mx-auto"
              >
                {/* Header Banner */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#ffd9e1]/50 text-[#ac0053]">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Website Content Manager</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Fine-tune your brand's public narrative. Changes auto-save in real-time and update your active live website instantly.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Auto-Saving Active
                    </span>
                  </div>
                </div>

                {/* Template Selection Dashboard Component */}
                <TemplateSelectionDashboard data={data} setData={setData} onSave={(msg) => console.log(msg)} onThemeChange={onThemeChange} />

                {/* Left - Right Grid Split */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Form Controls (7 cols on xl) */}
                  <div className="xl:col-span-7 space-y-6">
                    
                    {/* CARD 1: Business Profile & About */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-3xs space-y-5">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#ac0053]" />
                          <h4 className="font-bold text-gray-900 text-sm">Business & About Info</h4>
                        </div>
                        <span className="text-[10px] bg-[#ffd9e1]/40 text-[#ac0053] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Public website sections</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Salon Name</label>
                          <input 
                            type="text" 
                            value={data.salonName}
                            onChange={(e) => setData(prev => ({ ...prev, salonName: e.target.value }))}
                            placeholder="Enter salon name"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/20"
                          />
                        </div>

                        {/* Brand Identity — Salon Name Font & Text Color */}
                        <div className="rounded-xl border border-[#ffd9e1]/60 bg-[#ffd9e1]/10 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-[#ac0053]" />
                            <h5 className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider">Salon Name Style</h5>
                            <span className="text-[9px] bg-[#ffd9e1]/40 text-[#ac0053] px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-auto">Live preview</span>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Font Style</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {SALON_NAME_FONTS.map(font => {
                                const isSelected = data.salonNameFont === font.id;
                                return (
                                  <button
                                    key={font.id}
                                    type="button"
                                    onClick={() => setData(prev => ({ ...prev, salonNameFont: font.id }))}
                                    className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                      isSelected ? 'border-[#ac0053] bg-[#ffd9e1]/20 shadow-xs' : 'border-gray-200 bg-white hover:border-[#ac0053]/40'
                                    }`}
                                  >
                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">{font.label}</span>
                                    <span className="block text-sm truncate text-gray-800" style={{ fontFamily: font.fontFamily, fontWeight: font.fontWeight, letterSpacing: font.letterSpacing, textTransform: font.textTransform }}>
                                      {(data.salonName || 'Royal Salon').slice(0, 20)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Text Color</label>
                            <div className="flex flex-wrap gap-2 items-center">
                              {SALON_NAME_COLORS.map(color => {
                                const isSelected = (data.salonNameColor || '') === color.value;
                                return (
                                  <button
                                    key={color.value}
                                    type="button"
                                    title={color.label}
                                    aria-label={`Select ${color.label} salon name color`}
                                    onClick={() => setData(prev => ({ ...prev, salonNameColor: color.value }))}
                                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${isSelected ? 'ring-2 ring-offset-2 ring-[#ffb1c4] border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                  />
                                );
                              })}
                              <span className="text-[10px] font-semibold text-gray-400">
                                {SALON_NAME_COLORS.find(c => c.value === data.salonNameColor)?.label || 'Theme default'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Brand Color</label>
                            <div className="flex flex-wrap gap-2 items-center">
                              {BRAND_COLORS.map(color => {
                                const isSelected = (data.brandColor || '#ac0053') === color.value;
                                return (
                                  <button
                                    key={color.value}
                                    type="button"
                                    title={color.name}
                                    aria-label={`Select ${color.name} brand color`}
                                    onClick={() => setData(prev => ({ ...prev, brandColor: color.value }))}
                                    className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${isSelected ? 'ring-2 ring-offset-2 ring-[#ffb1c4] border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                  />
                                );
                              })}
                              <span className="text-[10px] font-semibold text-gray-400">
                                {BRAND_COLORS.find(c => c.value === data.brandColor)?.name || `${platform.name} Pink`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tagline / Hero Headline</label>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={taglineCategory}
                                onChange={e => {
                                  const next = e.target.value;
                                  setTaglineCategory(next);
                                  setTaglineSubcategory(TAGLINE_SUBCATEGORIES[next][0]);
                                }}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                              >
                                {Object.keys(TAGLINE_CATEGORIES).map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                              <select
                                value={taglineSubcategory}
                                onChange={e => setTaglineSubcategory(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                              >
                                {TAGLINE_SUBCATEGORIES[taglineCategory].map(subcategory => (
                                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              {taglineOptions.map(option => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => updateTagline(option)}
                                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                                    data.tagline === option
                                      ? 'border-[#ac0053] bg-[#ffd9e1]/30 text-[#ac0053] font-bold'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#ac0053]'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            <input 
                              type="text" 
                              value={data.tagline}
                              onChange={(e) => updateTagline(e.target.value)}
                              placeholder="Or write your own tagline"
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                            />
                            
                            {/* Tagline AI Polish bar */}
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 shrink-0"><Sparkles className="w-3.5 h-3.5 text-[#ac0053]" /> AI Tagline Polish:</span>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('tagline', 'luxury')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                👑 Luxury Tone
                              </button>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('tagline', 'modern')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                ⚡ Bold Modern
                              </button>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('tagline', 'warm')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                🌸 Warm & Cozy
                              </button>
                            </div>
                            
                            {/* Progress Feedback */}
                            {polishingField === 'tagline' && (
                              <div className="text-[10px] font-bold text-[#ac0053] flex items-center gap-2 px-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                {polishingStatus}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">About Salon Description</label>
                          <div className="space-y-2">
                            <textarea 
                              rows={4}
                              value={data.about}
                              onChange={(e) => setData(prev => ({ ...prev, about: e.target.value }))}
                              placeholder="Write a brief overview of what makes your salon exceptional..."
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] resize-none"
                            />

                            {/* About AI Polish bar */}
                            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 shrink-0"><Sparkles className="w-3.5 h-3.5 text-[#ac0053]" /> AI About Polish:</span>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('about', 'luxury')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                👑 Luxury Tone
                              </button>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('about', 'modern')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                ⚡ Bold Modern
                              </button>
                              <button 
                                type="button"
                                onClick={() => handlePolishText('about', 'warm')}
                                className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                              >
                                🌸 Warm & Cozy
                              </button>
                            </div>

                            {/* Progress Feedback */}
                            {polishingField === 'about' && (
                              <div className="text-[10px] font-bold text-[#ac0053] flex items-center gap-2 px-1">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                {polishingStatus}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: Owner/Founder Profile */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-3xs space-y-5">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#ac0053]" />
                          <h4 className="font-bold text-gray-900 text-sm">Owner & Founder Profile</h4>
                        </div>
                        <span className="text-[10px] bg-[#ffd9e1]/40 text-[#ac0053] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Dynamic signature banner</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Owner Photo <span className="text-gray-400 font-normal normal-case tracking-normal">(Optional)</span></label>
                        <input
                          ref={ownerPhotoInputRef}
                          type="file"
                          accept={OWNER_PHOTO_ACCEPT}
                          className="hidden"
                          onChange={e => handleOwnerPhotoFile(e.target.files?.[0])}
                        />
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ffd9e1] shrink-0 bg-gray-50">
                            <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-lg" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => ownerPhotoInputRef.current?.click()}
                                disabled={ownerPhotoBusy}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-700 hover:border-[#ac0053] hover:text-[#ac0053] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                              >
                                <ImagePlus className="w-3.5 h-3.5" />
                                {ownerPhotoBusy ? 'Uploading…' : data.ownerPhotoUrl ? 'Change Photo' : 'Add Photo'}
                              </button>
                              {data.ownerPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={handleRemoveOwnerPhoto}
                                  disabled={ownerPhotoBusy}
                                  className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">JPG, PNG, WEBP or GIF · max 2MB</p>
                            {ownerPhotoError && (
                              <p className="text-[11px] text-red-600 font-semibold mt-1">{ownerPhotoError}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Owner / Founder Name</label>
                          <input 
                            type="text" 
                            value={data.ownerName}
                            onChange={(e) => setData(prev => ({ ...prev, ownerName: e.target.value }))}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Professional Role <span className="text-gray-400 font-normal normal-case tracking-normal">(Optional)</span></label>
                          <select
                            value={getOwnerRoleSelectValue(data.ownerRole)}
                            onChange={(e) => setData(prev => ({ ...prev, ownerRole: resolveOwnerRoleFromSelect(e.target.value, prev.ownerRole) }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                          >
                            <option value="">Select role</option>
                            {OWNER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          {getOwnerRoleSelectValue(data.ownerRole) === 'Other' && (
                            <input
                              type="text"
                              value={getCustomOwnerRoleText(data.ownerRole)}
                              onChange={(e) => setData(prev => ({ ...prev, ownerRole: e.target.value.trim() ? e.target.value : 'Other' }))}
                              placeholder="Enter your role"
                              className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Owner Personal Message / Biography</label>
                        <div className="space-y-2">
                          <textarea 
                            rows={3}
                            value={data.reviewedContent?.ownerIntro || ""}
                            onChange={(e) => setData(prev => ({ 
                              ...prev, 
                              reviewedContent: { 
                                ...(prev.reviewedContent || { heroHeadline: "", tagline: "", about: "", serviceDescriptions: {}, bookingCTA: "" }), 
                                ownerIntro: e.target.value 
                              } 
                            }))}
                            placeholder="e.g. We believe in personalized artistry and exceptional client care..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] resize-none"
                          />

                          {/* Owner Bio AI Polish bar */}
                          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 shrink-0"><Sparkles className="w-3.5 h-3.5 text-[#ac0053]" /> AI Bio Enhancer:</span>
                            <button 
                              type="button"
                              onClick={() => handlePolishText('bio', 'luxury')}
                              className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                            >
                              👑 Luxury Tone
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePolishText('bio', 'modern')}
                              className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                            >
                              ⚡ Bold Modern
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePolishText('bio', 'warm')}
                              className="text-[9px] font-bold bg-white border border-gray-200 text-gray-700 hover:text-[#ac0053] px-2 py-1 rounded-lg hover:border-[#ffd9e1] transition-all cursor-pointer"
                            >
                              🌸 Warm & Cozy
                            </button>
                          </div>

                          {/* Progress Feedback */}
                          {polishingField === 'bio' && (
                            <div className="text-[10px] font-bold text-[#ac0053] flex items-center gap-2 px-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              {polishingStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: Photos & Gallery presets */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-3xs space-y-5">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-[#ac0053]" />
                          <h4 className="font-bold text-gray-900 text-sm">Photos & Appearance Settings</h4>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Custom Hero Cover URL */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hero Cover Image URL</label>
                          <input 
                            type="text" 
                            value={data.heroImageUrl}
                            onChange={(e) => setData(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 focus:border-[#ac0053]"
                          />
                        </div>

                        {/* Interactive presets display */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Hero Preset Theme Photo</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              {
                                title: 'Elegant Salon',
                                url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=1000&auto=format&fit=crop',
                              },
                              {
                                title: 'Modern Barber',
                                url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop',
                              },
                              {
                                title: 'Luxury Chic',
                                url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
                              },
                              {
                                title: 'Warm Sanctuary',
                                url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop',
                              }
                            ].map((preset, idx) => {
                              const isSelected = data.heroImageUrl === preset.url;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setData(prev => ({ ...prev, heroImageUrl: preset.url }))}
                                  className={`relative aspect-video rounded-xl overflow-hidden border-2 text-left transition-all group ${
                                    isSelected ? 'border-[#ac0053] shadow-md scale-102' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <img 
                                    src={preset.url} 
                                    alt={preset.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/45 flex items-end p-1.5">
                                    <span className="text-[9px] font-extrabold text-white truncate w-full">{preset.title}</span>
                                  </div>
                                  {isSelected && (
                                    <span className="absolute top-1.5 right-1.5 bg-[#ac0053] text-white p-0.5 rounded-full shadow">
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Position and Appearance */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cover Image Alignment</label>
                            <select
                              value={data.heroPosition || 'Center'}
                              onChange={(e) => setData(prev => ({ ...prev, heroPosition: e.target.value as any }))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                            >
                              <option value="Top">Top aligned</option>
                              <option value="Center">Center aligned</option>
                              <option value="Bottom">Bottom aligned</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Brand Logo URL</label>
                            <input 
                              type="text" 
                              value={data.logoUrl || ''}
                              onChange={(e) => setData(prev => ({ ...prev, logoUrl: e.target.value }))}
                              placeholder="e.g. Leave blank for default icon"
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shortcut Buttons Card */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
                      <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Other Design Shortcuts</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button 
                          type="button"
                          onClick={() => setActiveTab('services')}
                          className="px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-left hover:shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800">Edit Services Menu</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{data.services.length} active treatments</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={onOpenStaffManagement}
                          className="px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-left hover:shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800">Manage Staff Team</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{data.team.length} specialists syncd</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>

                        <button 
                          type="button"
                          onClick={() => setActiveTab('settings')}
                          className="px-4 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-left hover:shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-800">Booking & Pay Rules</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{25}% advance deposit</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Dynamic Live Preview Sticky Sandbox (5 cols on xl) */}
                  <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Live Sandbox Preview</h4>
                      </div>

                      <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setMode('desktop')}
                          className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                            mode === 'desktop' ? 'bg-white text-gray-950 shadow-3xs' : 'text-gray-400'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('mobile')}
                          className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                            mode === 'mobile' ? 'bg-white text-gray-950 shadow-3xs' : 'text-gray-400'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                      </div>
                    </div>

                    {/* Actual iframe/rendering sandbox box */}
                    <div className="bg-gray-100 rounded-3xl p-3 border border-gray-200/80 shadow-lg relative overflow-hidden flex justify-center items-center" style={{ minHeight: '620px' }}>
                      <div className="w-full h-[600px] rounded-2xl overflow-hidden relative border border-gray-200/60 shadow-inner">
                        <TemplateRenderer data={data} mode={mode} />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs text-center">
                      <button 
                        type="button"
                        onClick={() => setShowLiveSiteModal(true)}
                        className="text-xs font-bold text-[#ac0053] hover:text-[#ba005b] inline-flex items-center gap-1 bg-[#ffd9e1]/40 hover:bg-[#ffd9e1]/60 px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Fullscreen Interactive Mode
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
  );
}
