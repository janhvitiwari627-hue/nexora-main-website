import React, { useState } from 'react';
import { MapPin, User, FileText, Sparkles, Menu, X, LogOut, Check, Bell, Settings } from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'home' | 'discover' | 'products' | 'brands' | 'distributors' | 'business' | 'offers' | 'gallery' | 'gallery-moderation';

interface NavbarProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  onNavigate?: (tab: NavTab) => void;
  setActiveTab?: (tab: NavTab) => void;
  selectedCity: string;
  onOpenCitySelector: () => void;
  onOpenRegister: () => void;
  onOpenAuth: () => void;
  onOpenEditProfile?: () => void;
  onOpenQuote?: () => void;
  onOpenQuoteDrawer?: () => void;
  quoteCount: number;
  priceAlertsCount?: number;
  user: UserProfile | null;
  onLogout?: () => void;
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  onNavigate,
  setActiveTab,
  selectedCity,
  onOpenCitySelector,
  onOpenRegister,
  onOpenAuth,
  onOpenEditProfile,
  onOpenQuote,
  onOpenQuoteDrawer,
  quoteCount,
  priceAlertsCount = 0,
  user,
  onLogout,
  onOpenOnboarding
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const active = currentTab || activeTab || 'home';
  const handleNav = (tab: NavTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
    setMobileMenuOpen(false);
  };

  const handleOpenQuote = () => {
    if (onOpenQuote) {
      onOpenQuote();
    } else if (onOpenQuoteDrawer) {
      onOpenQuoteDrawer();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0E6EC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#B8005A] font-serif group-hover:opacity-90 transition-opacity">
            Nexora Luxe
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-6 text-xs xl:text-sm font-medium text-[#4A4A4A] whitespace-nowrap overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleNav('discover')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'discover' || active === 'home' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Explore
            {(active === 'discover' || active === 'home') && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('distributors')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'distributors' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Directory
            {active === 'distributors' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('products')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'products' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Products
            {active === 'products' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('brands')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'brands' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Brands
            {active === 'brands' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('business')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'business' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Business Hub
            {active === 'business' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('offers')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'offers' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Offers & Deals
            {active === 'offers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleNav('gallery')}
            className={`transition-colors relative py-1 hover:text-[#B8005A] shrink-0 ${
              active === 'gallery' ? 'text-[#B8005A] font-semibold' : ''
            }`}
          >
            Gallery
            {active === 'gallery' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B8005A] rounded-full" />
            )}
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Location Button */}
          <button
            onClick={onOpenCitySelector}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#4A4A4A] hover:text-[#B8005A] p-2 rounded-full hover:bg-[#FFF0F5] transition-all"
            title="Select Location / Region"
          >
            <MapPin className="w-4 h-4 text-[#4A4A4A] hover:text-[#B8005A]" />
            <span className="hidden lg:inline">{selectedCity}</span>
          </button>

          {/* User Account / Profile */}
          <div className="relative">
            <button
              onClick={() => {
                if (user) {
                  setUserMenuOpen(!userMenuOpen);
                } else {
                  onOpenAuth();
                }
              }}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#4A4A4A] hover:text-[#B8005A] p-1.5 sm:p-2 rounded-full hover:bg-[#FFF0F5] transition-all"
              title={user ? `Signed in as ${user.name}` : 'Sign In / Account'}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#B8005A]/40 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FFF0F5] text-[#B8005A] border border-[#FFD1E3] flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-[#4A4A4A]" />}
                </div>
              )}
              {user && (
                <span className="hidden lg:inline text-xs font-semibold text-[#B8005A] max-w-[120px] truncate">
                  {user.name}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            {user && userMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-[#EDEDED] shadow-xl rounded-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="pb-2 mb-2 border-b border-[#F0F0F0] px-2 flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#B8005A]/30 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF0F5] to-[#FFD1E3] text-[#B8005A] border border-[#FFD1E3] flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#1E1E1E] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#737373] truncate">{user.companyName || 'Verified Buyer'}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-[#10B981] bg-[#E8F8F2] px-2 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5" /> B2B Verified
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (onOpenEditProfile) {
                      onOpenEditProfile();
                    } else {
                      onOpenAuth();
                    }
                  }}
                  className="w-full text-left px-2 py-2 text-xs font-semibold text-[#1E1E1E] hover:text-[#B8005A] hover:bg-[#FFF0F5] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#B8005A]" /> Edit Profile & Photo
                </button>

                {onOpenOnboarding && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenOnboarding();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs font-medium text-[#B8005A] hover:bg-[#FFF0F5] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Business Onboarding
                  </button>
                )}

                <div className="px-2 py-1.5 text-xs font-medium text-[#555] flex items-center justify-between rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] my-1">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                    <Bell className="w-3 h-3 text-[#B8005A]" /> Price Alerts
                  </span>
                  <span className="text-[11px] font-bold text-[#B8005A] bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FFD1E3]">
                    {priceAlertsCount} active
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quote / RFQ Cart */}
          <button
            onClick={handleOpenQuote}
            className="relative flex items-center gap-1 text-xs font-semibold text-[#4A4A4A] hover:text-[#B8005A] p-2 rounded-full hover:bg-[#FFF0F5] transition-all"
            title="Wholesale Inquiries & Quotes"
          >
            <FileText className="w-4 h-4" />
            {quoteCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B8005A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {quoteCount}
              </span>
            )}
          </button>

          {/* Mobile / Tablet Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#4A4A4A] hover:text-[#B8005A] rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#F0E6EC] px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#F0E6EC]">
            <button
              onClick={() => handleNav('discover')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'discover' || active === 'home' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Explore
            </button>

            <button
              onClick={() => handleNav('distributors')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'distributors' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Directory
            </button>

            <button
              onClick={() => handleNav('products')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'products' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Products
            </button>

            <button
              onClick={() => handleNav('brands')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'brands' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Brands
            </button>

            <button
              onClick={() => handleNav('business')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'business' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Business Hub
            </button>

            <button
              onClick={() => handleNav('offers')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                active === 'offers' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Offers & Deals
            </button>

            <button
              onClick={() => handleNav('gallery')}
              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-colors col-span-2 ${
                active === 'gallery' ? 'bg-[#FFF0F5] text-[#B8005A]' : 'bg-[#FAFAFA] text-[#4A4A4A]'
              }`}
            >
              Gallery
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCitySelector();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-[#737373]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B8005A]" />
              <span>{selectedCity}</span>
            </button>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenQuote();
              }}
              className="text-xs font-semibold text-[#B8005A] flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quote Requests ({quoteCount})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

