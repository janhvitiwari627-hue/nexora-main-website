import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useBrandConfig } from '../../config/brandConfig';

interface WelcomeScreenProps {
  onNext: () => void;
}

/** Public welcome page shown while the website is not yet published. */
export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const { platform } = useBrandConfig();
  return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col font-sans">
        <header className="h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-[#ac0053]">
            <Sparkles className="w-6 h-6" />
            <span className="font-semibold text-xl tracking-tight">{platform.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden md:block">Ready to build your digital home?</span>
            <button onClick={onNext} className="bg-[#ac0053] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#8f0044] transition-all">
              Get Started
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center py-16 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#ffd9e1] text-[#8f0044] rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Builder
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              Create Your Salon Website <br />in 15 Simple Steps
            </h1>
            
            <p className="text-sm md:text-base text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the power of a fully styled, customizable salon website paired with robust backend booking rules, real-time staff scheduling, and local persistence.
            </p>

            <button 
              onClick={onNext}
              className="bg-[#ac0053] text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-[#8f0044] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-98"
            >
              Start Onboarding Wizard
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> Dynamic Scheduling</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> Premium Templates</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ac0053]" /> Staff Roster Sync</div>
            </div>
          </motion.div>
        </main>
      </div>
  );
}
