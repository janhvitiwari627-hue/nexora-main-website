import { CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboard } from '../DashboardContext';

/** MODAL: HELP CENTER — extracted verbatim from the Landing monolith. */
export default function HelpCenterModal() {
  const { setShowHelpCenter, platform } = useDashboard();
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
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setShowHelpCenter(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-base mb-1">Help &amp; FAQ Center</h3>
              <p className="text-xs text-gray-400 mb-6 font-semibold">Everything you need to master your new {platform.name} platform</p>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> How do advance payments work?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    {platform.name} automatically asks clients to complete a percentage deposit before booking (defined in Salon Rules). You can confirm or cancel these manually.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Can I update my template styling later?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    Yes! You can re-run the Onboarding wizard or jump to Step 10 Template Appearance at any time via the sidebar control.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> How do clients scan my QR code?
                  </h4>
                  <p className="text-gray-500 leading-relaxed font-semibold">
                    Go to 'Share &amp; Marketing' tab, scan the dynamic QR with any mobile phone, or copy/download the QR to print for your shop desk!
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowHelpCenter(false)}
                className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-colors"
              >
                Close Help Center
              </button>
            </motion.div>
          </motion.div>
  );
}
