import { lazy, Suspense } from 'react';
import { Sparkles, ExternalLink, HelpCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OwnerAvatar from '../../components/OwnerAvatar';
import { DashboardContext } from './DashboardContext';
import useDashboardState from './useDashboardState';
import type { LandingProps } from './types';
import TabSkeleton from './TabSkeleton';
import { DashboardSidebar, MobileTabBar } from './DashboardSidebar';
import NewAppointmentModal from './modals/NewAppointmentModal';
import ServiceDrawerModal from './modals/ServiceDrawerModal';
import PackageDrawerModal from './modals/PackageDrawerModal';
import VoiceModal from './modals/VoiceModal';
import AiSuggestModal from './modals/AiSuggestModal';
import LiveSiteModal from './modals/LiveSiteModal';
import HelpCenterModal from './modals/HelpCenterModal';

const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const WebsiteTab = lazy(() => import('./tabs/WebsiteTab'));
const ServicesTab = lazy(() => import('./tabs/ServicesTab'));
const BookingsTab = lazy(() => import('./tabs/BookingsTab'));
const StaffTab = lazy(() => import('./tabs/StaffTab'));
const PaymentsTab = lazy(() => import('./tabs/PaymentsTab'));
const ShareTab = lazy(() => import('./tabs/ShareTab'));
const SettingsTab = lazy(() => import('./tabs/SettingsTab'));
const ReferralTab = lazy(() => import('./tabs/ReferralTab'));
const BrandingTab = lazy(() => import('./tabs/BrandingTab'));

/**
 * Published-salon owner dashboard shell. Owns no state directly:
 * useDashboardState holds every piece of dashboard state, tabs/modals/chrome
 * consume it through DashboardContext, and all ten tabs are lazy-loaded.
 */
export default function DashboardScreen({ data, setData, onNext, goToStep, onOpenStaffManagement, forcedActiveTab, onTabChange, onThemeChange }: LandingProps) {
  const dashboardValue = useDashboardState({ data, setData, onNext, goToStep, onOpenStaffManagement, forcedActiveTab, onTabChange, onThemeChange });
  const { setActiveTab, mode, showNewAppointmentModal, notifications, setNotifications, showNotifications, showLiveSiteModal, setShowLiveSiteModal, showServiceDrawer, showPackageDrawer, showVoiceModal, showAiSuggestModal, activeTab, setShowNotifications, setShowHelpCenter, showHelpCenter } = dashboardValue;

  return (
    <DashboardContext.Provider value={dashboardValue}>
      <div className="h-screen bg-[#f9f8f6] flex flex-col md:flex-row font-sans text-gray-900 overflow-hidden relative">

      <DashboardSidebar />


      {/* MAIN LAYOUT: Top navbar + scrollable dynamic center viewport */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        
        {/* TOP BAR GREETING & VIEW SITE BUTTON */}
        <header className="h-16 bg-white border-b border-gray-200 shrink-0 flex items-center justify-between px-6 z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-700" onClick={() => setActiveTab('overview')}>
              <Sparkles className="w-6 h-6 text-[#ac0053]" />
            </button>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 md:text-base tracking-tight flex items-center gap-1.5">
                Good morning, {data.ownerName || 'Partner'}
                <span className="animate-bounce inline-block">👋</span>
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">{data.salonName || 'Your Salon'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLiveSiteModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 border border-[#ac0053]/20 rounded-xl text-xs font-bold text-[#ac0053] hover:bg-[#ffd9e1]/20 transition-all shadow-3xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Website
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Notifications dropdown menu */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 text-xs"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-2">
                      <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                        className="text-xs text-[#ac0053] hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-2 rounded-xl border ${n.read ? 'bg-white border-gray-100' : 'bg-[#ffd9e1]/10 border-[#ac0053]/20'}`}>
                          <p className={`text-gray-800 ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.text}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowHelpCenter(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <OwnerAvatar photoUrl={data.ownerPhotoUrl} name={data.ownerName} className="w-full h-full text-[10px]" alt="Profile" />
            </div>
          </div>
        </header>

        {/* VIEWPORT CONTENT CONTAINER */}
        <div className="flex-grow overflow-y-auto p-4 md:p-8 pb-20">
          
          <MobileTabBar />

          <AnimatePresence mode="wait">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <Suspense key="overview" fallback={<TabSkeleton />}>
                <OverviewTab />
              </Suspense>
            )}

            {/* TAB: WEBSITE CONTENT MANAGER */}
            {activeTab === 'website' && (
              <Suspense key="website" fallback={<TabSkeleton />}>
                <WebsiteTab />
              </Suspense>
            )}

            {/* TAB: SERVICES & CATALOG */}
            {activeTab === 'services' && (
              <Suspense key="services" fallback={<TabSkeleton />}>
                <ServicesTab />
              </Suspense>
            )}

            {/* TAB: PLANNED DAILY BOOKINGS */}
            {activeTab === 'bookings' && (
              <Suspense key="bookings" fallback={<TabSkeleton />}>
                <BookingsTab />
              </Suspense>
            )}

            {/* TAB: STAFF MANAGEMENT */}
            {activeTab === 'staff' && (
              <Suspense key="staff" fallback={<TabSkeleton />}>
                <StaffTab />
              </Suspense>
            )}

            {/* TAB: PAYMENTS — Premium Revenue Dashboard matching Nexora spec */}
            {activeTab === 'payments' && (
              <Suspense key="payments" fallback={<TabSkeleton />}>
                <PaymentsTab />
              </Suspense>
            )}

            {/* TAB: SHARE & REFERRAL MARKETING */}
            {activeTab === 'share' && (
              <Suspense key="share" fallback={<TabSkeleton />}>
                <ShareTab />
              </Suspense>
            )}

            {/* TAB: SALON RULES & SETTINGS */}
            {activeTab === 'settings' && (
              <Suspense key="settings" fallback={<TabSkeleton />}>
                <SettingsTab />
              </Suspense>
            )}

            {/* TAB: SHARE & REFERRAL PREMIUM (Screen 24) */}
            {activeTab === 'referral' && (
              <Suspense key="referral" fallback={<TabSkeleton />}>
                <ReferralTab />
              </Suspense>
            )}

            {/* TAB: BRANDING & WHITE-LABEL PREMIUM (Screen 25) */}
            {activeTab === 'branding' && (
              <Suspense key="branding" fallback={<TabSkeleton />}>
                <BrandingTab />
              </Suspense>
            )}

          </AnimatePresence>
        </div>
      </div>

{/* MODAL: NEW APPOINTMENT CREATOR */}
      <AnimatePresence>
        {showNewAppointmentModal && <NewAppointmentModal />}
      </AnimatePresence>

{/* DRAWER: SERVICE SLIDE-OUT FROM RIGHT */}
      <AnimatePresence>
        {showServiceDrawer && <ServiceDrawerModal />}
      </AnimatePresence>

{/* DRAWER: PACKAGE SLIDE-OUT FROM RIGHT */}
      <AnimatePresence>
        {showPackageDrawer && <PackageDrawerModal />}
      </AnimatePresence>

{/* MODAL: VOICE QUICK-ADD ASSISTANT */}
      <AnimatePresence>
        {showVoiceModal && <VoiceModal />}
      </AnimatePresence>

{/* MODAL: AI SUGGEST IDEAS WIZARD */}
      <AnimatePresence>
        {showAiSuggestModal && <AiSuggestModal />}
      </AnimatePresence>

{/* MODAL: LIVE SITE IFRAME/PREVIEW SCREEN OVERLAY */}
      <AnimatePresence>
        {showLiveSiteModal && <LiveSiteModal />}
      </AnimatePresence>

{/* MODAL: HELP CENTER */}
      <AnimatePresence>
        {showHelpCenter && <HelpCenterModal />}
      </AnimatePresence>
    </div>
      </DashboardContext.Provider>
  );
}
