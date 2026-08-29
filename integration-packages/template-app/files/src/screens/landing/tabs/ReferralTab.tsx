import { motion } from 'motion/react';
import ShareReferralPremium from '../../../components/ShareReferralPremium';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function ReferralTab() {
  const { data, liveUrl, setNotifications } = useDashboard();
  return (
              <motion.div 
                key="referral"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-[1440px] mx-auto w-full"
              >
                <ShareReferralPremium
                  salonName={data.salonName}
                  liveUrl={liveUrl}
                  onNotify={(msg) => setNotifications(prev => [{ id: `n-${Date.now()}`, text: msg, time: 'Just now', read: false }, ...prev])}
                />
              </motion.div>
  );
}
