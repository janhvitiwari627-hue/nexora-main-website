import { motion } from 'motion/react';
import BrandingWhiteLabel from '../../../components/BrandingWhiteLabel';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function BrandingTab() {
  const { data, setNotifications } = useDashboard();
  return (
              <motion.div 
                key="branding"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-[1440px] mx-auto w-full"
              >
                <BrandingWhiteLabel
                  data={data}
                  onNotify={(msg) => setNotifications(prev => [{ id: `n-${Date.now()}`, text: msg, time: 'Just now', read: false }, ...prev])}
                />
              </motion.div>
  );
}
