import { useState, useEffect, useMemo, useRef } from 'react';
import { Copy } from 'lucide-react';
import { Package, Service, StaffStatus } from '../../types';
import { normalizeThemeId } from '../../lib/themeServices';
import { TAGLINE_CATEGORIES } from '../../lib/websiteCustomization';
import { readOwnerPhotoAsDataUrl, validateOwnerPhoto } from '../../lib/ownerProfile';
import { videoLikeBusinessId, weeklyTopVideos } from '../../lib/videoLikes';
import { SiteHeaderThemeId } from '../../lib/siteNavigation';
import { BookingActorContext, resolveBookingActor } from '../../lib/bookingManagement';
import { bookingBusinessId } from '../../lib/siteBookingFlow';
import { useAuth } from '../../lib/useAuth';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { resolveOwnerSalonId } from '../../lib/ownerSalon';
import { videoGalleryChrome } from '../../lib/siteVideoGalleryI18n';
import { useSiteLocale } from '../../components/SiteHeader';
import type { DashboardContextValue } from './DashboardContext';
import type { LandingProps, Appointment } from './types';
import { useBrandConfig } from '../../config/brandConfig';

/**
 * All owner-dashboard state and handlers, moved verbatim from the original
 * Landing.tsx monolith. DashboardScreen is a thin shell around this hook;
 * every lazy tab + modal consumes the returned value via DashboardContext.
 */
export default function useDashboardState({ data, setData, goToStep, onOpenStaffManagement, onThemeChange, forcedActiveTab, onTabChange }: LandingProps): DashboardContextValue {
  const { platform, defaultSalon } = useBrandConfig();

  const [internalTab, setInternalTab] = useState<'overview' | 'website' | 'services' | 'bookings' | 'staff' | 'payments' | 'share' | 'settings' | 'referral' | 'branding'>('overview');
  const activeTab = forcedActiveTab ?? internalTab;
  const setActiveTab = (tab: 'overview' | 'website' | 'services' | 'bookings' | 'staff' | 'payments' | 'share' | 'settings' | 'referral' | 'branding') => {
    if (onTabChange) onTabChange(tab);
    if (!forcedActiveTab) setInternalTab(tab);
  };
  useEffect(() => {
    if (forcedActiveTab) setInternalTab(forcedActiveTab);
  }, [forcedActiveTab]);
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  
  // Local state for appointments to make the dashboard fully dynamic
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'a1',
      time: '10:30 AM',
      customerName: 'Neha Sharma',
      phone: '+91 99887 76655',
      serviceId: '2',
      serviceName: 'Nourishing Hair Spa',
      staffId: 't2',
      staffName: 'Ananya Verma',
      price: 900,
      depositPaid: 225,
      status: 'Confirmed'
    },
    {
      id: 'a2',
      time: '12:00 PM',
      customerName: 'Amit Patel',
      phone: '+91 91122 33445',
      serviceId: '1',
      serviceName: 'Haircut & Blow-Dry Styling',
      staffId: 't1',
      staffName: 'Rahul Sharma',
      price: 350,
      depositPaid: 0,
      status: 'Pending'
    },
    {
      id: 'a3',
      time: '02:30 PM',
      customerName: 'Deepika Rao',
      phone: '+91 98888 77777',
      serviceId: '5',
      serviceName: 'HD Bridal Makeup & Styling',
      staffId: 't3',
      staffName: 'Priya Patel',
      price: 4500,
      depositPaid: 1125,
      status: 'Confirmed'
    },
    {
      id: 'a4',
      time: '04:00 PM',
      customerName: 'Vikram Malhotra',
      phone: '+91 96655 44332',
      serviceId: '2',
      serviceName: 'Nourishing Hair Spa',
      staffId: 't4',
      staffName: 'Vikram Singh',
      price: 900,
      depositPaid: 225,
      status: 'Confirmed'
    }
  ]);

  // Modals state
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveSiteModal, setShowLiveSiteModal] = useState(false);

  // New Appointment Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newSelectedService, setNewSelectedService] = useState(data.services[0]?.id || '');
  const [newSelectedStaff, setNewSelectedStaff] = useState(data.team[0]?.id || '');
  const [newSelectedTime, setNewSelectedTime] = useState('11:00 AM');

  // New Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Hair Styling');
  const [newServicePrice, setNewServicePrice] = useState(400);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceFeatured, setNewServiceFeatured] = useState(false);

  // Advanced Services State
  const [servicesSubTab, setServicesSubTab] = useState<'services' | 'packages'>('services');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesSelectedCategory, setServicesSelectedCategory] = useState('All Categories');
  const [servicesViewLayout, setServicesViewLayout] = useState<'list' | 'grid'>('list');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);
  const [showPackageDrawer, setShowPackageDrawer] = useState(false);
  const [isImprovingWithAI, setIsImprovingWithAI] = useState(false);

  // New Package Form State
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState(1200);
  const [newPackageDuration, setNewPackageDuration] = useState(60);
  const [newPackageDesc, setNewPackageDesc] = useState('');

  // Voice Quick-Add State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // AI Suggestions State
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [aiSuggestArchetype, setAiSuggestArchetype] = useState<'luxury' | 'barber' | 'spa' | 'beauty'>('luxury');
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<Service[]>([]);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  // Notifications list
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'New booking request from Amit Patel', time: '10 mins ago', read: false },
    { id: 'n2', text: 'Advance payment received for Deepika Rao', time: '1 hour ago', read: true },
    { id: 'n3', text: 'Ananya Verma changed status to Available', time: '2 hours ago', read: true }
  ]);

  // Payments tab filters & drawer state
  const [paymentsFilter, setPaymentsFilter] = useState<'All'|'Verified'|'Pending'|'Failed'|'Refunded'>('All');
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('a1');

  const liveSlug = data.websiteSlug || defaultSalon.slug || 'royal-hair-studio';
  const liveUrl = `${platform.websiteUrl.replace(/^https?:\/\//, '')}/${liveSlug}`;

  const [polishingField, setPolishingField] = useState<'tagline' | 'about' | 'bio' | null>(null);
  const [polishingStatus, setPolishingStatus] = useState<string>('');
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);
  const [ownerPhotoError, setOwnerPhotoError] = useState<string | null>(null);
  const [ownerPhotoBusy, setOwnerPhotoBusy] = useState(false);
  const [taglineCategory, setTaglineCategory] = useState('Salon');
  const [taglineSubcategory, setTaglineSubcategory] = useState('Hair Salon');
  const taglineOptions = useMemo(
    () => TAGLINE_CATEGORIES[taglineCategory]?.[taglineSubcategory] || TAGLINE_CATEGORIES.Salon['Hair Salon'],
    [taglineCategory, taglineSubcategory],
  );

  // PHASE 15.9 — Weekly Top Videos (reuse Phase 15.8 engine, strict theme isolation)
  const currentThemeId = normalizeThemeId(data.templateId) as SiteHeaderThemeId;
  const dashboardWeeklyTop = useMemo(() => {
    const businessId = videoLikeBusinessId(data);
    return weeklyTopVideos(businessId, currentThemeId, data, { limit: 6 });
  }, [data, currentThemeId]);

  const locale = useSiteLocale();
  const chrome = videoGalleryChrome(currentThemeId, locale);

  // PHASE 16.7 — booking-management actor: the EXISTING session → ownership
  // chain (useAuth + resolveOwnerSalonId). The panel receives the resolved
  // permission; the data layer re-checks it on every read/mutation. The
  // tenant key is the same bookingBusinessId every booking row was stamped
  // with — never typed in, never taken from the URL.
  const { user: authUser, loading: authLoading } = useAuth();
  const [bookingActor, setBookingActor] = useState<BookingActorContext>(() =>
    resolveBookingActor({ supabaseConfigured: isSupabaseConfigured, userPresent: false, resolution: null }),
  );
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBookingActor(resolveBookingActor({ supabaseConfigured: false, userPresent: false, resolution: null }));
      return;
    }
    if (authLoading) return;
    let cancelled = false;
    resolveOwnerSalonId()
      .then((resolution) => {
        if (cancelled) return;
        setBookingActor(resolveBookingActor({ supabaseConfigured: true, userPresent: !!authUser, resolution }));
      })
      .catch(() => {
        if (cancelled) return;
        setBookingActor(resolveBookingActor({ supabaseConfigured: true, userPresent: !!authUser, resolution: { status: 'error' } }));
      });
    return () => { cancelled = true; };
  }, [authUser, authLoading]);
  const bookingTenantId = bookingBusinessId(data);
  const [bookingToast, setBookingToast] = useState<string | null>(null);
  useEffect(() => {
    if (!bookingToast) return;
    const id = window.setTimeout(() => setBookingToast(null), 2500);
    return () => window.clearTimeout(id);
  }, [bookingToast]);

  const handleOwnerPhotoFile = async (file: File | undefined) => {
    if (!file) return;
    const error = validateOwnerPhoto(file);
    if (error) {
      setOwnerPhotoError(error);
      return;
    }
    setOwnerPhotoBusy(true);
    setOwnerPhotoError(null);
    try {
      const url = await readOwnerPhotoAsDataUrl(file);
      setData(prev => ({ ...prev, ownerPhotoUrl: url }));
    } catch {
      setOwnerPhotoError('Could not read that photo. Try another image.');
    } finally {
      setOwnerPhotoBusy(false);
      if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = '';
    }
  };

  const handleRemoveOwnerPhoto = () => {
    setData(prev => ({ ...prev, ownerPhotoUrl: '' }));
    setOwnerPhotoError(null);
    if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = '';
  };

  const updateTagline = (tagline: string) => {
    setData(prev => ({
      ...prev,
      tagline,
      reviewedContent: prev.reviewedContent
        ? { ...prev.reviewedContent, tagline }
        : prev.reviewedContent,
    }));
  };

  const handlePolishText = (field: 'tagline' | 'about' | 'bio', tone: 'luxury' | 'modern' | 'warm') => {
    setPolishingField(field);
    setPolishingStatus('🤖 Gemini AI analyzing your request...');
    
    setTimeout(() => {
      setPolishingStatus('🤖 Matching brand archetype and tone...');
    }, 400);

    setTimeout(() => {
      setPolishingStatus('🤖 Perfecting copy structure...');
    }, 800);

    setTimeout(() => {
      let resultText = '';
      if (field === 'tagline') {
        if (tone === 'luxury') resultText = `Experience Premium Hair Artistry & Elite Aesthetic Excellence`;
        else if (tone === 'modern') resultText = `Bespoke Styling, Precision Cuts & Trendsetting Hair Design`;
        else resultText = `Your Sanctuary for Beautiful Hair & Warm, Personal Care`;
        
        updateTagline(resultText);
      } else if (field === 'about') {
        if (tone === 'luxury') resultText = `Welcome to an elevated realm of salon luxury. We blend master techniques, premium formulations, and bespoke styling to craft an unforgettable aesthetic experience customized for your lifestyle.`;
        else if (tone === 'modern') resultText = `We are a high-energy creative collective redefining hair fashion. Specializing in precision styling, multi-dimensional hair coloring, and advanced hair rejuvenation therapies for the modern individual.`;
        else resultText = `Step into a friendly, welcoming neighborhood retreat where your comfort comes first. We focus on attentive, personal styling and gentle treatments that leave you feeling perfectly cared for.`;
        
        setData(prev => ({ ...prev, about: resultText }));
      } else if (field === 'bio') {
        if (tone === 'luxury') resultText = `Dedicated to bespoke hair couture and artistic mentorship. Bringing a decade of luxury salon expertise, our goal is to design highly individualized transformations in an atmosphere of elite comfort.`;
        else if (tone === 'modern') resultText = `Passionate about trend-forward styling and pushing creative boundaries. With 8+ years of technical artistry, we love designing bold, signature hair statements and building inspiring beauty spaces.`;
        else resultText = `With a belief that great hair starts with a great connection. Friendly, expert advice and customized styling designed to fit your day-to-day routine beautifully.`;
        
        setData(prev => ({ 
          ...prev, 
          reviewedContent: { 
            ...(prev.reviewedContent || { heroHeadline: '', tagline: '', about: '', serviceDescriptions: {}, bookingCTA: '' }), 
            ownerIntro: resultText 
          } 
        }));
      }

      setPolishingField(null);
      setPolishingStatus('');
      
      setNotifications(prev => [
        { id: `n-ai-${Date.now()}`, text: `AI updated ${field} with ${tone} style!`, time: 'Just now', read: false },
        ...prev
      ]);
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${liveUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const serv = data.services.find(s => s.id === newSelectedService) || data.services[0];
    const provider = data.team.find(t => t.id === newSelectedStaff) || data.team[0];
    const depositPct = 25;
    const price = serv ? serv.price : 400;
    const deposit = Math.round((price * depositPct) / 100);

    const newAppt: Appointment = {
      id: `a-${Date.now()}`,
      time: newSelectedTime,
      customerName: newCustName,
      phone: newCustPhone || '+91 99999 88888',
      serviceId: newSelectedService,
      serviceName: serv ? serv.name : 'Custom Treatment',
      staffId: newSelectedStaff,
      staffName: provider ? provider.name : 'Any Stylist',
      price,
      depositPaid: deposit,
      status: 'Confirmed'
    };

    setAppointments(prev => [newAppt, ...prev]);
    
    // Add a notification
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Appointment scheduled for ${newCustName}`, time: 'Just now', read: false },
      ...prev
    ]);

    // Reset Form
    setNewCustName('');
    setNewCustPhone('');
    setShowNewAppointmentModal(false);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    if (editingService) {
      // Edit mode
      setData(prev => ({
        ...prev,
        services: prev.services.map(s => s.id === editingService.id ? {
          ...s,
          name: newServiceName,
          category: newServiceCategory,
          price: Number(newServicePrice),
          duration: Number(newServiceDuration),
          description: newServiceDesc,
          featured: newServiceFeatured
        } : s)
      }));
      setNotifications(prev => [
        { id: `n-${Date.now()}`, text: `Updated service: ${newServiceName}`, time: 'Just now', read: false },
        ...prev
      ]);
    } else {
      // Add mode
      const newServ: Service = {
        id: `s-${Date.now()}`,
        name: newServiceName,
        category: newServiceCategory,
        price: Number(newServicePrice),
        duration: Number(newServiceDuration),
        description: newServiceDesc || 'Professional treatment tailored for you.',
        featured: newServiceFeatured
      };
      setData(prev => ({
        ...prev,
        services: [...prev.services, newServ]
      }));
      setNotifications(prev => [
        { id: `n-${Date.now()}`, text: `Added new service: ${newServiceName}`, time: 'Just now', read: false },
        ...prev
      ]);
    }

    // Reset and Close
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceFeatured(false);
    setEditingService(null);
    setShowServiceDrawer(false);
  };

  const handleDuplicateService = (serv: Service) => {
    const duplicated: Service = {
      ...serv,
      id: `s-${Date.now()}`,
      name: `${serv.name} (Copy)`
    };
    setData(prev => ({
      ...prev,
      services: [...prev.services, duplicated]
    }));
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Duplicated service: ${serv.name}`, time: 'Just now', read: false },
      ...prev
    ]);
  };

  const handleDeleteService = (id: string, name: string) => {
    setData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== id)
    }));
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Removed service: ${name}`, time: 'Just now', read: false },
      ...prev
    ]);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackageName.trim()) return;

    if (editingPackage) {
      setData(prev => ({
        ...prev,
        packages: (prev.packages || []).map(p => p.id === editingPackage.id ? {
          ...p,
          name: newPackageName,
          price: Number(newPackagePrice),
          duration: Number(newPackageDuration),
          description: newPackageDesc
        } : p)
      }));
      setNotifications(prev => [
        { id: `n-${Date.now()}`, text: `Updated package: ${newPackageName}`, time: 'Just now', read: false },
        ...prev
      ]);
    } else {
      const newPkg: Package = {
        id: `pkg-${Date.now()}`,
        name: newPackageName,
        price: Number(newPackagePrice),
        duration: Number(newPackageDuration),
        description: newPackageDesc || 'Professional package combo tailored for you.'
      };
      setData(prev => ({
        ...prev,
        packages: [...(prev.packages || []), newPkg]
      }));
      setNotifications(prev => [
        { id: `n-${Date.now()}`, text: `Added new package: ${newPackageName}`, time: 'Just now', read: false },
        ...prev
      ]);
    }

    setNewPackageName('');
    setNewPackageDesc('');
    setEditingPackage(null);
    setShowPackageDrawer(false);
  };

  const handleDuplicatePackage = (pkg: Package) => {
    const duplicated: Package = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      name: `${pkg.name} (Copy)`
    };
    setData(prev => ({
      ...prev,
      packages: [...(prev.packages || []), duplicated]
    }));
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Duplicated package: ${pkg.name}`, time: 'Just now', read: false },
      ...prev
    ]);
  };

  const handleDeletePackage = (id: string, name: string) => {
    setData(prev => ({
      ...prev,
      packages: (prev.packages || []).filter(p => p.id !== id)
    }));
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Removed package: ${name}`, time: 'Just now', read: false },
      ...prev
    ]);
  };

  const handleImproveDescriptionWithAI = () => {
    if (!newServiceName.trim()) {
      alert('Please enter a service name first so AI can generate a description!');
      return;
    }
    setIsImprovingWithAI(true);
    setTimeout(() => {
      let aiDesc = '';
      const nameLower = newServiceName.toLowerCase();
      if (nameLower.includes('haircut') || nameLower.includes('cut')) {
        aiDesc = 'A bespoke premium haircut tailored specifically to your facial features and hair texture. Includes an indulgent clarifying hair wash, signature scalp massage, and professional blow-dry styling.';
      } else if (nameLower.includes('color') || nameLower.includes('balayage') || nameLower.includes('highlight')) {
        aiDesc = 'Transformative multi-dimensional hair coloring designed by our master colorists. Features custom painted highlights, gentle conditioning glaze treatments, and premium nourishment for radiant longevity.';
      } else if (nameLower.includes('massage') || nameLower.includes('spa')) {
        aiDesc = 'A deeply therapeutic and rejuvenating massage session combining sensory essential oils, gentle pressure, and calming aromatherapy techniques to relieve tension and melt away everyday stress.';
      } else if (nameLower.includes('facial') || nameLower.includes('skin') || nameLower.includes('cleanup')) {
        aiDesc = 'An advanced custom facial treatment that deeply cleanses, gently exfoliates, and intensely hydrates your skin. Formulated with premium botanical extracts and custom massage to restore absolute radiance.';
      } else if (nameLower.includes('shave') || nameLower.includes('beard') || nameLower.includes('groom')) {
        aiDesc = 'A premium hot towel shave and detail beard sculpting. Complete with nourishing luxury beard oil massage, precision line razor finish, and a refreshing face massage.';
      } else {
        aiDesc = `An elite, signature ${newServiceName} session crafted by our certified senior specialists. Utilizing state-of-the-art formulations and personalized care to ensure absolute excellence.`;
      }
      setNewServiceDesc(aiDesc);
      setIsImprovingWithAI(false);
    }, 1000);
  };

  const handleImprovePackageDescWithAI = () => {
    if (!newPackageName.trim()) {
      alert('Please enter a package name first!');
      return;
    }
    setIsImprovingWithAI(true);
    setTimeout(() => {
      let aiDesc = `The ultimate premium bundle combining our signature treatments into one seamless, luxurious experience. Enjoy personalized care, dedicated styling, and premium refreshments during your stay.`;
      setNewPackageDesc(aiDesc);
      setIsImprovingWithAI(false);
    }, 1000);
  };

  const handleParseVoiceCommand = () => {
    if (!voiceInputText.trim()) return;
    
    const text = voiceInputText.toLowerCase();
    
    // 1. Extract Price (numeric value)
    const priceMatch = text.match(/(?:for|at|rs\.?|₹|inr)\s*(\d+)/) || text.match(/(\d+)\s*(?:rupees|inr|rs|bucks)/);
    const price = priceMatch ? Number(priceMatch[1]) : 500;
    
    // 2. Extract Duration (minutes or hours)
    let duration = 45;
    const hourMatch = text.match(/(\d+)\s*(?:hour|hr)/);
    if (hourMatch) {
      duration = Number(hourMatch[1]) * 60;
    } else {
      const minMatch = text.match(/(\d+)\s*(?:min|minute)/);
      if (minMatch) {
        duration = Number(minMatch[1]);
      }
    }
    
    // 3. Extract Category
    let category = 'Hair Styling';
    if (text.includes('spa') || text.includes('massage') || text.includes('therapy')) {
      category = 'Wellness';
    } else if (text.includes('barber') || text.includes('shave') || text.includes('beard')) {
      category = 'Barber';
    } else if (text.includes('color') || text.includes('highlight') || text.includes('dye')) {
      category = 'Hair Coloring';
    } else if (text.includes('cut') || text.includes('trim')) {
      category = 'Haircut';
    } else if (text.includes('facial') || text.includes('skin') || text.includes('makeup') || text.includes('manicure') || text.includes('pedicure') || text.includes('nails')) {
      category = 'Beauty';
    }
    
    // 4. Extract Name
    let name = voiceInputText;
    const separators = [' for ', ' taking ', ' of ', ' costing ', ' with '];
    for (const sep of separators) {
      if (text.includes(sep)) {
        const parts = voiceInputText.split(new RegExp(sep, 'i'));
        if (parts[0].trim()) {
          name = parts[0].trim();
          break;
        }
      }
    }
    
    name = name.replace(/^(add a|add|create a|create)\s+/i, '');
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    const voiceService: Service = {
      id: `s-${Date.now()}`,
      name,
      category,
      price,
      duration,
      description: `Quick-added via Voice command: "${voiceInputText}"`
    };
    
    setData(prev => ({
      ...prev,
      services: [...prev.services, voiceService]
    }));
    
    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Voice Added: ${name} (₹${price})`, time: 'Just now', read: false },
      ...prev
    ]);
    
    setShowVoiceModal(false);
    setVoiceInputText('');
  };

  const handleTriggerSuggestions = (archetype: 'luxury' | 'barber' | 'spa' | 'beauty') => {
    setIsGeneratingSuggestions(true);
    setAiSuggestArchetype(archetype);
    
    setTimeout(() => {
      let suggestions: Service[] = [];
      if (archetype === 'luxury') {
        suggestions = [
          {
            id: `s-sug-${Date.now()}-1`,
            name: 'Signature Balayage & Gloss',
            category: 'Hair Coloring',
            price: 3200,
            duration: 150,
            description: 'Custom multi-dimensional hand-painted highlights with premium tone seal glaze and luxury mask treatment.',
            featured: true
          },
          {
            id: `s-sug-${Date.now()}-2`,
            name: 'Keratin Silk Smoothing Therapy',
            category: 'Treatment',
            price: 4500,
            duration: 180,
            description: 'Intense organic protein restructuring treatment that completely eliminates frizz and restores luminous shine.'
          },
          {
            id: `s-sug-${Date.now()}-3`,
            name: 'Olaplex Bond-Repair Spa',
            category: 'Treatment',
            price: 1500,
            duration: 45,
            description: 'Scientific active bond repair spa to reverse extreme heat and chemical color damage, strengthening core fibers.'
          },
          {
            id: `s-sug-${Date.now()}-4`,
            name: 'Master Precision Hair Sculpture',
            category: 'Haircut',
            price: 850,
            duration: 45,
            description: 'Exquisite custom tailored scissor haircut designed for your facial bone structure and texture profile.'
          }
        ];
      } else if (archetype === 'barber') {
        suggestions = [
          {
            id: `s-sug-${Date.now()}-1`,
            name: 'Royal Charcoal Facial & Hot Towel Shave',
            category: 'Barber',
            price: 750,
            duration: 45,
            description: 'Exfoliating activated charcoal scrub followed by an ultra-smooth warm straight razor shave with essential oil mist.',
            featured: true
          },
          {
            id: `s-sug-${Date.now()}-2`,
            name: 'Elite Beard Sculpting & Straight Razor Line',
            category: 'Barber',
            price: 400,
            duration: 25,
            description: 'Detailed beard scissor tapering, clipper blending, and sharp razor definition with premium sandalwood oil.'
          },
          {
            id: `s-sug-${Date.now()}-3`,
            name: 'Slick Skin Fade & Styling',
            category: 'Barber',
            price: 550,
            duration: 40,
            description: 'Precision zero skin fade or razor taper with custom wash, scalp tonic, and premium matte clay styling.'
          },
          {
            id: `s-sug-${Date.now()}-4`,
            name: 'Scalp Massage & Tonic Energizer',
            category: 'Barber',
            price: 300,
            duration: 15,
            description: 'Invigorating menthol shampoo wash accompanied by a high-pressure hand scalp stimulation and follicle energizer.'
          }
        ];
      } else if (archetype === 'spa') {
        suggestions = [
          {
            id: `s-sug-${Date.now()}-1`,
            name: 'Aromatherapy Balinese Full Body Massage',
            category: 'Wellness',
            price: 2200,
            duration: 60,
            description: 'Deep pressure palm strokes and skin rolling utilizing organic pure lavender and lemongrass oils.',
            featured: true
          },
          {
            id: `s-sug-${Date.now()}-2`,
            name: 'Exfoliating Himalayan Salt Scrub',
            category: 'Wellness',
            price: 1600,
            duration: 45,
            description: 'Mineral-rich rose pink salt body scrub to renew dead cells, finish with lightweight sweet almond hydration.'
          },
          {
            id: `s-sug-${Date.now()}-3`,
            name: 'De-Stress Indian Head Massage',
            category: 'Wellness',
            price: 800,
            duration: 30,
            description: 'Focused pressure point massage on shoulders, neck, and scalp with warm coconut oil to cure insomnia.'
          },
          {
            id: `s-sug-${Date.now()}-4`,
            name: 'Hydrating Botanical Facial',
            category: 'Wellness',
            price: 1800,
            duration: 60,
            description: 'Nourishing custom skincare facial utilizing organic aloe, green tea extracts, and active peptide serum infusion.'
          }
        ];
      } else {
        suggestions = [
          {
            id: `s-sug-${Date.now()}-1`,
            name: 'Luxury Gel Manicure & Custom Extensions',
            category: 'Beauty',
            price: 1900,
            duration: 80,
            description: 'Detailed cuticle care, organic hand massage, protective gel coat, and flawless premium custom extensions.',
            featured: true
          },
          {
            id: `s-sug-${Date.now()}-2`,
            name: 'Classic Pedicure & Softening Soak',
            category: 'Beauty',
            price: 1100,
            duration: 50,
            description: 'Detoxifying lavender milk bath foot soak, callus filing, sea salt scrub, and professional lacquer polish finish.'
          },
          {
            id: `s-sug-${Date.now()}-3`,
            name: 'Brow Tinting & Precision Mapping',
            category: 'Beauty',
            price: 600,
            duration: 25,
            description: 'Perfect geometric brow mapping followed by customized organic tint dye application for thick elegant arches.'
          },
          {
            id: `s-sug-${Date.now()}-4`,
            name: 'Radiant Glow Skin Cleanup',
            category: 'Beauty',
            price: 1200,
            duration: 40,
            description: 'Refreshing facial steam, blackhead extraction, vitamin C mask application, and cooling cucumber spray.'
          }
        ];
      }
      setGeneratedSuggestions(suggestions);
      setSelectedSuggestionIds(suggestions.map(s => s.id));
      setIsGeneratingSuggestions(false);
    }, 1200);
  };

  const handleAddSuggestionsToCatalog = () => {
    const toAdd = generatedSuggestions.filter(s => selectedSuggestionIds.includes(s.id));
    if (toAdd.length === 0) return;

    const withFreshIds = toAdd.map(s => ({
      ...s,
      id: `s-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    }));

    setData(prev => ({
      ...prev,
      services: [...prev.services, ...withFreshIds]
    }));

    setNotifications(prev => [
      { id: `n-${Date.now()}`, text: `Added ${toAdd.length} suggestions via AI generator!`, time: 'Just now', read: false },
      ...prev
    ]);

    setShowAiSuggestModal(false);
    setGeneratedSuggestions([]);
    setSelectedSuggestionIds([]);
  };

  const handleToggleStaffStatus = (id: string) => {
    const statuses: StaffStatus[] = ['Available', 'Busy', 'On Leave'];
    setData(prev => ({
      ...prev,
      team: prev.team.map(m => {
        if (m.id === id) {
          const currIdx = statuses.indexOf(m.status || 'Available');
          const nextStatus = statuses[(currIdx + 1) % statuses.length];
          return { ...m, status: nextStatus };
        }
        return m;
      })
    }));
  };

  const handleUpdateApptStatus = (apptId: string, nextStatus: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled') => {
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: nextStatus } : a));
  };

  const handleDeleteAppt = (apptId: string) => {
    setAppointments(prev => prev.filter(a => a.id !== apptId));
  };

  // Dynamic statistics calculation
  const totalBookingsValue = appointments
    .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
    .reduce((sum, a) => sum + a.price, 0);

  const totalAdvanceCollected = appointments
    .filter(a => a.status === 'Confirmed' || a.status === 'Completed')
    .reduce((sum, a) => sum + a.depositPaid, 0);

  const totalRemainingAtSalon = totalBookingsValue - totalAdvanceCollected;

  const activeServicesCount = data.services.length;
  const staffTeamCount = data.team.length;
  const todayActiveBookings = appointments.filter(a => a.status !== 'Cancelled').length;

  return {
    data,
    activeTab,
    setActiveTab,
    setData,
    goToStep,
    onOpenStaffManagement,
    onThemeChange,
    platform,
    defaultSalon,
    liveSlug,
    liveUrl,
    currentThemeId,
    locale,
    chrome,
    dashboardWeeklyTop,
    totalBookingsValue,
    totalAdvanceCollected,
    totalRemainingAtSalon,
    activeServicesCount,
    staffTeamCount,
    todayActiveBookings,
    mode,
    setMode,
    copied,
    handleCopyLink,
    appointments,
    setAppointments,
    handleUpdateApptStatus,
    handleDeleteAppt,
    handleCreateAppointment,
    showNewAppointmentModal,
    setShowNewAppointmentModal,
    handleToggleStaffStatus,
    notifications,
    setNotifications,
    setShowNotifications,
    showNotifications,
    updateTagline,
    taglineOptions,
    taglineCategory,
    setTaglineCategory,
    taglineSubcategory,
    setTaglineSubcategory,
    handlePolishText,
    polishingField,
    setPolishingField,
    polishingStatus,
    setPolishingStatus,
    ownerPhotoInputRef,
    ownerPhotoError,
    setOwnerPhotoError,
    ownerPhotoBusy,
    setOwnerPhotoBusy,
    handleOwnerPhotoFile,
    handleRemoveOwnerPhoto,
    showHelpCenter,
    setShowHelpCenter,
    showLiveSiteModal,
    setShowLiveSiteModal,
    servicesSubTab,
    setServicesSubTab,
    servicesSearchQuery,
    setServicesSearchQuery,
    servicesSelectedCategory,
    setServicesSelectedCategory,
    servicesViewLayout,
    setServicesViewLayout,
    editingService,
    setEditingService,
    editingPackage,
    setEditingPackage,
    showServiceDrawer,
    setShowServiceDrawer,
    showPackageDrawer,
    setShowPackageDrawer,
    isImprovingWithAI,
    setIsImprovingWithAI,
    newServiceName,
    setNewServiceName,
    newServiceCategory,
    setNewServiceCategory,
    newServicePrice,
    setNewServicePrice,
    newServiceDuration,
    setNewServiceDuration,
    newServiceDesc,
    setNewServiceDesc,
    newServiceFeatured,
    setNewServiceFeatured,
    newPackageName,
    setNewPackageName,
    newPackagePrice,
    setNewPackagePrice,
    newPackageDuration,
    setNewPackageDuration,
    newPackageDesc,
    setNewPackageDesc,
    handleSaveService,
    handleDuplicateService,
    handleDeleteService,
    handleSavePackage,
    handleDuplicatePackage,
    handleDeletePackage,
    handleImproveDescriptionWithAI,
    handleImprovePackageDescWithAI,
    showVoiceModal,
    setShowVoiceModal,
    voiceInputText,
    setVoiceInputText,
    isVoiceListening,
    setIsVoiceListening,
    handleParseVoiceCommand,
    showAiSuggestModal,
    setShowAiSuggestModal,
    aiSuggestArchetype,
    setAiSuggestArchetype,
    isGeneratingSuggestions,
    setIsGeneratingSuggestions,
    generatedSuggestions,
    setGeneratedSuggestions,
    selectedSuggestionIds,
    setSelectedSuggestionIds,
    handleTriggerSuggestions,
    handleAddSuggestionsToCatalog,
    newCustName, setNewCustName,
    newCustPhone, setNewCustPhone,
    newSelectedService, setNewSelectedService,
    newSelectedStaff, setNewSelectedStaff,
    newSelectedTime, setNewSelectedTime,
    bookingActor,
    bookingTenantId,
    bookingToast,
    setBookingToast,
    paymentsFilter,
    setPaymentsFilter,
    paymentsSearch,
    setPaymentsSearch,
    selectedPaymentId,
    setSelectedPaymentId,
  };
}
