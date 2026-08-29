import { Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboard } from '../DashboardContext';

/** MODAL: AI SUGGEST IDEAS WIZARD — extracted verbatim from the Landing monolith. */
export default function AiSuggestModal() {
  const { setShowAiSuggestModal, aiSuggestArchetype, setAiSuggestArchetype, isGeneratingSuggestions, generatedSuggestions, setGeneratedSuggestions, selectedSuggestionIds, setSelectedSuggestionIds, handleTriggerSuggestions, handleAddSuggestionsToCatalog } = useDashboard();
  return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => {
                  setShowAiSuggestModal(false);
                  setGeneratedSuggestions([]);
                  setSelectedSuggestionIds([]);
                }}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                    <Sparkles className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">AI Treatment Suggestion Engine</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">Generate high-converting treatments optimized for your specific archetype</p>
                  </div>
                </div>

                {generatedSuggestions.length === 0 ? (
                  /* STEP 1: Select Archetype & Generate */
                  <div className="space-y-5">
                    {isGeneratingSuggestions ? (
                      /* Live loading steps */
                      <div className="py-12 text-center space-y-4">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900 animate-pulse">🤖 Consulting Gemini AI Engine...</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Calculating optimal treatment price metrics</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Select Salon Archetype Idea Kit</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'luxury', title: 'Luxury Chic', icon: '👑', desc: 'Premium colors, high price hair sculptures, complex glazes.' },
                            { id: 'barber', title: 'Barber Shop', icon: '💈', desc: 'Detail beard trims, razor lineups, facial packs, tonics.' },
                            { id: 'spa', title: 'Wellness Spa', icon: '🌸', desc: 'Aromatherapy body massages, salt scrubs, skincare.' },
                            { id: 'beauty', title: 'Nail & Beauty', icon: '💅', desc: 'Gel manicures, acrylic overlays, maps, brow mappings.' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setAiSuggestArchetype(item.id as any)}
                              className={`p-4 rounded-xl border text-left transition-all ${
                                aiSuggestArchetype === item.id 
                                  ? 'border-amber-400 bg-amber-50/20 shadow-2xs' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{item.icon}</span>
                                <span className="text-xs font-bold text-gray-900">{item.title}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-relaxed">{item.desc}</p>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerSuggestions(aiSuggestArchetype)}
                          className="w-full mt-2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl transition-all shadow"
                        >
                          Generate AI Catalog Ideas
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* STEP 2: Selection Catalog Matrix */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                      <span>Select treatments to import into your catalog:</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedSuggestionIds.length === generatedSuggestions.length) {
                            setSelectedSuggestionIds([]);
                          } else {
                            setSelectedSuggestionIds(generatedSuggestions.map(s => s.id));
                          }
                        }}
                        className="text-[#ac0053] hover:underline"
                      >
                        {selectedSuggestionIds.length === generatedSuggestions.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {generatedSuggestions.map((sug) => {
                        const isChecked = selectedSuggestionIds.includes(sug.id);
                        return (
                          <div 
                            key={sug.id}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedSuggestionIds(prev => prev.filter(id => id !== sug.id));
                              } else {
                                setSelectedSuggestionIds(prev => [...prev, sug.id]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                              isChecked ? 'border-amber-300 bg-amber-50/10' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 mt-0.5"
                            />
                            <div className="flex-grow">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-900">{sug.name}</span>
                                <span className="text-xs font-extrabold text-gray-900">₹{sug.price}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-semibold line-clamp-1">{sug.description}</p>
                              <div className="mt-1 flex gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                <span>{sug.category}</span>
                                <span>•</span>
                                <span>{sug.duration} mins</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setGeneratedSuggestions([]);
                          setSelectedSuggestionIds([]);
                        }}
                        className="w-1/3 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button 
                        type="button"
                        onClick={handleAddSuggestionsToCatalog}
                        className="w-2/3 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl shadow-md"
                      >
                        Import Selected ({selectedSuggestionIds.length}) to Catalog
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
  );
}
