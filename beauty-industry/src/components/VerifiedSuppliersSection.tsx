import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  Send,
  Award,
  FileCheck2,
  Zap,
  Globe2,
  Activity,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Scale,
  Factory,
  Plus,
  Check,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Package,
  Leaf,
  BadgeCheck,
  Video,
  Star,
  FileText,
  Download,
  FileSpreadsheet,
  FlaskConical,
  FileCheck,
  Compass
} from 'lucide-react';
import { VerifiedSupplier, ComplianceReport } from '../types';

interface VerifiedSuppliersSectionProps {
  suppliers: VerifiedSupplier[];
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  isSaved?: (supplierId: string) => boolean;
  onToggleSave?: (supplierId: string, supplierName?: string) => void;
  selectedComparisonIds?: string[];
  onToggleComparison?: (supplier: VerifiedSupplier) => void;
  onOpenComparisonModal?: () => void;
  onClearComparison?: () => void;
  onOpenEnquiry: (supplier: VerifiedSupplier | Record<string, unknown>) => void;
  onOpenMapModal?: (supplier: VerifiedSupplier) => void;
  onOpenFacilityTour?: (supplier: VerifiedSupplier) => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const VerifiedSuppliersSection: React.FC<VerifiedSuppliersSectionProps> = ({
  suppliers,
  isLoggedIn,
  onOpenAuth,
  isSaved,
  onToggleSave,
  selectedComparisonIds = [],
  onToggleComparison,
  onOpenComparisonModal,
  onClearComparison,
  onOpenEnquiry,
  onOpenMapModal,
  onOpenFacilityTour,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  const [expandedPortfolioIds, setExpandedPortfolioIds] = useState<Record<string, boolean>>({});
  const [expandedComplianceIds, setExpandedComplianceIds] = useState<Record<string, boolean>>({});
  const [activeRatingSupplierId, setActiveRatingSupplierId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Proximity Sourcing ('Near Me') States
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 19.076, lng: 72.8777 }); // Default Mumbai
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [maxDistance, setMaxDistance] = useState<number>(300); // Default 300 km
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
    Mumbai: { lat: 19.076, lng: 72.8777, name: 'Mumbai, MH' },
    Delhi: { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR' },
    Bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, KA' },
    Pune: { lat: 18.5204, lng: 73.8567, name: 'Pune, MH' },
    Ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, GJ' },
    Hyderabad: { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, TS' }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setGeoError(null);
    if (CITY_COORDINATES[cityName]) {
      setUserCoords({
        lat: CITY_COORDINATES[cityName].lat,
        lng: CITY_COORDINATES[cityName].lng
      });
    }
  };

  const handleAutoDetectLocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSelectedCity('Auto-Detected');
        setGeoLoading(false);
        setDownloadToast('Location auto-detected successfully!');
        setTimeout(() => setDownloadToast(null), 2500);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGeoError('Unable to retrieve location. Falling back to Mumbai.');
        setGeoLoading(false);
        handleCityChange('Mumbai');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const getProximityDistance = (sup: VerifiedSupplier): number => {
    const lat1 = userCoords.lat;
    const lng1 = userCoords.lng;
    const lat2 = sup.locationDetails?.lat ?? (sup.city === 'Delhi NCR' ? 28.3685 : 19.076);
    const lng2 = sup.locationDetails?.lng ?? (sup.city === 'Delhi NCR' ? 76.9412 : 72.8777);

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const processedSuppliers = useMemo(() => {
    if (!nearMeEnabled) return suppliers;

    const withDistance = suppliers.map((sup) => ({
      ...sup,
      computedDistance: getProximityDistance(sup)
    }));

    const filtered = maxDistance === -1 
      ? withDistance 
      : withDistance.filter((s) => s.computedDistance <= maxDistance);

    return filtered.sort((a, b) => a.computedDistance - b.computedDistance);
  }, [suppliers, nearMeEnabled, userCoords, maxDistance]);

  const togglePortfolio = (supplierId: string) => {
    setExpandedPortfolioIds((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const toggleCompliance = (supplierId: string) => {
    setExpandedComplianceIds((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const triggerPdfDownload = (reportTitle: string) => {
    setDownloadToast(`Downloading ${reportTitle} (PDF)...`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 3000);
  };

  const getComplianceReportsForSupplier = (sup: VerifiedSupplier): ComplianceReport[] => {
    if (sup.complianceReports && sup.complianceReports.length > 0) {
      return sup.complianceReports;
    }
    return [
      {
        id: `${sup.id}-iso`,
        title: `${sup.name} ISO 22716:2007 (GMP) Certificate`,
        category: 'ISO Certificate',
        fileSize: '2.4 MB',
        issueDate: 'Jan 2024',
        validUntil: 'Dec 2026',
        issuedBy: 'SGS International Inspection',
        summary: 'Verified compliance with global Good Manufacturing Practices for cosmetics cleanroom production.',
        accreditationNumber: 'SGS-GMP-88219-IN',
        status: 'Verified'
      },
      {
        id: `${sup.id}-lab`,
        title: 'Heavy Metals & Microbiological Quality Control Lab Test',
        category: 'Lab Test Result',
        fileSize: '1.8 MB',
        issueDate: 'Feb 2024',
        issuedBy: 'Bureau Veritas Quality Labs',
        summary: 'Zero heavy metals, arsenic, or microbial contamination detected across batch samples.',
        accreditationNumber: 'BV-LAB-2024-091',
        status: 'Active'
      },
      {
        id: `${sup.id}-audit`,
        title: 'Third-Party Manufacturing & Environmental Audit Summary',
        category: 'Audit Summary',
        fileSize: '3.1 MB',
        issueDate: 'Mar 2024',
        validUntil: 'Mar 2025',
        issuedBy: 'Intertek Quality Assurance',
        summary: 'Grade A+ audit score covering ethical labor practices, raw material traceability & effluent control.',
        accreditationNumber: 'ITK-AUD-5521-A',
        status: 'Audit Passed'
      },
      {
        id: `${sup.id}-coa`,
        title: 'Certificate of Analysis (COA) & 24-Mo Stability Study',
        category: 'COA & Stability',
        fileSize: '1.5 MB',
        issueDate: 'Jan 2024',
        issuedBy: 'TÜV SÜD South Asia',
        summary: '24-month accelerated stability testing & viscosity retention study for base formulations.',
        accreditationNumber: 'TUV-COA-7731-9',
        status: 'Verified'
      }
    ];
  };

  const getPortfolioProducts = (sup: VerifiedSupplier) => {
    if (sup.portfolioProducts && sup.portfolioProducts.length > 0) {
      return sup.portfolioProducts;
    }
    return [
      {
        id: `${sup.id}-port-1`,
        name: `${sup.categories[0] || 'Professional'} Hair & Skin Serum Base`,
        image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80',
        price: '₹850 / L',
        moq: '50 Units'
      },
      {
        id: `${sup.id}-port-2`,
        name: `${sup.categories[1] || 'Botanical'} Repair Complex Base`,
        image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',
        price: '₹1,200 / L',
        moq: '25 Units'
      },
      {
        id: `${sup.id}-port-3`,
        name: `${sup.categories[0] || 'Cosmeceutical'} Active Fluid Base`,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
        price: '₹620 / kg',
        moq: '100 kg'
      }
    ];
  };

  const getCertBadges = (sup: VerifiedSupplier) => {
    const rawList = sup.certificationsList || [
      sup.isIsoCertified ? 'ISO 22716' : null,
      sup.isGmpCertified ? 'WHO-GMP' : null,
      sup.isFdaRegistered ? 'US-FDA' : null
    ].filter(Boolean) as string[];

    return rawList.map((certStr) => {
      const certLower = certStr.toLowerCase();
      if (certLower.includes('iso')) {
        return {
          label: certStr.replace(/certified|compliant/gi, '').trim(),
          icon: <Award className="w-3 h-3 text-[#b90064]" />,
          style: 'bg-[#fde7f3] text-[#b90064] border-[#e0bec6]'
        };
      }
      if (certLower.includes('gmp')) {
        return {
          label: certStr.replace(/compliant|certified/gi, '').trim(),
          icon: <BadgeCheck className="w-3 h-3 text-[#00875a]" />,
          style: 'bg-[#e8f5e9] text-[#00875a] border-[#a5d6a7]'
        };
      }
      if (
        certLower.includes('organic') ||
        certLower.includes('ecocert') ||
        certLower.includes('usda') ||
        certLower.includes('ayush')
      ) {
        return {
          label: certStr.replace(/certified|equivalent/gi, '').trim(),
          icon: <Leaf className="w-3 h-3 text-[#2e7d32]" />,
          style: 'bg-[#f1f8e9] text-[#2e7d32] border-[#c5e1a5]'
        };
      }
      if (certLower.includes('fda')) {
        return {
          label: certStr.replace(/registered|filed/gi, '').trim(),
          icon: <FileCheck2 className="w-3 h-3 text-[#0050d6]" />,
          style: 'bg-[#dbe1ff] text-[#0050d6] border-[#a5c0ff]'
        };
      }
      if (
        certLower.includes('halal') ||
        certLower.includes('cruelty') ||
        certLower.includes('glp') ||
        certLower.includes('ce')
      ) {
        return {
          label: certStr.replace(/certified|ready|support/gi, '').trim(),
          icon: <ShieldCheck className="w-3 h-3 text-[#6b21a8]" />,
          style: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]'
        };
      }
      return {
        label: certStr.trim(),
        icon: <Award className="w-3 h-3 text-[#594047]" />,
        style: 'bg-white text-[#594047] border-[#e8e8e8]'
      };
    });
  };

  const isSelectedForComparison = (id: string) => selectedComparisonIds.includes(id);

  const selectedSuppliersList = suppliers.filter((s) => selectedComparisonIds.includes(s.id));

  return (
    <section id="suppliers" className="py-14 bg-white border-t border-[#e8e8e8] relative">
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fde7f3] text-[#b90064] text-[10px] font-black uppercase tracking-widest border border-[#f5b8d6]">
                <ShieldCheck className="w-3 h-3" />
                Verified Network
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#0050d6] text-[10px] font-black uppercase tracking-widest border border-[#a5c0ff]">
                <Factory className="w-3 h-3" />
                Facility Audited
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1c1b1b] tracking-tight mb-4">
              Verified Manufacturing Partners
            </h2>
            <p className="text-[15px] text-[#594047] leading-relaxed">
              Direct connection to audited cosmetic laboratories, active extract suppliers, and high-capacity packaging lines. Every facility listed has passed our **24-point professional audit**.
            </p>
          </div>

          {/* Compare Button in Header */}
          {onOpenComparisonModal && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onOpenComparisonModal}
                className={`text-[13px] font-black px-6 py-3.5 rounded-xl border transition-all flex items-center gap-2 shadow-sm ${
                  selectedComparisonIds.length > 0
                    ? 'bg-[#b90064] border-[#b90064] text-white hover:bg-[#8e004b]'
                    : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064]'
                }`}
              >
                <Scale className="w-4.5 h-4.5" />
                <span>Compare Manufacturers</span>
                {selectedComparisonIds.length > 0 && (
                  <span className="bg-white text-[#b90064] text-[11px] font-black px-2 py-0.5 rounded-full ml-1">
                    {selectedComparisonIds.length}/3
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Proximity / 'Near Me' Control Bar */}
        <div className="mb-8 p-4 bg-[#fcf9f8] rounded-2xl border border-[#e8e8e8] shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl transition-colors shrink-0 ${nearMeEnabled ? 'bg-[#b90064] text-white' : 'bg-white text-[#594047] border border-[#e8e8e8]'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#1c1b1b]">Proximity Sourcing ("Near Me")</span>
                <span className="text-[10px] font-extrabold bg-[#fde7f3] text-[#b90064] px-1.5 py-0.2 rounded-full uppercase tracking-wider">NEW</span>
              </div>
              <p className="text-[11.5px] text-[#594047]">
                Filter and sort manufacturers dynamically based on proximity to your warehouse or head office.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Toggle Switch */}
            <button
              onClick={() => setNearMeEnabled(!nearMeEnabled)}
              className={`px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                nearMeEnabled
                  ? 'bg-[#b90064] border-[#b90064] text-white shadow-sm'
                  : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064]'
              }`}
            >
              <span>{nearMeEnabled ? 'Proximity Filter Active' : 'Enable Near Me'}</span>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${nearMeEnabled ? 'bg-white/30' : 'bg-[#e8e8e8]'} flex items-center`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${nearMeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            {nearMeEnabled && (
              <>
                {/* City Location dropdown */}
                <div className="flex items-center gap-1.5 bg-white border border-[#e8e8e8] px-3 py-1.8 rounded-xl text-[12px] shadow-2xs">
                  <span className="text-[#8c7077] font-semibold">Your Location:</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="bg-transparent font-bold text-[#1c1b1b] focus:outline-none cursor-pointer"
                  >
                    <option value="Mumbai">Mumbai Hub</option>
                    <option value="Delhi">Delhi NCR Hub</option>
                    <option value="Bengaluru">Bengaluru Hub</option>
                    <option value="Pune">Pune Hub</option>
                    <option value="Ahmedabad">Ahmedabad Hub</option>
                    <option value="Hyderabad">Hyderabad Hub</option>
                    {selectedCity === 'Auto-Detected' && (
                      <option value="Auto-Detected">📍 GPS Auto-Detected</option>
                    )}
                  </select>
                </div>

                {/* Auto detect button */}
                <button
                  onClick={handleAutoDetectLocation}
                  disabled={geoLoading}
                  className="bg-white hover:bg-[#fde7f3]/20 border border-[#e8e8e8] hover:border-[#b90064] text-[#b90064] text-[12px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                  title="Auto-detect current location using browser GPS"
                >
                  <MapPin className={`w-3.5 h-3.5 ${geoLoading ? 'animate-bounce' : ''}`} />
                  <span>{geoLoading ? 'Detecting...' : 'Auto-Detect'}</span>
                </button>

                {/* Range Limit dropdown */}
                <div className="flex items-center gap-1.5 bg-white border border-[#e8e8e8] px-3 py-1.8 rounded-xl text-[12px] shadow-2xs">
                  <span className="text-[#8c7077] font-semibold">Max Distance:</span>
                  <select
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="bg-transparent font-bold text-[#1c1b1b] focus:outline-none cursor-pointer"
                  >
                    <option value={100}>Within 100 km</option>
                    <option value={300}>Within 300 km</option>
                    <option value={500}>Within 500 km</option>
                    <option value={1000}>Within 1000 km</option>
                    <option value={-1}>Show All (Distance Sorted)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Geolocation Feedback / Alerts */}
        {nearMeEnabled && geoError && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 flex items-center justify-between gap-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>{geoError}</span>
            </div>
            <button onClick={() => setGeoError(null)} className="text-amber-500 hover:text-amber-800 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Suppliers Grid */}
        {processedSuppliers.length === 0 ? (
          <div className="text-center py-16 bg-[#fcf9f8] rounded-2xl border border-dashed border-[#e8e8e8] p-6 w-full">
            <Compass className="w-12 h-12 text-[#8c7077] mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-[#1c1b1b]">No Manufacturers Found</h3>
            <p className="text-[13px] text-[#594047] max-w-md mx-auto mt-1">
              There are no verified manufacturing facilities within {maxDistance} km of {selectedCity === 'Auto-Detected' ? 'your GPS coordinates' : `${selectedCity} Hub`}.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setMaxDistance(-1)}
                className="bg-[#b90064] text-white font-bold text-[12.5px] px-4 py-2 rounded-xl hover:bg-[#8e004b] transition-colors shadow-2xs cursor-pointer"
              >
                Show All (Distance Sorted)
              </button>
              <button
                onClick={() => setMaxDistance(1000)}
                className="bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#594047] hover:text-[#b90064] font-bold text-[12.5px] px-4 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Expand to 1000 km
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedSuppliers.map((sup) => {
            const saved = isSaved ? isSaved(sup.id) : false;
            const inComparison = isSelectedForComparison(sup.id);
            const isPortfolioExpanded = !!expandedPortfolioIds[sup.id];
            const isComplianceExpanded = !!expandedComplianceIds[sup.id];
            const portfolioList = getPortfolioProducts(sup);

            const computedDistance = (sup as any).computedDistance;
            const isLocalHighlight = nearMeEnabled && computedDistance !== undefined && computedDistance <= 150;

            return (
              <div
                key={sup.id}
                className={`bg-[#fcf9f8] rounded-2xl border p-6 flex flex-col justify-between card-hover-fx transition-all ${
                  inComparison
                    ? 'border-[#b90064] ring-1 ring-[#b90064]/20 shadow-md'
                    : isLocalHighlight
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs bg-[#f8fdf9]'
                      : 'border-[#e8e8e8]'
                }`}
              >
                <div>
                  
                  {/* Header with Monogram Logo, Verifications & Quick Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    
                    <div className="flex items-center gap-3.5">
                      {/* Monogram Logo */}
                      <div className="w-13 h-13 rounded-xl bg-[#b90064] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        {sup.shortCode}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[#1c1b1b]">{sup.name}</h3>

                          {/* Verified Badge */}
                          <span className="inline-flex items-center gap-1 bg-[#fde7f3] text-[#b90064] border border-[#f5b8d6] px-2 py-0.5 rounded-full text-[11px] font-extrabold shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#b90064]" />
                            Verified
                          </span>

                          {/* Dynamic Star-Rating Widget with Hover/Tap Breakdown */}
                          <div className="relative group/rating inline-block">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRatingSupplierId(activeRatingSupplierId === sup.id ? null : sup.id);
                              }}
                              className="inline-flex items-center gap-1.5 bg-[#fff8e6] hover:bg-[#fff2cd] border border-[#ffe082] px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs"
                              title="Click or hover to inspect Reliability & Product Quality Ratings"
                            >
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const ratingVal = sup.overallRating || 4.9;
                                  return (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= Math.floor(ratingVal)
                                          ? 'fill-[#f59e0b] text-[#f59e0b]'
                                          : star - ratingVal <= 0.5
                                          ? 'fill-[#f59e0b]/50 text-[#f59e0b]'
                                          : 'text-[#d1d5db]'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[11.5px] font-extrabold text-[#92400e]">
                                {sup.overallRating || 4.9}
                              </span>
                              <span className="text-[10px] font-medium text-[#b45309] hidden sm:inline">
                                ({sup.totalReviewsCount || 142})
                              </span>
                            </button>

                            {/* Reliability & Product Quality Rating Popover */}
                            <div
                              className={`absolute top-full left-0 mt-1.5 w-68 bg-white border border-[#e8e8e8] rounded-xl p-3.5 shadow-xl z-40 transition-all duration-200 ${
                                activeRatingSupplierId === sup.id
                                  ? 'opacity-100 pointer-events-auto scale-100'
                                  : 'opacity-0 pointer-events-none group-hover/rating:opacity-100 group-hover/rating:pointer-events-auto scale-95 group-hover/rating:scale-100'
                              }`}
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                                  <span className="text-[13px] font-bold text-[#1c1b1b]">
                                    {sup.overallRating || 4.9} / 5.0 Rating
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#00875a] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                                  Verified Feedback
                                </span>
                              </div>

                              <div className="space-y-2.5 text-[11px]">
                                {/* Product Quality Rating */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-[#b90064]" />
                                      Product Quality
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {((sup.productQualityRating || 98) / 20).toFixed(1)} / 5.0 ({sup.productQualityRating || 98}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#00875a] h-full rounded-full transition-all"
                                      style={{ width: `${sup.productQualityRating || 98}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Reliability Rating */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-[#00875a]" />
                                      Reliability & Spec Match
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {((sup.reliabilityRating || 99) / 20).toFixed(1)} / 5.0 ({sup.reliabilityRating || 99}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#b90064] h-full rounded-full transition-all"
                                      style={{ width: `${sup.reliabilityRating || 99}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Response Speed */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-[#594047] flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-[#0050d6]" />
                                      Response Speed
                                    </span>
                                    <span className="font-extrabold text-[#1c1b1b]">
                                      {sup.responseRate || '98% within 2 hrs'}
                                    </span>
                                  </div>
                                  <div className="w-full bg-[#f0edec] h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#0050d6] h-full rounded-full transition-all"
                                      style={{ width: `${sup.responseScore || 97}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-[#f0f0f0] text-[10px] text-[#8c7077] flex items-center justify-between">
                                <span>{sup.totalReviewsCount || 142} verified B2B orders</span>
                                <span className="text-[#b90064] font-bold">Audited</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[12px] font-medium text-[#594047]">
                            {sup.type} • {sup.city}{sup.state ? `, ${sup.state}` : ''}
                          </p>
                          {onOpenMapModal && (
                            <button
                              onClick={() => onOpenMapModal(sup)}
                              className="text-[11px] font-bold text-[#b90064] hover:text-[#8e004b] bg-[#fde7f3] hover:bg-[#fbd0e8] px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title="View manufacturer proximity to shipping ports, airports and raw material hubs"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>View on Map</span>
                            </button>
                          )}
                          {nearMeEnabled && computedDistance !== undefined && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                              computedDistance <= 150
                                ? 'bg-[#e6f4ea] text-[#137333] border border-[#a3cfb1]'
                                : 'bg-[#fffcf7] text-[#9a3412] border border-[#ffedd5]'
                            }`}
                            title={`Calculated proximity to your chosen ${selectedCity} office hub`}>
                              <Compass className="w-3.5 h-3.5 text-current animate-pulse" />
                              <span>{computedDistance} km away {computedDistance <= 150 ? '(Local Cluster)' : '(Interstate)'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compare & Bookmark Buttons + Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* Compare Checkbox Button */}
                      {onToggleComparison && (
                        <button
                          onClick={() => onToggleComparison(sup)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs ${
                            inComparison
                              ? 'bg-[#b90064] border-[#b90064] text-white'
                              : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064] hover:text-[#b90064]'
                          }`}
                          title={inComparison ? 'Remove from comparison' : 'Add to side-by-side comparison (up to 3)'}
                        >
                          {inComparison ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Compared</span>
                            </>
                          ) : (
                            <>
                              <Scale className="w-3.5 h-3.5 text-[#b90064]" />
                              <span>Compare</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Bookmark Toggle */}
                      {onToggleSave && (
                        <button
                          onClick={() => onToggleSave(sup.id, sup.name)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            saved
                              ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064]'
                              : 'bg-white border-[#e8e8e8] text-[#8c7077] hover:text-[#b90064] hover:border-[#b90064]'
                          }`}
                          title={saved ? 'Remove from Saved Suppliers' : 'Save Supplier'}
                        >
                          {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      )}

                    </div>

                  </div>

                  {/* Trust Score & Facility Pill */}
                  <div className="flex items-center justify-between mb-4 bg-white border border-[#e8e8e8] p-2.5 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7077]">Trust Score</span>
                      <span className="text-[13px] font-extrabold text-[#b90064]">{sup.trustScore || 98}/100</span>
                      <span className="text-[10px] font-semibold text-[#0050d6] bg-[#dbe1ff] px-2 py-0.5 rounded-full">
                        {sup.establishedYear || '10+ yrs in business'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00875a]"></span>
                        <span className="text-[11px] font-medium text-[#1c1b1b]">Audit Passed</span>
                      </div>
                      {onOpenFacilityTour && (
                        <button
                          onClick={() => onOpenFacilityTour(sup)}
                          className="text-[11px] font-bold text-[#b90064] bg-[#fde7f3] hover:bg-[#b90064] hover:text-white border border-[#e0bec6] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          title="Play 15-second virtual tour video of manufacturing facility"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>View Facility</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Certifications & Compliance Badge Row */}
                  <div className="mb-4">
                    <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#b90064]" />
                      Accreditations & Certifications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sup.isGstVerified && (
                        <span className="text-[11px] font-semibold bg-white border border-[#e8e8e8] text-[#0050d6] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <FileCheck2 className="w-3 h-3 text-[#0050d6]" />
                          <span>GST Verified</span>
                        </span>
                      )}
                      {getCertBadges(sup).map((badge, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 shadow-2xs ${badge.style}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verified Performance Metrics & Progress Bars */}
                  <div className="bg-white rounded-xl border border-[#e8e8e8] p-3.5 mb-4 space-y-3 shadow-2xs">
                    
                    {/* Reliability Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#0050d6]" />
                          Reliability & Batch Consistency
                        </span>
                        <span className="font-bold text-[#0050d6]">{sup.reliabilityRating || 99}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0050d6] rounded-full transition-all duration-500"
                          style={{ width: `${sup.reliabilityRating || 99}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Response Speed Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#b90064]" />
                          Response Time (SLA)
                        </span>
                        <span className="font-bold text-[#b90064]">{sup.responseTimeText || '< 2 hrs'} ({sup.responseScore || 97}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#b90064] rounded-full transition-all duration-500"
                          style={{ width: `${sup.responseScore || 97}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Export Readiness Metric */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#1c1b1b] flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-[#00875a]" />
                          Export Compliance Readiness
                        </span>
                        <span className="font-bold text-[#00875a]">{sup.exportReadiness || 94}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f0e6eb] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00875a] rounded-full transition-all duration-500"
                          style={{ width: `${sup.exportReadiness || 94}%` }}
                        ></div>
                      </div>
                      {sup.exportCertifications && (
                        <p className="text-[10px] text-[#594047] font-medium mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#00875a]" />
                          {sup.exportCertifications}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Production Capabilities / Categories */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-[#8c7077] uppercase tracking-wider block mb-1.5">
                      Core Specialties & Capabilities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(sup.specialties || sup.categories).map((c, idx) => (
                        <span key={idx} className="text-[11px] bg-white border border-[#e8e8e8] text-[#594047] px-2.5 py-0.5 rounded shadow-2xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expandable Sections: Portfolio & Compliance Tabs */}
                  <div className="mb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => togglePortfolio(sup.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-[11.5px] font-bold cursor-pointer ${
                          isPortfolioExpanded
                            ? 'bg-[#fde7f3] border-[#b90064] text-[#b90064] shadow-2xs'
                            : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#b90064] hover:text-[#b90064] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-[#b90064] shrink-0" />
                          <span className="truncate">Portfolio</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-[#b90064] text-white px-1.5 py-0.2 rounded-full shrink-0">
                          3
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCompliance(sup.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-[11.5px] font-bold cursor-pointer ${
                          isComplianceExpanded
                            ? 'bg-[#e6f4ea] border-[#00875a] text-[#00875a] shadow-2xs'
                            : 'bg-white border-[#e8e8e8] text-[#1c1b1b] hover:border-[#00875a] hover:text-[#00875a] shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-[#00875a] shrink-0" />
                          <span className="truncate">Compliance</span>
                        </div>
                        <span className="text-[10px] font-extrabold bg-[#00875a] text-white px-1.5 py-0.2 rounded-full shrink-0">
                          4 PDF
                        </span>
                      </button>
                    </div>

                    {/* Portfolio Content */}
                    {isPortfolioExpanded && (
                      <div className="mt-2.5 p-3 bg-white border border-[#e0bec6] rounded-xl shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#f0edec]">
                          <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider flex items-center gap-1">
                            <Package className="w-3 h-3 text-[#b90064]" />
                            Top 3 Best-Selling Products
                          </span>
                          <span className="text-[10px] font-medium text-[#0050d6] bg-[#dbe1ff] px-1.5 py-0.2 rounded">
                            Click product to enquire
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {portfolioList.slice(0, 3).map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() =>
                                onOpenEnquiry({
                                  title: prod.name,
                                  supplierName: sup.name,
                                  type: sup.type,
                                  city: sup.city,
                                  state: sup.state,
                                  image: prod.image,
                                  priceRange: prod.price,
                                  moq: prod.moq,
                                  category: sup.categories[0] || 'Cosmetics'
                                })
                              }
                              className="group/item border border-[#e8e8e8] hover:border-[#b90064] rounded-lg p-2 bg-[#fcf9f8] hover:bg-[#fde7f3]/30 transition-all cursor-pointer flex flex-col justify-between"
                              title={`Click to enquire about ${prod.name}`}
                            >
                              <div>
                                <div className="aspect-square rounded-md overflow-hidden bg-[#f0edec] mb-1.5 relative border border-[#e8e8e8]">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-108"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80';
                                    }}
                                  />
                                  <span className="absolute top-1 right-1 bg-black/75 text-white text-[8px] font-bold px-1 rounded uppercase tracking-wider">
                                    Best
                                  </span>
                                </div>
                                <h5 className="text-[11px] font-bold text-[#1c1b1b] group-hover/item:text-[#b90064] line-clamp-2 leading-tight mb-1">
                                  {prod.name}
                                </h5>
                              </div>

                              <div className="pt-1.5 border-t border-[#f0edec] mt-1 text-[10px]">
                                <p className="font-extrabold text-[#b90064]">{prod.price}</p>
                                <p className="text-[#8c7077] font-medium truncate">MOQ: {prod.moq}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance & Audit Reports Content */}
                    {isComplianceExpanded && (
                      <div className="mt-2.5 p-3 bg-white border border-[#00875a]/30 rounded-xl shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#f0edec]">
                          <span className="text-[10.5px] font-bold text-[#00875a] uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#00875a]" />
                            Verified Audit Reports & ISO Documents
                          </span>
                          <span className="text-[10px] font-bold text-[#00875a] bg-[#e6f4ea] px-2 py-0.5 rounded-full">
                            Official PDFs
                          </span>
                        </div>

                        <div className="space-y-2">
                          {getComplianceReportsForSupplier(sup).map((report) => (
                            <div
                              key={report.id}
                              className="p-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg hover:border-[#00875a] transition-all flex items-start justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#e6f4ea] text-[#00875a] px-1.5 py-0.2 rounded">
                                    {report.category}
                                  </span>
                                  <span className="text-[10px] text-[#8c7077] font-medium">
                                    {report.issuedBy}
                                  </span>
                                </div>
                                <h6 className="text-[11.5px] font-bold text-[#1c1b1b] leading-snug line-clamp-1">
                                  {report.title}
                                </h6>
                                <p className="text-[10.5px] text-[#594047] line-clamp-1 mt-0.5">
                                  {report.summary}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => triggerPdfDownload(report.title)}
                                className="shrink-0 bg-white border border-[#e8e8e8] hover:border-[#00875a] text-[#00875a] hover:bg-[#e6f4ea] px-2.5 py-1.5 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title={`Download PDF (${report.fileSize})`}
                              >
                                <Download className="w-3 h-3 text-[#00875a]" />
                                <span>PDF</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-[#e8e8e8] grid grid-cols-5 gap-2.5">
                  
                  <button
                    onClick={() => onOpenEnquiry(sup)}
                    className="col-span-3 bg-[#b90064] hover:bg-[#8e004b] text-white text-[13px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoggedIn ? 'Contact Supplier' : 'Login to Connect'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isLoggedIn) onCallSupplier(sup.name);
                      else onOpenAuth();
                    }}
                    title={isLoggedIn ? "Call Phone" : "Login to Call"}
                    className="col-span-1 bg-white hover:bg-[#f7f2f2] border border-[#e8e8e8] text-[#594047] hover:text-[#1c1b1b] rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(sup.name)}
                    title="WhatsApp Direct"
                    className="col-span-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                </div>

                {/* Visible Contact Number & Verification Barrier */}
                <div className="mt-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-[#8c7077]" />
                    <span className="text-[11px] font-bold text-[#1c1b1b]">
                      {isLoggedIn ? (sup.phone || '+91 98201 55443') : '+91 98XXX XXXXX'}
                    </span>
                  </div>
                  {!isLoggedIn && (
                    <button 
                      onClick={onOpenAuth}
                      className="text-[10px] font-bold text-[#b90064] hover:underline"
                    >
                      Login to reveal
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        )}

      </div>

      {/* Download Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#00875a] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#00875a]/30 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Floating Bottom Comparison Drawer Bar */}
      {selectedComparisonIds.length > 0 && onOpenComparisonModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1c1b1b] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-slideUp max-w-[92vw] sm:max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#b90064] text-white flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] font-bold leading-tight">
                {selectedComparisonIds.length} of 3 Selected
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {selectedSuppliersList.map((s) => (
                  <span
                    key={s.id}
                    className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded"
                  >
                    {s.shortCode}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onOpenComparisonModal}
              className="bg-[#b90064] hover:bg-[#8e004b] text-white text-[12px] font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm active:scale-98 whitespace-nowrap"
            >
              <span>Compare Side-by-Side</span>
            </button>

            {onClearComparison && (
              <button
                onClick={onClearComparison}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
