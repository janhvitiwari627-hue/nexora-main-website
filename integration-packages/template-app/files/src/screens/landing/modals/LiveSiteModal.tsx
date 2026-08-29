import { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
// Live-site preview renderer stays code-split: it downloads the first time this modal opens.
const TemplateRenderer = lazy(() => import('../../../components/TemplateRenderer'));
import { useDashboard } from '../DashboardContext';

/** MODAL: LIVE SITE IFRAME/PREVIEW SCREEN OVERLAY — extracted verbatim from the Landing monolith. */
export default function LiveSiteModal() {
  const { data, mode, setMode, setShowLiveSiteModal } = useDashboard();
  return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 md:p-8 z-50 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden relative border border-gray-100 shadow-2xl"
            >
              <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">Live client website preview</span>
                </div>
                
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button 
                    onClick={() => setMode('desktop')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mode === 'desktop' ? 'bg-white shadow-3xs text-gray-800' : 'text-gray-400'}`}
                  >
                    Desktop
                  </button>
                  <button 
                    onClick={() => setMode('mobile')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold ${mode === 'mobile' ? 'bg-white shadow-3xs text-gray-800' : 'text-gray-400'}`}
                  >
                    Mobile
                  </button>
                </div>

                <button 
                  onClick={() => setShowLiveSiteModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden relative bg-gray-50 flex items-center justify-center">
                <Suspense
                  fallback={
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Loading live preview…
                    </div>
                  }
                >
                  <TemplateRenderer data={data} mode={mode} />
                </Suspense>
              </div>
            </motion.div>
          </motion.div>
  );
}
