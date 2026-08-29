import { Sparkles, Calendar, Users, ClipboardList, Scissors, CreditCard, Share2, Settings, Plus, Laptop, Gift, Palette } from 'lucide-react';
import { useDashboard } from './DashboardContext';

/** Desktop docked sidebar: brand, tab nav, onboarding re-entry. */
export function DashboardSidebar() {
  const { activeTab, setActiveTab, platform, goToStep, setShowNewAppointmentModal } = useDashboard();
  // LEFT SIDEBAR: Premium Docked Menu
  return (
      <nav className="hidden md:flex flex-col h-screen w-64 shrink-0 bg-white border-r border-gray-200 py-6 z-30 select-none shadow-xs justify-between">
        <div>
          <div className="px-6 mb-6">
            <div className="flex items-center gap-2 text-[#ac0053] mb-1">
              <Sparkles className="w-5 h-5" />
              <span className="font-extrabold text-lg tracking-tight">{platform.name} Salon</span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              Premium Dashboard
            </p>
          </div>

          <div className="px-4 mb-6">
            <button 
              onClick={() => setShowNewAppointmentModal(true)}
              className="w-full bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm shadow-[#ac0053]/20"
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>

          <ul className="flex flex-col gap-1 px-3">
            <li>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'overview' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ClipboardList className="w-4.5 h-4.5" />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('website')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'website' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Laptop className="w-4.5 h-4.5" />
                <span>My Live Website</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'services' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Scissors className="w-4.5 h-4.5" />
                <span>Services & Catalog</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'bookings' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4.5 h-4.5" />
                <span>Daily Planner</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'staff' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>Staff Roster</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'payments' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4.5 h-4.5" />
                <span>Payments Ledgers</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('share')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'share' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Share2 className="w-4.5 h-4.5" />
                <span>Share & Marketing</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'settings' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>Salon Rules</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('referral')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'referral' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Gift className="w-4.5 h-4.5" />
                <span>Refer & Earn</span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('branding')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-xs ${
                  activeTab === 'branding' 
                    ? 'text-[#ac0053] bg-[#ffd9e1]/30 font-bold border-l-4 border-[#ac0053] pl-3' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Palette className="w-4.5 h-4.5" />
                <span>Branding</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="px-4">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Onboarding Wizard</p>
            <button 
              onClick={() => goToStep(2)} 
              className="text-[#ac0053] hover:underline text-[11px] font-bold block mx-auto"
            >
              Re-run Onboarding
            </button>
          </div>
        </div>
      </nav>
  );
}

/** Mobile tab pills shown above the scrollable tab viewport. */
export function MobileTabBar() {
  const { activeTab, setActiveTab } = useDashboard();
  // MOBILE NAVIGATION PILLS
  return (
          <div className="flex md:hidden bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto gap-1 mb-4 shrink-0 no-scrollbar">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'overview' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('website')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'website' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Live Website
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'services' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Services
            </button>
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'bookings' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Planner
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'staff' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Staff
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'payments' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Payments
            </button>
            <button 
              onClick={() => setActiveTab('share')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'share' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Share
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'settings' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Settings
            </button>
            <button 
              onClick={() => setActiveTab('referral')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'referral' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Refer & Earn
            </button>
            <button 
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                activeTab === 'branding' ? 'bg-[#ac0053] text-white' : 'text-gray-500'
              }`}
            >
              Branding
            </button>
          </div>
  );
}
