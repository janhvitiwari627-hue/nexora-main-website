import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Menu, 
  X, 
  Mail, 
  Building2, 
  Sparkles, 
  Package, 
  Layers, 
  PlusCircle, 
  CheckCircle2, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  Edit3,
  Briefcase,
  Bell
} from 'lucide-react';
import { BuyerProfileData } from './EditProfileModal';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../hooks/useNotifications';
import { BackToMainWebsiteButton } from './BackToMainWebsiteButton';

interface TopNavBarProps {
  currentScreen: any;
  onNavigate: (screen: any, params?: any) => void;
  onOpenRFQModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isLoggedIn: boolean;
  userRole: 'buyer' | 'supplier' | null;
  userProfile?: BuyerProfileData;
  onOpenEditProfile: () => void;
  onLogout: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentScreen,
  onNavigate,
  onOpenRFQModal,
  onOpenAuthModal,
  isLoggedIn,
  userRole,
  userProfile,
  onOpenEditProfile,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { unreadCount } = useNotifications();

  const navItems = [
    { id: 'explore', label: 'Explore' },
    { id: 'plp', label: 'Products' },
    { id: 'supplier-directory', label: 'Suppliers Directory' },
    { id: 'brands', label: 'Brand Directory' },
    { id: 'oem-hub', label: 'OEM / Private Label' },
  ];

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (screenId: string, params?: any) => {
    onNavigate(screenId as any, params);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const displayName = userProfile?.fullName || (userRole === 'supplier' ? 'Aura Beauty Labs' : 'Priya Sharma');
  const displayEmail = userProfile?.email || (userRole === 'supplier' ? 'contact@aurabeauty.in' : 'priya.procurement@radiantbeauty.in');
  const displayCompany = userProfile?.businessName || (userRole === 'supplier' ? 'Aura Beauty Labs Pvt Ltd' : 'Radiant Beauty Solutions');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Profile completion calculation (e.g. 85%)
  const profileCompletion = userProfile?.isGstVerified ? 90 : 70;

  return (
    <header className="fixed top-0 z-50 w-full bg-[#FFFDFC]/90 backdrop-blur-xl border-b border-[#E8DFE3] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <div
          onClick={() => handleNavClick('explore')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[#B90064] to-[#500037] rounded-xl flex items-center justify-center shadow-md shadow-[#B90064]/20 transition-transform group-hover:scale-105">
            <span className="text-white font-serif font-bold text-xl leading-none">N</span>
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-[#1C1B1B] block leading-none">
              Nexora<span className="text-[#B90064] ml-1 font-sans text-lg font-light">Luxe</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#8D8087] block mt-0.5">
              B2B Beauty Marketplace
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id || (item.id === 'supplier-directory' && currentScreen === 'directory');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-[14px] py-1.5 transition-all cursor-pointer relative font-medium ${
                  isActive
                    ? 'text-[#B90064] font-bold'
                    : 'text-[#534249] hover:text-[#B90064]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B90064] rounded-full animate-in fade-in duration-200"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & Interactive User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden xl:block">
            <BackToMainWebsiteButton />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[#500037]">
            <button 
              aria-label="Supplier Portal & Ad Campaigns"
              title="Supplier Admin Portal & Sponsored Ad Manager"
              onClick={() => handleNavClick('supplier-portal')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-[13px] font-bold ${
                currentScreen === 'supplier-portal' 
                  ? 'bg-[#B90064] text-white shadow-sm' 
                  : 'bg-[#fde7f3] hover:bg-[#fbcfe8] text-[#b90064] border border-[#f7c5e0]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#b90064]" />
              <span className="hidden md:inline">Supplier Portal & Ads</span>
            </button>

            {/* Notification Bell Center */}
            <div className="relative" ref={notifRef}>
              <button
                aria-label="Procurement Notifications & Alerts"
                title="Notifications & Live RFQ Responses"
                onClick={() => setNotificationsOpen(prev => !prev)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                  notificationsOpen
                    ? 'bg-[#FAF1F5] border-[#B90064] text-[#B90064] shadow-xs'
                    : 'bg-[#FCF9F8] hover:bg-[#FAF1F5] border-[#E8DFE3] hover:border-[#B90064] text-[#534249] hover:text-[#B90064]'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#B90064] text-[9px] font-black text-white shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 z-50">
                  <NotificationCenter
                    variant="dropdown"
                    onNavigate={(screen, params) => {
                      setNotificationsOpen(false);
                      onNavigate(screen, params);
                    }}
                    onClose={() => setNotificationsOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Profile Dropdown or Sign In Button */}
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  aria-label="User Profile Menu"
                  title="Profile & Settings"
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 bg-[#fcf9f8] hover:bg-[#FAF1F5] border border-[#E8DFE3] hover:border-[#b90064] rounded-xl transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-[12px] font-bold text-[#1c1b1b] leading-tight group-hover:text-[#b90064] truncate max-w-[110px]">
                      {displayName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-[#8c7077] leading-none capitalize">
                      {userRole || 'Buyer'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8c7077] transition-transform ${profileDropdownOpen ? 'rotate-180 text-[#b90064]' : ''}`} />
                </button>

                {/* Floating Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#e8e8e8] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header Summary */}
                    <div className="p-4 bg-[#fcf9f8] border-b border-[#e8e8e8]">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden shrink-0">
                          {userProfile?.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1c1b1b] truncate">{displayName}</h4>
                          <p className="text-[11px] text-[#594047] truncate">{displayEmail}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#fde7f3] text-[#b90064] text-[9px] font-bold">
                              {userRole === 'supplier' ? 'Verified Supplier' : 'Verified Buyer'}
                            </span>
                            {userProfile?.isGstVerified && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-green-700">
                                <CheckCircle2 className="w-2.5 h-2.5 text-green-600" /> GST Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Profile Strength Progress */}
                      <div className="mt-3 pt-2.5 border-t border-[#f0edec]">
                        <div className="flex justify-between text-[10px] font-bold text-[#594047] mb-1">
                          <span>Profile Strength</span>
                          <span className="text-[#b90064]">{profileCompletion}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#b90064] to-[#e6007e] rounded-full transition-all duration-300"
                            style={{ width: `${profileCompletion}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions */}
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (userRole === 'supplier') {
                            handleNavClick('supplier-profile', { supplierId: 'seller_aura_001' });
                          } else {
                            handleNavClick('buyer-profile');
                          }
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#FAF1F5] text-xs font-bold text-[#1c1b1b] hover:text-[#b90064] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#b90064]" />
                        <span>View My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#FAF1F5] text-xs font-bold text-[#1c1b1b] hover:text-[#b90064] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-[#b90064]" />
                        <span>Edit Profile & Business Details</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleNavClick('supplier-portal');
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#FAF1F5] text-xs font-bold text-[#b90064] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#b90064]" />
                        <span>Supplier Portal & Ad Campaigns</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleNavClick('buyer-dashboard');
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#FAF1F5] text-xs font-semibold text-[#594047] hover:text-[#1c1b1b] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-[#8c7077]" />
                        <span>Buyer RFQ & Sourcing Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenEditProfile();
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#FAF1F5] text-xs font-semibold text-[#594047] hover:text-[#1c1b1b] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#8c7077]" />
                        <span>Account & Security Settings</span>
                      </button>

                      <div className="pt-1.5 mt-1.5 border-t border-[#f0edec]">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                aria-label="Profile"
                title="Supplier / Buyer Sign In"
                onClick={() => onOpenAuthModal('login')}
                className="p-2 hover:bg-[#FAF1F5] text-[#534249] hover:text-[#B90064] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
          
          <button
            onClick={onOpenRFQModal}
            className="bg-[#B90064] hover:bg-[#A00057] active:scale-[0.98] text-white text-[13px] font-bold px-4 sm:px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#B90064]/25 cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Post Requirement</span>
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-[#FAF1F5] text-[#500037] cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E8DFE3] bg-[#FFFDFC] shadow-xl px-4 py-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id || (item.id === 'supplier-directory' && currentScreen === 'directory');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-[#FAF1F5] text-[#B90064]'
                      : 'text-[#1C1B1B] hover:bg-[#FAF5F7]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-[#B90064]" />}
                </button>
              );
            })}

            <div className="pt-3 mt-2 border-t border-[#F0E8EB] flex flex-col gap-2">
              <div onClick={() => setMobileMenuOpen(false)} className="px-3.5 py-2.5">
                <BackToMainWebsiteButton />
              </div>
              {isLoggedIn ? (
                <>
                  <div className="p-3 bg-[#fcf9f8] rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b90064] to-[#e6007e] text-white flex items-center justify-center font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1c1b1b] truncate">{displayName}</div>
                      <div className="text-[11px] text-[#594047] truncate">{displayEmail}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEditProfile();
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#b90064] bg-[#FAF1F5] flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile & Business Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('buyer-dashboard', { tab: 'notifications' });
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#1C1B1B] hover:bg-[#FAF1F5] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#B90064]" />
                      <span>Notifications & Alerts</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#B90064] text-white text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleNavClick('buyer-dashboard')}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#534249] hover:bg-[#FAF1F5] flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-[#B90064]" />
                    <span>Buyer Workspace & Enquiries</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick('buyer-dashboard')}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#534249] hover:bg-[#FAF1F5] flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-[#B90064]" />
                    <span>Buyer Workspace & Enquiries</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal('login');
                    }}
                    className="text-left px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-[#534249] hover:bg-[#FAF1F5] flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#B90064]" />
                    <span>Supplier / Buyer Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


