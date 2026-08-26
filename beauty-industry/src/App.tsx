import React, { useEffect, useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { HeroSection } from './components/HeroSection';
import { CategoryGrid } from './components/CategoryGrid';
import { TrendingCategories } from './components/TrendingCategories';
import { QuickRFQSection } from './components/QuickRFQSection';
import { MarketplaceColumns } from './components/MarketplaceColumns';
import { SponsoredImageAds } from './components/SponsoredImageAds';
import { TopProfilesMarqueeBar } from './components/TopProfilesMarqueeBar';
import { SponsoredReelsSection } from './components/SponsoredReelsSection';
import { SponsoredFullVideoSection } from './components/SponsoredFullVideoSection';
import { OEMSpotlight } from './components/OEMSpotlight';
import { SellerGrowthSection } from './components/SellerGrowthSection';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DirectoryHubScreen } from './components/DirectoryHubScreen';
import { EnquiryModal } from './components/EnquiryModal';
import { AuthModal } from './components/AuthModal';
import { ProductListingScreen } from './components/ProductListingScreen';
import { SearchFilterScreen } from './components/SearchFilterScreen';
import { SupplierDirectoryScreen } from './components/SupplierDirectoryScreen';
import { SupplierProfileScreen } from './components/SupplierProfileScreen';
import { SellerProfileScreen } from './components/SellerProfileScreen';
import { SupplierOnboardingScreen } from './components/SupplierOnboardingScreen';
import { SupplierVerificationScreen } from './components/SupplierVerificationScreen';
import { BrandDirectoryDetailScreen } from './components/BrandDirectoryDetailScreen';
import { OemPrivateLabelHubScreen } from './components/OemPrivateLabelHubScreen';
import { SupplierAdminPortal } from './components/SupplierAdminPortal';
import { BuyerDashboard } from './components/BuyerDashboard';
import { BuyerRFQTrackingScreen } from './components/BuyerRFQTrackingScreen';
import { SampleRequestScreen } from './components/SampleRequestScreen';
import { PostRequirementScreen } from './components/PostRequirementScreen';
import { BuyerEnquiryLogScreen } from './components/BuyerEnquiryLogScreen';
import { EditProfileModal, BuyerProfileData } from './components/EditProfileModal';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ChatModalDrawer } from './components/ChatModalDrawer';
import { BuyerOnboardingScreen } from './components/BuyerOnboardingScreen';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { getBuyerProfile, BUYER_PROFILES_DB } from './data/buyerProfilesData';
import {
  SupabaseProvider,
  useSupabase,
  AUTH_LOGIN_PATH,
  AUTH_CALLBACK_PATH,
  AUTH_CALLBACK_PREFIX,
  getAuthCallbackCode,
  hasAuthCallbackParams,
  isAuthPath,
  redirectToLogin,
  stripAuthCallbackParams,
} from './lib/supabase';
import {
  CATEGORIES,
  TRENDING_PRODUCTS,
  VERIFIED_SUPPLIERS
} from './data/mockData';
import { RFQItem, DealProduct, TrendingProduct, VerifiedSupplier, SearchProduct } from './types';
import { CheckCircle2, Database } from 'lucide-react';

let appMountLogged = false;

function NexoraShopApp() {
  const {
    isConfigured,
    authReady,
    session,
    user,
    locationSyncStatus,
    signOut,
  } = useSupabase();

  useEffect(() => {
    if (appMountLogged) return;
    appMountLogged = true;
    console.info('App mounted successfully');
  }, []);

  const [currentScreen, setCurrentScreen] = useState<'explore' | 'directory' | 'supplier-directory' | 'plp' | 'product-detail' | 'search-results' | 'brands' | 'oem-hub' | 'supplier-profile' | 'onboarding' | 'buyer-onboarding' | 'supplier-portal' | 'supplier-verification' | 'buyer-dashboard' | 'buyer-profile' | 'rfq-tracking' | 'sample-request' | 'post-rfq' | 'buyer-enquiry-log'>('explore');
  const [selectedProductId, setSelectedProductId] = useState<string>('product_vitc_101');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('seller_aura_001');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // Persistent Auth State (synced from the single Supabase auth session when a
  // real Supabase project is configured; local demo storage is only a fallback).
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (isConfigured) return false;
    const stored = localStorage.getItem('nexora_is_logged_in');
    return stored === 'true';
  });

  const [userRole, setUserRole] = useState<'buyer' | 'supplier' | null>(() => {
    if (isConfigured) return null;
    const stored = localStorage.getItem('nexora_user_role');
    return (stored === 'buyer' || stored === 'supplier') ? stored : null;
  });

  // Persistent Buyer Profile State
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfileData>(() => {
    const priyaDefault = getBuyerProfile('buyer_priya_001') || {
      id: 'buyer_priya_001',
      fullName: 'Priya Sharma',
      businessName: 'Radiant Beauty Solutions',
      businessType: 'Salon / Spa Chain',
      designation: 'Head of Procurement',
      email: 'priya.procurement@radiantbeauty.in',
      phone: '+91 98201 54321',
      alternatePhone: '+91 22 2650 4321',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      coverPhotoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
      gstin: '27AAACR1234F1Z5',
      pancard: 'AAACR1234F',
      address: 'Plot No. 42, Bandra-Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      annualProcurementBudget: '₹25 Lakhs - ₹1 Crore',
      primaryCategories: ['Skincare & Serums', 'Haircare & Treatments'],
      preferredDeliveryTimeline: '3 - 7 Days',
      whatsappAlerts: true,
      emailAlerts: true,
      isGstVerified: true,
      isBusinessVerified: true,
      followersCount: 1481,
      partnerCardNumber: 'NXP 807A 45DF 9875',
      partnerTier: 'Gold',
      sourcingDistrict: 'Mumbai Metro Region, MH',
      responseSla: '99.8% SLA',
      joinedDate: 'January 2024'
    };

    const stored = localStorage.getItem('nexora_buyer_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...priyaDefault,
          ...parsed
        };
      } catch (e) {
        // Fallback
      }
    }
    return priyaDefault;
  });

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [buyerDashboardTab, setBuyerDashboardTab] = useState<'overview' | 'about' | 'rfqs' | 'saved' | 'social' | 'activity' | 'notifications'>('overview');
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: 'All',
    location: 'All India',
    tab: 'products' as 'products' | 'suppliers' | 'oem',
    supplierId: undefined as string | undefined,
  } as { query: string; category: string; location: string; tab: 'products' | 'suppliers' | 'oem'; supplierId?: string });
  
  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [targetEnquiryItem, setTargetEnquiryItem] = useState<any | null>(null);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [targetSupplierName, setTargetSupplierName] = useState('');

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatInitialSupplier, setChatInitialSupplier] = useState<{ id: string; name: string; location: string; isVerified: boolean } | undefined>(undefined);
  const [chatInitialProduct, setChatInitialProduct] = useState<{ title: string; image: string; price?: string; moq?: string } | undefined>(undefined);

  // Phase 4 Database Inspector Modal State
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  const handleOpenChat = (supplier?: { id: string; name: string; location: string; isVerified: boolean }, product?: { title: string; image: string; price?: string; moq?: string }) => {
    setChatInitialSupplier(supplier);
    setChatInitialProduct(product);
    setChatModalOpen(true);
  };

  // Interactive Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveProfile = (updated: BuyerProfileData) => {
    setBuyerProfile(updated);
    localStorage.setItem('nexora_buyer_profile', JSON.stringify(updated));
    triggerToast('Profile & Business Details updated successfully!');
  };

  const handleLogout = async () => {
    localStorage.removeItem('nexora_user_session');
    localStorage.removeItem('nexora_guest_mode');
    localStorage.setItem('nexora_is_logged_in', 'false');
    localStorage.removeItem('nexora_user_role');
    setIsLoggedIn(false);
    setUserRole(null);
    setIsEditProfileOpen(false);
    await signOut({ redirectToLogin: false });
    setCurrentScreen('explore');
    triggerToast('You have signed out successfully.');
  };

  const handleLoginSuccess = (role: 'buyer' | 'supplier', isNewUser?: boolean) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem('nexora_is_logged_in', 'true');
    localStorage.setItem('nexora_user_role', role);
    setIsAuthModalOpen(false);
    
    if (isNewUser) {
      const target = role === 'buyer' ? 'buyer-onboarding' : 'onboarding';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome to Nexora Luxe! Let's set up your ${role} profile.`);
    } else {
      const target = role === 'buyer' ? 'buyer-dashboard' : 'supplier-portal';
      setCurrentScreen(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      triggerToast(`Welcome back! Logged in as ${role === 'buyer' ? 'Buyer' : 'Supplier'}.`);
    }
  };

  // Handlers
  const handleNavigate = (screen: any, params?: any) => {
    // 1. Define restricted list
    const supplierScreens = ['supplier-portal', 'supplier-verification', 'onboarding'];
    const buyerScreens = ['buyer-dashboard', 'buyer-profile', 'rfq-tracking', 'buyer-enquiry-log', 'post-rfq', 'sample-request', 'buyer-onboarding'];

    // 2. Perform Role Guard check
    if (isLoggedIn) {
      if (userRole === 'buyer' && supplierScreens.includes(screen)) {
        triggerToast('Access Restricted: Buyer accounts cannot access the Supplier Portal.');
        setCurrentScreen('buyer-dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (userRole === 'supplier' && buyerScreens.includes(screen)) {
        triggerToast('Access Restricted: Supplier accounts cannot access the Buyer Workspace.');
        setCurrentScreen('supplier-portal');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else {
      // If guest tries to access protected dashboard features, open login
      const protectedScreens = [...supplierScreens, ...buyerScreens];
      if (protectedScreens.includes(screen)) {
        setAuthMode('login');
        setIsAuthModalOpen(true);
        triggerToast('Please sign in to access dashboard workspace features.');
        return;
      }
    }

    setCurrentScreen(screen);
    if ((screen === 'buyer-dashboard' || screen === 'buyer-profile') && params?.tab) {
      setBuyerDashboardTab(params.tab);
    }
    if (params) {
      if (params.productId) {
        setSelectedProductId(params.productId);
      }
      if (params.supplierId) {
        setSelectedSupplierId(params.supplierId);
      }
      if (params.buyerId || (screen === 'buyer-profile' && (params.memberData || params.buyerId))) {
        const found = getBuyerProfile(params.buyerId || params.memberData?.profileId || params.memberData?.id || params.memberData?.name);
        if (found) {
          setBuyerProfile({ ...found });
        } else if (params.memberData) {
          const m = params.memberData;
          const cleanName = m.name.replace(/\s*\(.*?\)\s*/g, '').trim();
          const bizName = m.name.match(/\((.*?)\)/)?.[1] || `${cleanName} Enterprises`;
          setBuyerProfile(prev => ({
            ...prev,
            fullName: cleanName,
            businessName: bizName,
            businessType: m.businessType || prev.businessType,
            avatarUrl: m.avatar,
            city: m.city || prev.city,
            state: m.state || prev.state,
            isGstVerified: m.isGstVerified,
            followersCount: m.followersCount || prev.followersCount
          }));
        }
      }
      setSearchParams((prev) => ({
        ...prev,
        ...params
      }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      setAuthMode('register');
      setIsAuthModalOpen(true);
    } else {
      setAuthMode(mode);
      setIsAuthModalOpen(true);
    }
  };

  const handleOpenEnquiry = (item: any) => {
    setTargetEnquiryItem(item);
    setIsEnquiryModalOpen(true);
  };

  const handleCallSupplier = (supplierName: string) => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please login to view verified business contact details.');
      return;
    }

    const supplier = VERIFIED_SUPPLIERS.find(s => s.name === supplierName);
    const phone = supplier?.phone || '+919820155443';
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Direct native dialer trigger
    window.location.href = `tel:${cleanPhone}`;
    triggerToast(`Opening native dialer to contact ${supplierName}`);
  };

  const handleWhatsAppSupplier = (supplierName: string) => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      triggerToast('Please login to contact suppliers via WhatsApp.');
      return;
    }

    const supplier = VERIFIED_SUPPLIERS.find(s => s.name === supplierName);
    const whatsapp = supplier?.whatsapp || '919820155443'; // Default if not found
    const nameToUse = supplierName || supplier?.name || 'Supplier';
    const message = encodeURIComponent(`Hello ${nameToUse}, I found your business on Nexora Luxe and I am interested in your products. Can we discuss a potential enquiry?`);
    
    // Direct WhatsApp redirect
    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    triggerToast(`Opening direct WhatsApp channel with ${nameToUse}`);
  };

  const handleSearchSubmit = (params: any) => {
    setSearchParams({
      query: params.query || '',
      category: params.category !== 'All Categories' ? params.category : 'All',
      location: params.location !== 'Any Location' ? params.location : 'All India',
      tab: params.scope || 'products'
    });
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryName: string) => {
    setSearchParams({
      query: '',
      category: categoryName,
      location: 'All India',
      tab: 'products'
    });
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    setSearchParams((prev) => ({
      ...prev,
      query: tag,
      tab: 'products'
    }));
    setCurrentScreen('search-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive the Supabase user's role (stored in auth metadata at registration).
  const supabaseRole = (user?.user_metadata?.role as 'buyer' | 'supplier') || null;
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isAuthLoginPath = currentPathname === AUTH_LOGIN_PATH;
  const isAuthCallbackPath = currentPathname === AUTH_CALLBACK_PATH || currentPathname.startsWith(AUTH_CALLBACK_PREFIX);
  const isAuthRoute = isAuthPath(currentPathname);
  const authCallbackPresent = hasAuthCallbackParams();
  const authCallbackCode = getAuthCallbackCode();

  // Always strip transient authorization parameters after the Supabase PKCE
  // exchange has resolved (session present) or when we are already rendering a
  // stable auth page, so `?code=...&state=...` never persists in the address bar.
  useEffect(() => {
    if (authCallbackCode && session?.user) {
      stripAuthCallbackParams();
    }
  }, [authCallbackCode, session?.user?.id]);

  // Keep the in-memory login flags in sync with the single Supabase auth
  // listener whenever a real Supabase project is configured.
  useEffect(() => {
    if (!isConfigured) return;
    if (!authReady) return;
    if (session?.user) {
      const role = supabaseRole || 'buyer';
      setIsLoggedIn(true);
      setUserRole(role);
      localStorage.setItem('nexora_is_logged_in', 'true');
      if (role) localStorage.setItem('nexora_user_role', role);
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      localStorage.setItem('nexora_is_logged_in', 'false');
      localStorage.removeItem('nexora_user_role');
    }
  }, [isConfigured, authReady, session?.user?.id, supabaseRole]);

  // Demo / local mode fallback keeps the existing offline preview working.
  useEffect(() => {
    if (isConfigured) return;
    const stored = localStorage.getItem('nexora_is_logged_in');
    const storedRole = localStorage.getItem('nexora_user_role');
    setIsLoggedIn(stored === 'true');
    setUserRole(storedRole === 'buyer' || storedRole === 'supplier' ? storedRole : null);
  }, [isConfigured]);

  // PKCE / OAuth callback handling: once a session exists on any /auth/*
  // path, normalize the URL back to the app root to avoid repeat exchanges.
  // This also covers authenticated users landing on /auth/login, preventing
  // the login view from being re-rendered while already signed in (loop guard).
  useEffect(() => {
    if (!session?.user || !isAuthRoute) return;
    window.history.replaceState({}, '', AUTH_LOGIN_PATH.replace('/auth/login', '/'));
    setCurrentScreen('explore');
    stripAuthCallbackParams();
  }, [session?.user?.id, isAuthRoute]);

  const protectedScreens = [
    'buyer-dashboard', 'buyer-profile', 'rfq-tracking', 'buyer-enquiry-log',
    'post-rfq', 'sample-request', 'buyer-onboarding',
    'supplier-portal', 'supplier-verification', 'onboarding',
  ];
  const isProtectedScreen = protectedScreens.includes(currentScreen);

  // Never silently replace protected content with a public screen. A missing or
  // invalid session on a protected screen always enters the explicit login
  // route; redirectToLogin guards /auth/login and throttles repeated attempts.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isProtectedScreen) return;
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isProtectedScreen]);

  // A callback route without a session after auth initialization represents an
  // expired/invalid code (including Supabase ?error= callbacks). Clean the URL
  // and move directly to login instead of leaving an actionable error screen.
  useEffect(() => {
    if (!isConfigured || !authReady || session?.user || !isAuthCallbackPath) return;
    stripAuthCallbackParams();
    redirectToLogin();
  }, [isConfigured, authReady, session?.user?.id, isAuthCallbackPath]);

  if (isConfigured && !authReady) {
    return (
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#b90064] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#594047]">Securing your Nexora session…</p>
        </div>
      </div>
    );
  }

  // Keep callback and protected content covered while the corresponding effect
  // completes its automatic redirect. This prevents an invalid callback error
  // page or protected application content from flashing on screen.
  if (
    isConfigured
    && !session?.user
    && (isAuthCallbackPath || (authReady && isProtectedScreen))
  ) {
    return (
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center p-4 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#b90064] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#594047]">
            {authCallbackPresent && !authReady ? 'Completing secure sign-in…' : 'Redirecting to secure sign-in…'}
          </p>
        </div>
      </div>
    );
  }

  // Explicit /auth/login route. This is also the redirect target for invalid or
  // expired sessions. It renders in-page and normalizes to "/" on success.
  if (isConfigured && isAuthLoginPath) {
    if (!authReady) {
      return (
        <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center p-4 text-center">
          <div className="w-10 h-10 border-4 border-[#b90064] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      );
    }
    if (session?.user) {
      // Already authenticated: the effect below normalizes the URL back to "/".
      return (
        <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center p-4 text-center">
          <div className="w-10 h-10 border-4 border-[#b90064] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#594047] mt-3">Redirecting to Nexora…</p>
        </div>
      );
    }
    return (
      <AuthModal
        isOpen
        isFullPage
        initialMode="login"
        onClose={() => {
          window.history.replaceState({}, '', AUTH_LOGIN_PATH.replace('/auth/login', '/'));
        }}
        onSuccess={(role, isNewUser) => {
          handleLoginSuccess(role, isNewUser);
          window.history.replaceState({}, '', AUTH_LOGIN_PATH.replace('/auth/login', '/'));
        }}
      />
    );
  }

  return (
      <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] flex flex-col font-sans selection:bg-[#fde7f3] selection:text-[#b90064] pb-16 md:pb-0">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Shared Top Navigation Bar */}
      <TopNavBar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenRFQModal={() => handleNavigate('post-rfq')}
        onOpenAuthModal={handleOpenAuthModal}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        userProfile={buyerProfile}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area with Top Spacing to Clear the Fixed Header */}
      <div className="flex-1 flex flex-col pt-20">
        <Breadcrumbs 
          currentScreen={currentScreen} 
          onNavigate={handleNavigate} 
          params={{
            productName: currentScreen === 'product-detail' ? TRENDING_PRODUCTS.find(p => p.id === selectedProductId)?.title : undefined,
            supplierName: currentScreen === 'supplier-profile' ? VERIFIED_SUPPLIERS.find(s => s.id === (selectedSupplierId || searchParams.supplierId))?.name : undefined
          }}
        />
        {/* Screen 01: Homepage / Explore Hub */}
        {currentScreen === 'explore' && (
          <main className="flex-1">
            <HeroSection
              onSearch={(q, cat) => {
                handleSearchSubmit({ query: q, location: cat !== 'All Categories' ? cat : 'All' });
              }}
              onTabChange={(tab) => {
                if (tab === 'Suppliers') {
                  handleNavigate('supplier-directory');
                } else if (tab === 'Brands') {
                  handleNavigate('brands');
                } else if (tab === 'OEM') {
                  handleSearchSubmit({ query: 'OEM', location: 'All India' });
                } else {
                  handleNavigate('plp');
                }
              }}
            />
            
            <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col gap-6">
              {/* Trending Categories Section */}
              <TrendingCategories
                onCategoryClick={(catName) => {
                  if (catName === 'OEM / Private Label' || catName === 'Private Label' || catName === 'OEM') {
                    handleSearchSubmit({ query: 'OEM', location: 'All India' });
                  } else {
                    handleSearchSubmit({ query: catName, location: 'All India' });
                  }
                }}
                onViewAll={() => handleNavigate('plp')}
              />

              {/* Horizontal Auto-Scrolling Top Members / Profiles Bar */}
              <TopProfilesMarqueeBar
                onNavigateProfile={(roleType, profileId, memberData) => {
                  if (roleType === 'supplier') {
                    handleNavigate('supplier-profile', { supplierId: profileId, memberData });
                  } else {
                    handleNavigate('buyer-profile', { buyerId: profileId, memberData });
                  }
                }}
                onOpenWhatsApp={(phone, name) => {
                  handleWhatsAppSupplier(name);
                }}
              />

              {/* Marketplace Discovery Blocks (Featured Suppliers & Trending Sourcing) */}
              <MarketplaceColumns
                onSupplierClick={(id) => handleNavigate('supplier-profile', { supplierId: id })}
                onProductClick={(id) => handleNavigate('product-detail', { productId: id })}
                onEnquiryClick={(data) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: data.title,
                    supplierName: data.supplier,
                    type: data.type === 'supplier' ? 'supplier' : 'product',
                  });
                }}
                onViewAllSuppliers={() => handleNavigate('supplier-directory')}
                onViewAllProducts={() => handleNavigate('plp')}
              />

              {/* Sponsored Beauty Showcase (10 Sponsored Image Ads Marquee) */}
              <SponsoredImageAds
                onProductClick={(ad) => {
                  handleNavigate('product-detail', { productId: ad.product_id, supplierId: ad.seller_id });
                }}
                onSupplierClick={(supplierId) => {
                  handleNavigate('supplier-profile', { supplierId });
                }}
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onOpenChat={handleOpenChat}
              />

              {/* Reels & Shorts (5 Sponsored 9:16 Video Ads) */}
              <SponsoredReelsSection
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onViewProduct={(productId, sellerId) => {
                  handleNavigate('product-detail', { productId, supplierId: sellerId });
                }}
                onViewSupplier={(sellerId) => {
                  handleNavigate('supplier-profile', { supplierId: sellerId });
                }}
                onEnquire={(productId, sellerId, supplierName) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: 'Enquiry for ' + supplierName,
                    supplierName,
                    type: productId ? 'product' : 'supplier',
                  });
                }}
              />

              {/* Full Video Ads (5 Sponsored 16:9 Video Ads) */}
              <SponsoredFullVideoSection
                onOpenAdManager={() => handleNavigate('supplier-portal')}
                onViewProduct={(productId, sellerId) => {
                  handleNavigate('product-detail', { productId, supplierId: sellerId });
                }}
                onViewSupplier={(sellerId) => {
                  handleNavigate('supplier-profile', { supplierId: sellerId });
                }}
                onEnquire={(productId, sellerId, supplierName) => {
                  handleOpenEnquiry({
                    id: 'enq-' + Date.now(),
                    title: 'Enquiry for ' + supplierName,
                    supplierName,
                    type: productId ? 'product' : 'supplier',
                  });
                }}
              />

              {/* OEM / Private Label Spotlight */}
              <OEMSpotlight
                onExploreSolutions={() => handleNavigate('plp')}
                onPostRequirement={() => handleNavigate('post-rfq')}
              />

              {/* Seller / Supplier Growth Block */}
              <SellerGrowthSection
                onJoinSupplier={() => handleNavigate('onboarding')}
                onSupplierLogin={() => handleOpenAuthModal('login')}
              />
            </div>
          </main>
        )}

        {/* Screen 03: Product Listing Page (PLP) */}
        {currentScreen === 'plp' && (
          <main className="flex-1">
            <ProductListingScreen
              isLoggedIn={isLoggedIn}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSearch={handleNavigate}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenProductComparison={() => {}}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
            />
          </main>
        )}

        {/* Screen 02: Global Search & Filter Results (Unified) */}
        {currentScreen === 'search-results' && (
          <main className="flex-1">
            <SearchFilterScreen
              initialQuery={searchParams.query}
              initialCategory={searchParams.category}
              initialLocation={searchParams.location}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onNavigate={handleNavigate}
            />
          </main>
        )}

        {/* Screen 04: Product Detail Page */}
        {currentScreen === 'product-detail' && (
          <main className="flex-1">
            <ProductDetailPage
              productId={selectedProductId}
              onBack={() => handleNavigate('explore')}
              onOpenEnquiryModal={(item) => {
                handleOpenEnquiry({
                  id: 'enq-' + Date.now(),
                  title: item.name,
                  supplierName: item.supplierName,
                  type: 'product'
                });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToSampleRequest={() => handleNavigate('sample-request')}
              onNavigateToSupplierProfile={(supplierId) => {
                handleNavigate('supplier-profile', { supplierId });
              }}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onOpenChat={handleOpenChat}
            />
          </main>
        )}

        {/* Screen 06: Directory Hub */}
        {currentScreen === 'directory' && (
          <main className="flex-1">
            <DirectoryHubScreen
              onNavigate={handleNavigate}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
            />
          </main>
        )}

        {/* Screen 06 List: Supplier Directory */}
        {currentScreen === 'supplier-directory' && (
          <main className="flex-1">
            <SupplierDirectoryScreen
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={() => {}}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
            />
          </main>
        )}

        {/* Screen 07: Dedicated Seller Profile / Mini-Website Page */}
        {currentScreen === 'supplier-profile' && (
          <main className="flex-1">
            <SellerProfileScreen
              sellerId={selectedSupplierId || searchParams.supplierId}
              isLoggedIn={isLoggedIn}
              onBack={() => handleNavigate('explore')}
              onNavigateToProductDetail={(productId) => handleNavigate('product-detail', { productId })}
              onOpenAuth={() => handleOpenAuthModal('login')}
              onOpenEnquiryModal={handleOpenEnquiry}
              onOpenQuoteModal={(suppName) => handleNavigate('post-rfq', { supplierName: suppName })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
            />
          </main>
        )}

        {/* Screen 08: Brand Directory */}
        {currentScreen === 'brands' && (
          <main className="flex-1">
            <BrandDirectoryDetailScreen
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenFacilityTour={() => {}}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Screen 09: OEM / Private Label Hub */}
        {currentScreen === 'oem-hub' && (
          <main className="flex-1">
            <OemPrivateLabelHubScreen
              onOpenRFQModal={() => handleNavigate('post-rfq')}
              onOpenEnquiryModal={(prodName, suppName) => {
                handleOpenEnquiry({ name: prodName, supplierName: suppName });
              }}
              onOpenFacilityTour={() => {}}
              onNavigateToSuppliers={() => handleNavigate('supplier-directory')}
              onNavigateToSupplierProfile={(supplierId) => handleNavigate('supplier-profile', { supplierId })}
            />
          </main>
        )}

        {/* Phase A: Buyer Onboarding Flow */}
        {currentScreen === 'buyer-onboarding' && (
          <main className="flex-1">
            <BuyerOnboardingScreen
              onComplete={(data) => {
                handleSaveProfile({
                  ...buyerProfile,
                  businessName: data.businessName,
                  businessType: data.buyerCategory,
                  designation: data.designation,
                  gstin: data.gstNumber,
                  annualProcurementBudget: data.annualBudget,
                  primaryCategories: data.primaryCategories,
                  city: data.location.split(',')[0] || '',
                  state: data.location.split(',')[1]?.trim() || '',
                });
                handleNavigate('buyer-dashboard');
              }}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}

        {/* Phase B: Supplier Onboarding Flow */}
        {currentScreen === 'onboarding' && (
          <main className="flex-1">
            <SupplierOnboardingScreen
              authenticated={isLoggedIn && userRole === 'supplier'}
              onComplete={() => {
                triggerToast('Business listing created! Redirecting to Portal...');
                handleNavigate('supplier-portal');
              }}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}

        {/* Phase B: Supplier Admin Portal */}
        {currentScreen === 'supplier-portal' && (
          <main className="flex-1">
            <SupplierAdminPortal 
              onNavigateToProduct={(productId) => {
                setSelectedProductId(productId);
                handleNavigate('product-detail', { productId });
              }}
            />
          </main>
        )}

        {/* Screen 24: Supplier Verification Center */}
        {currentScreen === 'supplier-verification' && (
          <main className="flex-1">
            <SupplierVerificationScreen 
              onBack={() => handleNavigate('supplier-portal')}
            />
          </main>
        )}

        {/* Screen 12: Buyer Dashboard */}
        {currentScreen === 'buyer-dashboard' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab={buyerDashboardTab}
              isProfileRoute={false}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Specific /buyer/profile Route View */}
        {currentScreen === 'buyer-profile' && (
          <main className="flex-1">
            <BuyerDashboard 
              isLoggedIn={isLoggedIn}
              onNavigate={handleNavigate}
              onPostRFQ={() => handleNavigate('post-rfq')}
              onCallSupplier={handleCallSupplier}
              onWhatsAppSupplier={handleWhatsAppSupplier}
              onOpenAuth={() => handleOpenAuthModal('login')}
              buyerProfile={buyerProfile}
              onSaveProfile={handleSaveProfile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              initialTab="activity"
              isProfileRoute={true}
              currentScreen={currentScreen}
            />
          </main>
        )}

        {/* Screen 13: Buyer RFQ Tracking & Quote Comparison */}
        {currentScreen === 'rfq-tracking' && (
          <main className="flex-1">
            <BuyerRFQTrackingScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierIdOrName) => {
                const supp = VERIFIED_SUPPLIERS.find(s => 
                  s.name.toLowerCase().includes(supplierIdOrName.toLowerCase()) || 
                  s.id === supplierIdOrName
                );
                handleOpenChat(
                  {
                    id: supp?.id || 'supp-rfq',
                    name: supp?.name || supplierIdOrName,
                    location: supp ? `${supp.city}${supp.state ? `, ${supp.state}` : ''}` : 'India',
                    isVerified: supp ? supp.isVerified : true
                  },
                  { title: 'Vitamin C Brightening Serum (Bulk)', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', price: '₹195 / unit', moq: '2,000 Units' }
                );
              }}
            />
          </main>
        )}

        {/* Sample Request Screen */}
        {currentScreen === 'sample-request' && (
          <main className="flex-1">
            <SampleRequestScreen 
              onBack={() => handleNavigate('search-results')}
              onSubmit={(data) => {
                console.log('Sample Request Submitted:', data);
                handleNavigate('buyer-dashboard');
              }}
            />
          </main>
        )}

        {/* Screen 10: Post Requirement / Public RFQ Form */}
        {currentScreen === 'post-rfq' && (
          <main className="flex-1">
            <PostRequirementScreen
              onNavigateToExplore={() => handleNavigate('explore')}
              onNavigateToRFQs={() => handleNavigate('rfq-tracking')}
            />
          </main>
        )}

        {/* Screen 14: Buyer Enquiry Log */}
        {currentScreen === 'buyer-enquiry-log' && (
          <main className="flex-1">
            <BuyerEnquiryLogScreen
              onBack={() => handleNavigate('buyer-dashboard')}
              onNavigateToChat={(supplierName) => handleOpenChat({ id: 'supp_custom', name: supplierName, location: 'All India', isVerified: true })}
              onCallSupplier={(name) => handleCallSupplier(name)}
              onWhatsAppSupplier={(name) => handleWhatsAppSupplier(name)}
              onNavigateToExplore={() => handleNavigate('explore')}
            />
          </main>
        )}
      </div>

      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => {
          setIsEnquiryModalOpen(false);
          setTargetEnquiryItem(null);
        }}
        targetItem={targetEnquiryItem}
        buyerProfile={buyerProfile}
        onCallSupplier={handleCallSupplier}
        onWhatsAppSupplier={handleWhatsAppSupplier}
        onNavigateToDashboard={() => {
          setIsEnquiryModalOpen(false);
          handleNavigate('buyer-enquiry-log');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={buyerProfile}
        onSave={handleSaveProfile}
      />

      <ChatModalDrawer
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        initialSupplier={chatInitialSupplier}
        initialProduct={chatInitialProduct}
      />

      <DatabaseStatusModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onNavigateToScreen={(screen) => handleNavigate(screen)}
      />

      {/* Shared Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenRFQModal={() => handleNavigate('post-rfq')}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onOpenAuth={handleOpenAuthModal}
      />

      {/* Floating Action Button (FAB) for Phase 4 Relational Database Inspector */}
      <button
        id="fab-db-inspector"
        aria-label="Toggle Phase 4 Database Schema & Live Engine Inspector"
        title={isLoggedIn && locationSyncStatus === 'synced'
          ? 'Phase 4 Relational Database Inspector & Live Location Synced'
          : 'Phase 4 Relational Database Inspector (8 Entities & Live Event Engine)'}
        onClick={() => setIsDatabaseModalOpen(prev => !prev)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-[#1C1B1B] hover:bg-[#B90064] text-white py-2.5 px-3.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 cursor-pointer border border-white/20 group"
      >
        <div className="relative">
          <Database className="w-4 h-4 text-[#FDE7F3] group-hover:text-white" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="hidden sm:inline">DB Inspector</span>
        <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono">8 Tables</span>
      </button>

      </div>
  );
}

export function App() {
  return (
    <SupabaseProvider>
      <NexoraShopApp />
    </SupabaseProvider>
  );
}
export default App;
