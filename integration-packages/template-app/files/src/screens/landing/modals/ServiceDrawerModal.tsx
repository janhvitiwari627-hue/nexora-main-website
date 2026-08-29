import { Sparkles, AlertCircle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Service } from '../../../types';
import { useDashboard } from '../DashboardContext';

/** DRAWER: SERVICE SLIDE-OUT FROM RIGHT — extracted verbatim from the Landing monolith. */
export default function ServiceDrawerModal() {
  const { editingService, setShowServiceDrawer, isImprovingWithAI, newServiceName, setNewServiceName, newServiceCategory, setNewServiceCategory, newServicePrice, setNewServicePrice, newServiceDuration, setNewServiceDuration, newServiceDesc, setNewServiceDesc, newServiceFeatured, setNewServiceFeatured, handleSaveService, handleImproveDescriptionWithAI } = useDashboard();
  return (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowServiceDrawer(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            {/* Slide out Panel */}
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
                    <h3 className="font-extrabold text-gray-900 text-sm">{editingService ? 'Edit Service Details' : 'Add Treatment Catalog'}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Customize service pricing, timing and tags</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowServiceDrawer(false)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSaveService} className="flex-grow overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Name *</label>
                    <input 
                      type="text" 
                      required
                      value={newServiceName}
                      onChange={e => setNewServiceName(e.target.value)}
                      placeholder="e.g. Balayage & Hair Spa Combo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                      <select 
                        value={newServiceCategory}
                        onChange={e => setNewServiceCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none focus:border-[#ac0053]"
                      >
                        <option value="Haircut">Haircut</option>
                        <option value="Hair Styling">Hair Styling</option>
                        <option value="Treatment">Treatment</option>
                        <option value="Hair Coloring">Hair Coloring</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Wellness">Wellness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Duration (mins)</label>
                      <input 
                        type="number" 
                        required
                        value={newServiceDuration}
                        onChange={e => setNewServiceDuration(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Treatment Fee (INR ₹) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-400 text-xs font-bold">₹</span>
                      <input 
                        type="number" 
                        required
                        value={newServicePrice}
                        onChange={e => setNewServicePrice(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-extrabold text-gray-900 focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Service Description</label>
                      <button
                        type="button"
                        disabled={isImprovingWithAI || !newServiceName}
                        onClick={handleImproveDescriptionWithAI}
                        className="text-[10px] font-bold text-[#ac0053] hover:text-[#ba005b] flex items-center gap-1 bg-[#ffd9e1]/25 hover:bg-[#ffd9e1]/50 px-2 py-0.5 rounded-md border border-[#ffd9e1]/40 disabled:opacity-55"
                      >
                        <Sparkles className="w-3 h-3 text-[#ac0053]" />
                        {isImprovingWithAI ? 'AI Improving...' : 'Gemini Auto-Draft'}
                      </button>
                    </div>
                    <textarea 
                      value={newServiceDesc}
                      onChange={e => setNewServiceDesc(e.target.value)}
                      placeholder="e.g. Clarifying hair wash with deep nourishing mask..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] focus:ring-1 focus:ring-[#ac0053]/15 outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-150">
                    <input 
                      type="checkbox"
                      id="drawerFeatured"
                      checked={newServiceFeatured}
                      onChange={e => setNewServiceFeatured(e.target.checked)}
                      className="rounded border-gray-300 text-[#ac0053] focus:ring-[#ac0053] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="drawerFeatured" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      Star feature this treatment on website banner
                    </label>
                  </div>

                  {/* Calculations Info Box */}
                  <div className="p-3.5 bg-[#ffd9e1]/10 rounded-xl border border-[#ffd9e1]/30 space-y-1">
                    <p className="text-[10px] font-extrabold text-[#ac0053] uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> ONLINE CLIENT CALCULATOR (25% DEPOSIT)
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      Clients pay an online booking deposit of <strong className="text-gray-800">₹{Math.round((newServicePrice || 0) * 0.25)}</strong> at checkout. Remaining <strong className="text-gray-800">₹{Math.round((newServicePrice || 0) * 0.75)}</strong> collected in-salon.
                    </p>
                  </div>

                  {/* Footer Buttons */}
                  <div className="pt-6 border-t border-gray-100 flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowServiceDrawer(false)}
                      className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="w-2/3 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-[#ac0053]/15 active:scale-98 transition-all"
                    >
                      {editingService ? 'Save Service Updates' : 'Add to Treatment Catalog'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
  );
}
