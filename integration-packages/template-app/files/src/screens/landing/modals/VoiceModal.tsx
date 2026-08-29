import { X, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { Service } from '../../../types';
import { useDashboard } from '../DashboardContext';

/** MODAL: VOICE QUICK-ADD ASSISTANT — extracted verbatim from the Landing monolith. */
export default function VoiceModal() {
  const { setShowVoiceModal, voiceInputText, setVoiceInputText, isVoiceListening, setIsVoiceListening, handleParseVoiceCommand } = useDashboard();
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
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-[#ffd9e1]/45 text-[#ac0053] relative">
                  {isVoiceListening && (
                    <span className="absolute inset-0 rounded-full border-2 border-[#ac0053] animate-ping opacity-75"></span>
                  )}
                  <Mic className="w-8 h-8 text-[#ac0053]" />
                </div>

                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Voice Catalog Command</h3>
                  <p className="text-[11px] text-gray-400 mt-1 font-semibold">Speak or paste a natural language statement to quickly register treatments</p>
                </div>

                {/* Animated Soundwave */}
                {isVoiceListening ? (
                  <div className="flex justify-center items-center gap-1 h-8">
                    {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                      <motion.span 
                        key={i} 
                        animate={{ height: [8, h * 6, 8] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.05 }}
                        className="w-1 bg-[#ac0053] rounded-full"
                        style={{ height: '8px' }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-8 flex items-center justify-center text-xs text-gray-400 font-semibold">
                    Microphone is sleeping. Tap to talk!
                  </div>
                )}

                <div className="space-y-3 text-left">
                  <div className="relative">
                    <textarea 
                      value={voiceInputText}
                      onChange={e => setVoiceInputText(e.target.value)}
                      placeholder="e.g. Add service Deluxe Spa Pedicure for 1200 rupees lasting 45 minutes"
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053] resize-none outline-none"
                    />
                  </div>

                  {/* Predefined Clickable Commands Fallback */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or Click Preset Prompt to Try:</span>
                    <div className="space-y-1">
                      {[
                        'Add service Deluxe Spa Pedicure for 1200 rupees lasting 45 minutes',
                        'Create package Bridal Glow Combo with a price of 4500 rupees lasting 150 minutes',
                        'Add service Beard Trim for 250 rupees lasting 15 minutes'
                      ].map((cmd, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setVoiceInputText(cmd);
                            setIsVoiceListening(true);
                            setTimeout(() => {
                              setIsVoiceListening(false);
                            }, 1000);
                          }}
                          className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-150 text-[10px] font-semibold text-gray-600 truncate transition-colors cursor-pointer"
                        >
                          📢 {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsVoiceListening(!isVoiceListening);
                      if (!isVoiceListening) {
                        setTimeout(() => {
                          setVoiceInputText('Add service Deep Nourishing Hair Spa for 850 rupees lasting 60 minutes');
                          setIsVoiceListening(false);
                        }, 2500);
                      }
                    }}
                    className={`w-1/2 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      isVoiceListening 
                        ? 'bg-[#ffd9e1]/20 border-[#ac0053] text-[#ac0053]' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isVoiceListening ? 'Stop Mic Listening' : 'Toggle Mic'}
                  </button>
                  <button 
                    type="button"
                    disabled={!voiceInputText.trim()}
                    onClick={handleParseVoiceCommand}
                    className="w-1/2 bg-[#ac0053] hover:bg-[#ba005b] disabled:opacity-55 text-white font-bold text-xs py-2.5 rounded-xl shadow"
                  >
                    Parse & Add Service
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
  );
}
