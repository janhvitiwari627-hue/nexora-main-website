import { Sparkles, X, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { Package } from '../../../types';
import { useDashboard } from '../DashboardContext';

/** DRAWER: PACKAGE SLIDE-OUT FROM RIGHT — extracted verbatim from the Landing monolith. */
export default function PackageDrawerModal() {
  const { editingPackage, setShowPackageDrawer, isImprovingWithAI, newPackageName, setNewPackageName, newPackagePrice, setNewPackagePrice, newPackageDuration, setNewPackageDuration, newPackageDesc, setNewPackageDesc, handleSavePackage, handleImprovePackageDescWithAI } = useDashboard();
  return (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPackageDrawer(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white border-l border-gray-100 flex flex-col shadow-2xl relative"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">{editingPackage ? 'Edit Package Combo' : 'Create Package Combo'}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Bundle multiple treatments for a dynamic discount</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPackageDrawer(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSavePackage} className="flex-grow overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Package Combo Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newPackageName}
                      onChange={e => setNewPackageName(e.target.value)}
                      placeholder="e.g. Bridal Glow & Styling Bundle"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Total Duration (mins)</label>
                      <input 
                        type="number" 
                        required
                        value={newPackageDuration}
                        onChange={e => setNewPackageDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Combo Fee (INR ₹) *</label>
                      <input 
                        type="number" 
                        required
                        value={newPackagePrice}
                        onChange={e => setNewPackagePrice(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-extrabold text-gray-900 focus:border-[#ac0053]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Package Items / Details</label>
                      <button
                        type="button"
                        disabled={isImprovingWithAI || !newPackageName}
                        onClick={handleImprovePackageDescWithAI}
                        className="text-[10px] font-bold text-[#ac0053] hover:text-[#ba005b] flex items-center gap-1 bg-[#ffd9e1]/25 hover:bg-[#ffd9e1]/50 px-2 py-0.5 rounded-md border border-[#ffd9e1]/40 disabled:opacity-55"
                      >
                        <Sparkles className="w-3 h-3 text-[#ac0053]" />
                        {isImprovingWithAI ? 'AI Designing...' : 'Gemini Combo Draft'}
                      </button>
                    </div>
                    <textarea 
                      value={newPackageDesc}
                      onChange={e => setNewPackageDesc(e.target.value)}
                      placeholder="e.g. Includes Global Hair Color, Precision Haircut, Hydra Facial & Scalp Massage..."
                      rows={5}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none resize-none"
                    />
                  </div>

                  {/* Calculations Info Box */}
                  <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                    <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" /> High-Value Bundling Strategy
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Combo pricing allows salon operators to capture higher cart volumes. We recommend packaging popular services with a <strong className="text-gray-800">15-20% discount</strong> compared to standalone prices.
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-6 border-t border-gray-100 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowPackageDrawer(false)}
                      className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="w-2/3 bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl active:scale-98 transition-all"
                    >
                      {editingPackage ? 'Save Package Updates' : 'Add Package to Catalog'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
  );
}
