import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  Mail,
  MessageSquare,
  Download,
  FileText,
  CheckCircle2,
  X,
  UploadCloud,
  Award,
  Clock,
  Sparkles,
  MapPin,
  Bookmark,
  ChevronRight,
  Send,
  Building2,
  ExternalLink,
  FlaskConical,
  PackageCheck,
  Truck,
  Check,
  FileSpreadsheet,
  Video,
  FileCheck,
  FileCheck2,
  BadgeCheck,
  Shield,
  Eye,
  ZoomIn,
  ZoomOut,
  Trash2,
  Printer,
  Lock,
  RefreshCw,
  Phone,
  MessageCircle
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/mockData';
import { VerifiedBadge } from './VerifiedBadge';

interface SupplierProfileScreenProps {
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  onOpenEnquiryModal?: (item: any) => void;
  onOpenQuoteModal?: (rfq?: any) => void;
  onOpenRFQModal?: () => void;
  onOpenFacilityTour?: (supplier?: any) => void;
  onNavigateToDirectory?: () => void;
  onCallSupplier: (supplierName: string) => void;
  onWhatsAppSupplier: (supplierName: string) => void;
}

export const SupplierProfileScreen: React.FC<SupplierProfileScreenProps> = ({
  isLoggedIn,
  onOpenAuth,
  onOpenEnquiryModal,
  onOpenQuoteModal,
  onOpenRFQModal,
  onOpenFacilityTour,
  onNavigateToDirectory,
  onCallSupplier,
  onWhatsAppSupplier
}) => {
  // Local modal states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  
  // Claim listing states
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimFormName, setClaimFormName] = useState('');
  const [claimFormEmail, setClaimFormEmail] = useState('');
  const [claimFormPhone, setClaimFormPhone] = useState('');
  const [claimFormGst, setClaimFormGst] = useState('27AAAAA1111A1Z1');
  const [claimFormDoc, setClaimFormDoc] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Compliance tab state
  const [activeComplianceCategory, setActiveComplianceCategory] = useState<'All' | 'ISO Certificates' | 'Lab Tests' | 'Audit Summaries'>('All');

  // Dynamic Compliance Certifications List (scanned documents vault)
  const [reportsList, setReportsList] = useState<any[]>([
    {
      id: 'rep-01',
      type: 'ISO Certificates',
      title: 'ISO 22716:2007 Cosmetics Good Manufacturing Practices (GMP) Certification',
      issuedBy: 'SGS International Inspection Services',
      accreditationNumber: 'SGS-GMP-IN-99218',
      issueDate: 'Jan 15, 2024',
      validUntil: 'Dec 31, 2026',
      fileSize: '2.8 MB',
      status: 'Verified & Active',
      summary: 'Cleanroom manufacturing protocols, automated aseptic filling, personnel hygiene standards, and batch contamination control.',
      scannedImage: 'iso_gmp_cert',
      docType: 'ISO 22716',
      blockchainHash: '0x3ef8a7c29d10eef91823901b8e8f812cf97c00e1',
      registrarSync: 'Today, 08:30 AM',
      auditScore: '99.4/100',
      scopeOfAudit: 'Sterile Cosmetics Manufacturing and Packaging Lines'
    },
    {
      id: 'rep-02',
      type: 'ISO Certificates',
      title: 'ISO 9001:2015 Quality Management System Accreditation',
      issuedBy: 'TÜV SÜD South Asia Quality Assurance',
      accreditationNumber: 'TUV-QMS-44120-IN',
      issueDate: 'Feb 10, 2024',
      validUntil: 'Feb 09, 2027',
      fileSize: '2.2 MB',
      status: 'Verified & Active',
      summary: 'Accreditation covering end-to-end raw material sourcing traceability, supplier audits, and defect-free production workflows.',
      scannedImage: 'iso_9001_cert',
      docType: 'ISO 9001',
      blockchainHash: '0x992fa1b023ef0d88ef55ac8812ad3f2b881309f2',
      registrarSync: 'Yesterday, 04:15 PM',
      auditScore: 'A+ Grade',
      scopeOfAudit: 'End-to-End Supply Chain and Raw Material Traceability System'
    },
    {
      id: 'rep-fda',
      type: 'ISO Certificates',
      title: 'US FDA Food & Drug Administration Cosmetics Facility Registration',
      issuedBy: 'United States Food and Drug Administration (FDA)',
      accreditationNumber: 'FDA-REG-7449210-IN',
      issueDate: 'May 12, 2024',
      validUntil: 'May 11, 2027',
      fileSize: '3.1 MB',
      status: 'Registered',
      summary: 'Aura Labs manufacturing facility is registered with the US FDA for cosmetics product manufacturing under MoCRA compliance standards.',
      scannedImage: 'us_fda_cert',
      docType: 'US FDA Registry',
      blockchainHash: '0x77fa2bb3eef4a552de8c01b199da31cf830a1099',
      registrarSync: 'Aug 14, 2026, 11:20 AM',
      auditScore: 'Fully Registered (MoCRA Active)',
      scopeOfAudit: 'Aerosol, Liquid, & Semi-Solid Topical Formulation Blocks'
    },
    {
      id: 'rep-gmp',
      type: 'ISO Certificates',
      title: 'WHO-GMP Cleanroom Good Manufacturing Practices Certification',
      issuedBy: 'CDSCO Central Drugs Standard Control Organization',
      accreditationNumber: 'CDSCO-GMP-WHO-8831',
      issueDate: 'Mar 18, 2024',
      validUntil: 'Mar 17, 2027',
      fileSize: '3.5 MB',
      status: 'Certified',
      summary: 'WHO-GMP certified cosmetics formulation block confirming compliance with international hygiene, airflow, filtration and sanitation directives.',
      scannedImage: 'who_gmp_cert',
      docType: 'WHO-GMP',
      blockchainHash: '0xba231cf8a8b12fdecc1124ad9938ef21d3f99aa1',
      registrarSync: 'Today, 09:12 AM',
      auditScore: 'Class 10,000 Certified (HEPA Active)',
      scopeOfAudit: 'Grade A and B Sterile Processing Zones'
    },
    {
      id: 'rep-03',
      type: 'Lab Tests',
      title: 'ICP-MS Heavy Metals & USP <61> Microbiological Test Report',
      issuedBy: 'Bureau Veritas Testing Laboratories',
      accreditationNumber: 'BV-LAB-2024-091',
      issueDate: 'Mar 02, 2024',
      validUntil: 'Batch AL-24',
      fileSize: '1.9 MB',
      status: 'Passed (Zero Defect)',
      summary: 'ICP-MS testing confirming lead <0.1ppm, arsenic <0.05ppm, mercury <0.01ppm. Total aerobic microbial count <10 CFU/g.',
      scannedImage: 'heavy_metals_report',
      docType: 'Heavy Metals Analysis',
      blockchainHash: '0x12fa33bb89cc88a21cfd091a1a8c8eef88130bb2',
      registrarSync: 'Today, 05:40 AM',
      auditScore: '100% Lead-Free (<0.01ppm)',
      scopeOfAudit: 'Trace Heavy Metals and Total Yeast & Mold Assay'
    },
    {
      id: 'rep-04',
      type: 'Lab Tests',
      title: 'Certificate of Analysis (COA) & Accelerated Stability Study',
      issuedBy: 'Intertek Quality Testing Labs',
      accreditationNumber: 'ITK-COA-8831-S',
      issueDate: 'Jan 28, 2024',
      validUntil: '24 Months Stability',
      fileSize: '1.6 MB',
      status: 'Active',
      summary: 'Accelerated temperature stability study (40°C / 75% RH) and active ingredient potency preservation study for standard serum bases.',
      scannedImage: 'coa_stability_report',
      docType: 'Certificate of Analysis',
      blockchainHash: '0x88ea3bc99d8cf221baee1cd430abfd99a7101de8',
      registrarSync: 'Yesterday, 10:05 AM',
      auditScore: 'Accelerated Stability Passed',
      scopeOfAudit: 'Potency & Emulsion Cohesion over 24-Month Profile'
    },
    {
      id: 'rep-05',
      type: 'Audit Summaries',
      title: 'Third-Party Manufacturing, Environmental & Social Audit Summary',
      issuedBy: 'Intertek Quality & Ethical Assurance',
      accreditationNumber: 'ITK-AUD-5521-A',
      issueDate: 'Apr 05, 2024',
      validUntil: 'Apr 2025',
      fileSize: '3.4 MB',
      status: 'Grade A+ Audit Score',
      summary: 'Comprehensive audit covering fair labor practices, zero effluent discharge systems, solar power utilization, and worker safety.',
      scannedImage: 'social_audit_report',
      docType: 'Social & Eco Audit',
      blockchainHash: '0xec23fa55b882ac00ea9912ad12bf39a1cfde0a11',
      registrarSync: 'Aug 10, 2026, 02:30 PM',
      auditScore: '98.5% Environmental Compliance',
      scopeOfAudit: 'Labor, Emissions, Renewable Energy, & Safety Audits'
    },
    {
      id: 'rep-06',
      type: 'Audit Summaries',
      title: 'Cleanroom Air Particle Count & HEPA Filter Validation Audit',
      issuedBy: 'CDSCO Central Quality Inspection Group',
      accreditationNumber: 'CDSCO-GMP-4412',
      issueDate: 'Jan 20, 2024',
      validUntil: 'Jan 2026',
      fileSize: '2.1 MB',
      status: 'Class 10,000 Certified',
      summary: 'ISO Class 7 (Class 10,000) cleanroom particle count validation & laminar airflow pressure differential certification.',
      scannedImage: 'hepa_audit_report',
      docType: 'Laminar Air Audit',
      blockchainHash: '0x00cd883bfd72ac552aef1bf2de99341cfaee0b82',
      registrarSync: 'Today, 09:12 AM',
      auditScore: 'Class 10,000 Approved',
      scopeOfAudit: 'Differential Pressure & Particle Counts (0.5µm - 5.0µm)'
    }
  ]);

  // Interactive Document Viewer State
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<any | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [activePreviewTab, setActivePreviewTab] = useState<'Document' | 'AuditLog' | 'TrustLedger'>('Document');

  // Form states for Lab Test Report Attachment Portal
  const [attachProductName, setAttachProductName] = useState('Botanical Peptide Barrier Cream');
  const [attachBatchNo, setAttachBatchNo] = useState('B-PEP-2026-09');
  const [attachLabType, setAttachLabType] = useState('Stability Testing');
  const [attachLabName, setAttachLabName] = useState('SGS Quality Labs Pvt. Ltd.');
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachProgress, setAttachProgress] = useState(0);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  // RFQ Modal form state
  const [rfqProductInterest, setRfqProductInterest] = useState('Skincare • Serum Base');
  const [rfqVolume, setRfqVolume] = useState('');
  const [rfqMessage, setRfqMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>('packaging_artwork_v2.pdf');

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSendRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRfqModalOpen(false);
    showToast('Request sent successfully to Aura Labs!');
    setRfqVolume('');
    setRfqMessage('');
  };

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] font-sans relative pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#1c1b1b] text-white text-[13px] font-semibold px-4 py-3 rounded-xl shadow-2xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[580px] md:min-h-[620px] flex items-center justify-center overflow-hidden bg-[#1c1b1b] py-12 md:py-16">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=1920&q=80"
            alt="State of the art cosmetics manufacturing facility showing automated filling lines"
            className="w-full h-full object-cover brightness-75"
          />
        </div>

        {/* Hero Content Card */}
        <div className="relative z-10 w-full max-w-[1440px] px-4 md:px-10 mx-auto">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 md:p-12 max-w-4xl mx-auto text-center border border-white/60 shadow-2xl">
            {/* Verified Badge */}
            <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
              <VerifiedBadge trustScore={98} overallRating={4.9} size="md" />
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fde7f3] text-[#e6007e] font-bold text-[11px] uppercase tracking-wider border border-[#e0bec6]">
                <ShieldCheck className="w-3.5 h-3.5 fill-[#b90064] text-white" />
                <span>Nexora Verified Partner</span>
              </div>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-[#1c1b1b] mb-1 tracking-tight">
              Aura Labs &amp; Manufacturing
            </h1>

            {/* Star Rating Component */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className="w-4 h-4 fill-amber-400 text-amber-400" 
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-[15px] font-bold text-[#1c1b1b]">4.9</span>
                <span className="text-[15px] text-[#8c7077]">•</span>
                <span className="text-[13px] font-semibold text-[#594047] hover:text-[#b90064] cursor-pointer underline-offset-4 hover:underline transition-colors">
                  128 Verified Business Reviews
                </span>
              </div>
            </div>

            <p className="text-[14px] md:text-[15px] text-[#594047] mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
              Specializing in high-efficacy botanical serums and luxury foundations. Providing end-to-end OEM/ODM services for premier global brands.
            </p>

            {/* Business Claim Profile Ribbon */}
            <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-3xl mx-auto shadow-3xs">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-black text-[#1c1b1b]">Are you the owner of Aura Beauty Labs?</h4>
                  <p className="text-[11.5px] text-amber-900 font-medium mt-0.5">Claim this verified directory profile to directly manage your cosmetic listings, upload fresh lab reports, and respond to incoming buyer RFQs.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClaimStatus('idle');
                  setIsClaimModalOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[12px] px-4.5 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-sm shrink-0 active:scale-95"
              >
                Claim Profile
              </button>
            </div>

            {/* Prominent Trust & Compliance Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-8 text-left">
              {/* Badge 1: Physical Address Verified */}
              <div className="p-3.5 bg-[#f0f6ff] border border-[#d2e3fc] rounded-xl flex items-start gap-3 shadow-3xs transition-all hover:shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 text-[#0050d6]">
                  <MapPin className="w-4 h-4 fill-blue-500/20 text-[#0050d6]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wide">Physical Site</span>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">Verified</span>
                  </div>
                  <p className="text-[11px] text-blue-900/85 mt-1 leading-snug font-medium">SGS site auditor visit passed on Jun 12, 2026.</p>
                  <p className="text-[9.5px] font-bold text-[#0050d6] mt-1 font-mono">ID: SGS-PV-2026-092</p>
                </div>
              </div>

              {/* Badge 2: Registration (GST/CIN) */}
              <div className="p-3.5 bg-[#f4fbf7] border border-[#d5f3df] rounded-xl flex items-start gap-3 shadow-3xs transition-all hover:shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 text-emerald-800">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wide">Business Reg</span>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/85 mt-1 leading-snug font-mono">GSTIN: 27AAAAA1111A1Z1</p>
                  <p className="text-[9.5px] font-bold text-emerald-800/80 font-mono mt-0.5">CIN: U24246MH2014PTC259218</p>
                </div>
              </div>

              {/* Badge 3: Manufacturing License */}
              <div className="p-3.5 bg-[#fef8f9] border border-[#fbdde1] rounded-xl flex items-start gap-3 shadow-3xs transition-all hover:shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-200 text-[#b90064]">
                  <Award className="w-4 h-4 text-[#b90064]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-extrabold text-rose-950 uppercase tracking-wide">Mfg License</span>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">Approved</span>
                  </div>
                  <p className="text-[11px] text-rose-900/85 mt-1 leading-snug font-medium">FDA &amp; CDSCO certified formulation site.</p>
                  <p className="text-[9.5px] font-bold text-[#b90064] mt-1 font-mono">No: M-COS/MH/100432</p>
                </div>
              </div>
            </div>

            {/* KPI Cards Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">98%</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Response Rate</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">5k+</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Min. Order (MOQ)</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064]">15 Yrs</span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Experience</span>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 md:p-4 flex flex-col items-center border border-[#e8e8e8] shadow-2xs">
                <span className="text-xl md:text-2xl font-black text-[#b90064] flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> 4.9
                </span>
                <span className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider mt-1">Rating</span>
              </div>
            </div>

            {/* Hero Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 flex-wrap">
              <button
                onClick={() => {
                  if (onOpenRFQModal) onOpenRFQModal();
                  else setIsRfqModalOpen(true);
                }}
                className="bg-[#b90064] text-white px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#8e004b] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Request Quote</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Aura Labs Direct Business Inquiry',
                      supplierName: 'Aura Labs & Manufacturing'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="bg-white/80 border border-[#b90064] text-[#b90064] px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#fde7f3] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Supplier</span>
              </button>

              <button
                onClick={() => {
                  if (isLoggedIn) onCallSupplier('Aura Labs & Manufacturing');
                  else onOpenAuth();
                }}
                className="bg-white border border-[#0050d6] text-[#0050d6] px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#eef4ff] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>{isLoggedIn ? 'Call Directly' : 'View Contact Number'}</span>
              </button>

              <button
                onClick={() => onWhatsAppSupplier('Aura Labs & Manufacturing')}
                className="bg-[#25D366] text-white px-7 py-3.5 rounded-xl font-bold text-[13.5px] hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Response Time Badge */}
            <div className="mt-5 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fdf8f8] border border-[#e0bec6] rounded-full text-[12px] font-bold text-[#b90064] shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Usually responds in &lt; 2 hours</span>
              </div>
            </div>

            {/* Mobile Contact Visibility Barrier */}
            <div className="mt-6 pt-6 border-t border-[#f0edec] flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#8c7077]" />
                <span className="text-lg font-black text-[#1c1b1b] tracking-tight">
                  {isLoggedIn ? '+91 98201 55443' : '+91 98XXX XXXXX'}
                </span>
              </div>
              {!isLoggedIn && (
                <p className="text-[12px] text-[#594047] font-medium">
                  Verified Business Number. <button onClick={onOpenAuth} className="text-[#b90064] font-bold hover:underline">Login to reveal</button>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Aura Process (Narrative Section) */}
      <section className="py-12 md:py-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-extrabold text-[#b90064] uppercase tracking-widest bg-[#fde7f3] px-3 py-1 rounded-full inline-block mb-2">
            End-to-End Excellence
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1c1b1b] mb-2 tracking-tight">
            The Aura Process
          </h2>
          <p className="text-[14px] text-[#594047] max-w-lg mx-auto font-medium">
            Precision engineering and certified standards at every stage of production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Step 1 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80"
                alt="Two cosmetic scientists analyzing formulations in a R&D laboratory"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 01
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                  <span>Research &amp; Development</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  Our team of expert cosmetic chemists develop bespoke formulations using cutting-edge active ingredients, ensuring high efficacy and clinical stability.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>R&amp;D Turnaround</span>
                <span className="text-[#b90064] font-bold">3–5 Days</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                alt="Cleanroom environment showing automated mixing vats"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 02
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#b90064]" />
                  <span>Precision Manufacturing</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  ISO 22716 certified cleanroom facilities equipped with automated mixing lines, guaranteeing consistency across large-scale commercial production runs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>Daily Yield</span>
                <span className="text-[#00875a] font-bold">50,000+ Units</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 group flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
                alt="Automated packaging line filling luxury serum bottles"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#b90064] border border-[#e8e8e8]">
                Phase 03
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b] mb-2 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#b90064]" />
                  <span>Premium Packaging</span>
                </h3>
                <p className="text-[13px] text-[#594047] leading-relaxed font-normal">
                  We source and assemble luxury packaging components, from frosted glass droppers to sustainable airless pumps, ensuring an unboxing experience matching global luxury standards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0edec] flex items-center justify-between text-[11.5px] font-semibold text-[#8c7077]">
                <span>Defect Tolerance</span>
                <span className="text-[#0050d6] font-bold">&lt; 0.01%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade & Export Specifications Section */}
      <section className="pb-12 md:pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-2xl p-6 md:p-10 border border-[#e8e8e8] shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0edec]">
            <Truck className="w-5 h-5 text-[#b90064]" />
            <h2 className="text-xl font-bold text-[#1c1b1b]">Trade &amp; Export Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Accepted Delivery Terms
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">FOB, CIF, EXW, DDP</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Standard Production Lead Time
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">7–15 Business Days</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Accepted Payment Modes
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">Bank Transfer (T/T), L/C, Advance</span>
            </div>

            <div className="flex flex-col gap-1 lg:col-span-2">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Customization Capabilities
              </span>
              <span className="text-base font-bold text-[#1c1b1b]">
                OEM Custom Formulation, Custom Color Matching, Private Labeling, Sustainable Packaging
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider">
                Sample Lead Time
              </span>
              <span className="text-base font-bold text-[#b90064]">3–5 Days (Express Dispatch)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Audit Reports Hub Section */}
      <section id="compliance-vault" className="pb-12 md:pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#e8e8e8] shadow-sm">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 pb-6 border-b border-[#f0edec]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#00875a] font-bold text-[11px] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00875a]" />
                <span>NEXORA VERIFIED TRUST VAULT</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">
                Quality Certifications &amp; Lab Reports
              </h2>
              <p className="text-[13.5px] text-[#594047] font-medium mt-1">
                View or download authentic audited certificates (ISO, WHO-GMP, US FDA) and batch-wise Certificates of Analysis (COA).
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {(['All', 'ISO Certificates', 'Lab Tests', 'Audit Summaries'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveComplianceCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                    activeComplianceCategory === cat
                      ? 'bg-[#00875a] text-white shadow-xs'
                      : 'bg-[#fcf9f8] text-[#594047] hover:bg-[#e6f4ea] hover:text-[#00875a] border border-[#e8e8e8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {reportsList
              .filter((rep) => activeComplianceCategory === 'All' || rep.type === activeComplianceCategory)
              .map((rep) => (
                <div
                  key={rep.id}
                  className="bg-[#fcf9f8] border border-[#e8e8e8] hover:border-[#00875a] rounded-2xl p-6 transition-all duration-300 hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle green aura for local certificates */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00875a]/3 rounded-full blur-xl pointer-events-none"></div>

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#e6f4ea] text-[#00875a] px-2.5 py-1 rounded-md border border-[#00875a]/20">
                        {rep.type}
                      </span>
                      <span className="text-[10.5px] font-bold text-[#00875a] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00875a]" />
                        {rep.status}
                      </span>
                    </div>

                    <h4 className="text-[15px] font-bold text-[#1c1b1b] mb-2 leading-snug group-hover:text-[#00875a] transition-colors line-clamp-2">
                      {rep.title}
                    </h4>

                    <div className="text-[11.5px] text-[#8c7077] space-y-1 mb-3 font-medium">
                      <p>Issuing Body: <span className="text-[#1c1b1b] font-bold">{rep.issuedBy}</span></p>
                      <p>Accreditation #: <span className="text-[#0050d6] font-mono">{rep.accreditationNumber}</span></p>
                      <p>Valid: {rep.issueDate} {rep.validUntil ? `— ${rep.validUntil}` : ''}</p>
                    </div>

                    <p className="text-[12.5px] text-[#594047] mb-5 leading-relaxed bg-white p-3 rounded-xl border border-[#e8e8e8] min-h-[72px] line-clamp-3">
                      {rep.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e8e8e8] space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-[#8c7077]">
                      <span>PDF ({rep.fileSize})</span>
                      <span className="text-[#00875a] bg-[#e6f4ea]/80 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                        <Lock className="w-3 h-3 text-[#00875a]" /> Secure Vault
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedReportForPreview(rep);
                          setActivePreviewTab('Document');
                          setPreviewZoom(1);
                        }}
                        className="bg-white border border-[#00875a] hover:bg-[#e6f4ea]/30 text-[#00875a] text-[11.5px] font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-98"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Scanned</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReportForPreview(rep);
                          setActivePreviewTab('TrustLedger');
                          setPreviewZoom(1);
                        }}
                        className="bg-white border border-[#e8e8e8] hover:bg-[#f0edec] text-[#594047] text-[11.5px] font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00875a]" />
                        <span>Verify Ledger</span>
                      </button>
                    </div>

                    <button
                      onClick={() => showToast(`Downloaded ${rep.title} (PDF)...`)}
                      className="w-full bg-[#00875a] hover:bg-[#006e49] text-white text-[12px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Certified PDF</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* 🧪 B2B Lab Test Report & Batch-Wise Attachment Portal */}
          <div className="border-t border-[#f0edec] pt-10 mt-6">
            <div className="flex items-center gap-2.5 mb-6">
              <FlaskConical className="w-6 h-6 text-[#b90064] fill-[#fde7f3]" />
              <div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">
                  Formulation &amp; Batch-Wise Lab Testing Vault
                </h3>
                <p className="text-[13px] text-[#594047] font-medium">
                  Add batch-specific stability, heavy metal analysis, or microbiological challenge test reports to maintain absolute B2B compliance logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form & Upload Area (Left 5-columns) */}
              <div className="lg:col-span-5 bg-[#fcf9f8] border border-[#e8e8e8] p-5 md:p-6 rounded-2xl space-y-4">
                <span className="text-[11px] font-extrabold uppercase text-[#b90064] tracking-widest bg-[#fde7f3] px-2.5 py-1 rounded-md inline-block">
                  Attachment Portal (Supplier/Brand Action)
                </span>
                
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-bold text-[#1c1b1b]">Formulation / Product Name</label>
                    <select
                      value={attachProductName}
                      onChange={(e) => setAttachProductName(e.target.value)}
                      className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                    >
                      <option>Botanical Peptide Barrier Cream</option>
                      <option>Professional Retinol 1% Serum Base</option>
                      <option>Keratin Hair Repair Spa Treatment</option>
                      <option>Lumina Foundation Complexion SPF 30</option>
                      <option>Niacinamide 10% Active Raw Concentrate</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[12px] font-bold text-[#1c1b1b]">Batch Number</label>
                      <input
                        type="text"
                        value={attachBatchNo}
                        onChange={(e) => setAttachBatchNo(e.target.value)}
                        placeholder="e.g., B-RET-2026-X"
                        className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium text-[#1c1b1b]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[12px] font-bold text-[#1c1b1b]">Accredited Testing Lab</label>
                      <input
                        type="text"
                        value={attachLabName}
                        onChange={(e) => setAttachLabName(e.target.value)}
                        placeholder="e.g., SGS India Laboratories"
                        className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium text-[#1c1b1b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-bold text-[#1c1b1b]">Laboratory Report / Analysis Type</label>
                    <select
                      value={attachLabType}
                      onChange={(e) => setAttachLabType(e.target.value)}
                      className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                    >
                      <option value="Stability Testing">Stability Testing Report (Accelerated Temp &amp; Shelf Life)</option>
                      <option value="Heavy Metal Analysis">Heavy Metal Assay (ICP-MS Spectrum Analysis)</option>
                      <option value="Challenge Testing">Preservative Challenge Test (USP &lt;51&gt; Efficacy)</option>
                      <option value="COA &amp; Potency">Certificate of Analysis (COA - Active Ingredient Potency)</option>
                    </select>
                  </div>

                  {/* Drag-and-Drop Zone */}
                  <div className="space-y-1">
                    <label className="block text-[12px] font-bold text-[#1c1b1b]">Scanned Laboratory Document Attachment</label>
                    
                    {!attachedFileName && !isAttaching ? (
                      <div
                        onClick={() => {
                          setIsAttaching(true);
                          setAttachProgress(0);
                          let currentProgress = 0;
                          const interval = setInterval(() => {
                            currentProgress += 20;
                            setAttachProgress(currentProgress);
                            if (currentProgress >= 100) {
                              clearInterval(interval);
                              setIsAttaching(false);
                              const defaultFiles: Record<string, string> = {
                                'Stability Testing': 'accelerated_stability_profile_B-PEP.pdf',
                                'Heavy Metal Analysis': 'icp_ms_heavy_metals_toxicology_log.pdf',
                                'Challenge Testing': 'usp_51_antimicrobial_challenge_efficacy.pdf',
                                'COA & Potency': 'certificate_of_analysis_actives_concentrate.pdf'
                              };
                              setAttachedFileName(defaultFiles[attachLabType] || 'lab_test_report_batch_signed.pdf');
                              showToast('Laboratory report scanned and analyzed successfully!');
                            }
                          }, 250);
                        }}
                        className="border-2 border-dashed border-[#e8e8e8] hover:border-[#b90064] hover:bg-[#fde7f3]/10 bg-white transition-colors rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center min-h-[110px]"
                      >
                        <UploadCloud className="w-7 h-7 text-[#b90064] mb-1" />
                        <span className="text-[12.5px] font-bold text-[#1c1b1b]">Click to attach scanned lab PDF</span>
                        <span className="text-[11px] text-[#8c7077] mt-0.5">Stability, Heavy Metals, Challenge results (Max 15MB)</span>
                      </div>
                    ) : isAttaching ? (
                      <div className="bg-white border border-[#e8e8e8] rounded-xl p-4 flex flex-col justify-center min-h-[110px]">
                        <div className="flex justify-between items-center mb-1 text-[12px] font-bold text-[#1c1b1b]">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#b90064]" />
                            Scanning and Verifying Certificate Integrity...
                          </span>
                          <span>{attachProgress}%</span>
                        </div>
                        <div className="w-full bg-[#e8e8e8] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#b90064] h-2 transition-all duration-300 rounded-full"
                            style={{ width: `${attachProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-[#8c7077] mt-1.5 font-medium">Extracting cryptographic registrar seal, CDSCO logs, and chemical batch assays...</span>
                      </div>
                    ) : (
                      <div className="bg-[#e6f4ea] border border-[#a3cfb1] rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <div className="w-8 h-8 rounded bg-[#a3cfb1]/30 text-[#137333] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[12px] font-bold text-[#137333] truncate">{attachedFileName}</div>
                            <div className="text-[10px] text-[#137333]/80 font-semibold uppercase">Cryptographically Checked &amp; Cleared</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAttachedFileName(null);
                            showToast('Attachment removed.');
                          }}
                          className="p-1 text-[#c53929] hover:bg-[#c53929]/10 rounded-full transition-colors cursor-pointer shrink-0"
                          title="Remove attached report"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!attachedFileName) {
                        showToast('Please attach a scanned laboratory report PDF first.');
                        return;
                      }
                      if (!attachBatchNo.trim()) {
                        showToast('Please input a valid Batch Number.');
                        return;
                      }
                      
                      // Map category type
                      const typeMap: Record<string, string> = {
                        'Stability Testing': 'Lab Tests',
                        'Heavy Metal Analysis': 'Lab Tests',
                        'Challenge Testing': 'Lab Tests',
                        'COA & Potency': 'Lab Tests'
                      };

                      const newReport = {
                        id: 'custom-' + Date.now(),
                        type: typeMap[attachLabType] || 'Lab Tests',
                        title: `${attachLabType} Batch Compliance Report — ${attachProductName}`,
                        issuedBy: attachLabName,
                        accreditationNumber: `NABL-${attachLabType.slice(0,3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
                        issueDate: 'Today (Aug 2026)',
                        validUntil: `Batch ${attachBatchNo}`,
                        fileSize: '1.4 MB',
                        status: 'Verified & Active',
                        summary: `Batch-specific laboratory report covering ${attachLabType} for formulation ${attachProductName} under batch ${attachBatchNo}. Independently logged and verified.`,
                        scannedImage: attachLabType === 'Heavy Metal Analysis' ? 'heavy_metals_report' : (attachLabType === 'Stability Testing' ? 'coa_stability_report' : 'challenge_test_report'),
                        docType: attachLabType,
                        blockchainHash: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
                        registrarSync: 'Just now',
                        auditScore: '99.8% Perfect Assayed',
                        scopeOfAudit: `Safety, Purity, and Physical Stability Testing for Formulation Batch ${attachBatchNo}`
                      };

                      setReportsList([newReport, ...reportsList]);
                      setAttachedFileName(null);
                      setAttachBatchNo('');
                      showToast(`Lab Test Report attached to ${attachProductName} successfully!`);
                    }}
                    className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13px] py-3 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attach Lab Report to Batch Ledger</span>
                  </button>
                </div>
              </div>

              {/* Live Laboratory Batch Reports Ledger (Right 7-columns) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e8e8e8] shadow-2xs">
                  <span className="text-[12px] font-bold text-[#1c1b1b] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00875a] animate-pulse"></span>
                    Live Batch Compliance Log ({reportsList.filter(r => r.type === 'Lab Tests').length} Active Reports)
                  </span>
                  <span className="text-[11px] text-[#8c7077] font-semibold">CDSCO &amp; NABL Standard Traceability</span>
                </div>

                <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fcf9f8] border-b border-[#e8e8e8] text-[11px] font-extrabold text-[#8c7077] uppercase tracking-wider">
                          <th className="py-3 px-4">Batch / Product</th>
                          <th className="py-3 px-4">Lab / Accreditation</th>
                          <th className="py-3 px-4">Test Type</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0edec] text-[12.5px]">
                        {reportsList
                          .filter((rep) => rep.type === 'Lab Tests')
                          .map((rep) => (
                            <tr key={rep.id} className="hover:bg-[#fdf8f8]/40 transition-colors">
                              <td className="py-3.5 px-4 font-medium text-[#1c1b1b]">
                                <div className="font-bold text-[#1c1b1b]">{rep.validUntil?.startsWith('Batch') ? rep.validUntil : `Batch AL-24`}</div>
                                <div className="text-[11px] text-[#594047] truncate max-w-[180px]" title={rep.title}>
                                  {rep.title.replace('ICP-MS Heavy Metals & USP <61> Microbiological Test Report', 'Heavy Metals & Microbiological').replace('Certificate of Analysis (COA) & Accelerated Stability Study', 'COA & Stability')}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-[#594047]">
                                <div className="font-semibold text-[#1c1b1b]">{rep.issuedBy}</div>
                                <div className="text-[10.5px] font-mono text-[#0050d6]">{rep.accreditationNumber}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#a3cfb1]">
                                  {rep.docType || 'Lab Report'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedReportForPreview(rep);
                                      setActivePreviewTab('Document');
                                      setPreviewZoom(1);
                                    }}
                                    className="p-1.5 bg-[#fde7f3] text-[#b90064] hover:bg-[#b90064] hover:text-white rounded-lg transition-all cursor-pointer"
                                    title="Preview Scanned Lab Sheet"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => showToast(`Downloading ${rep.title}...`)}
                                    className="p-1.5 bg-[#f0edec] text-[#594047] hover:bg-[#1c1b1b] hover:text-white rounded-lg transition-all cursor-pointer"
                                    title="Download PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  {rep.id.toString().startsWith('custom-') && (
                                    <button
                                      onClick={() => {
                                        setReportsList(reportsList.filter(r => r.id !== rep.id));
                                        showToast('Custom lab report deleted from ledger.');
                                      }}
                                      className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Featured Formulations / Product Catalog Section */}
      <section className="py-12 md:py-16 px-4 md:px-10 max-w-[1440px] mx-auto bg-[#fcf9f8] rounded-3xl mb-16 border border-[#e8e8e8]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <span className="text-[11px] font-extrabold text-[#b90064] uppercase tracking-widest bg-[#fde7f3] px-3 py-1 rounded-full inline-block mb-2">
              Ready to Label
            </span>
            <h2 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">
              Featured Formulations
            </h2>
            <p className="text-[13.5px] text-[#594047] font-medium mt-1">
              High-demand base formulas available for immediate OEM customization.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-[#b90064] font-bold text-[13px] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Product Catalog</span>
            </button>
          </div>
        </div>

        {/* Formulations Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
                alt="Radiance Vit-C Serum"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="absolute top-5 right-5 bg-white/90 rounded-full p-2 shadow-xs hover:bg-[#fde7f3] transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#b90064] text-[#b90064]' : 'text-[#8c7077]'}`} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Skincare • Serum
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Radiance Vit-C Serum</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  15% L-Ascorbic Acid + Hyaluronic Acid &amp; Ferulic. Shelf Life: 24 Months.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹350 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K–5K pcs</span>
                    <span className="font-bold text-[#b90064]">₹280 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Radiance Vit-C Serum Formula RFQ',
                        supplierName: 'Aura Labs & Manufacturing',
                        priceRange: '₹280 - ₹350 / unit'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                  title="View Formula Specs"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80"
                alt="Lumina Radiance Foundation"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Cosmetics • Complexion
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Lumina Foundation</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  SPF 30 / PA+++. 40 Inclusive Shade range. Sweat-resistant lightweight coverage.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹420 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K+ pcs</span>
                    <span className="font-bold text-[#b90064]">₹380 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Lumina Foundation Base RFQ',
                        supplierName: 'Aura Labs & Manufacturing'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300 border border-[#e8e8e8] flex flex-col justify-between group">
            <div className="aspect-square bg-[#fdf8f8] overflow-hidden relative p-3">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
                alt="Restorative Keratin Mask"
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">
                  Haircare • Treatment
                </span>
                <h4 className="text-base font-bold text-[#1c1b1b] mb-1">Keratin Repair Mask</h4>
                <p className="text-[12.5px] text-[#594047] mb-4 line-clamp-2">
                  Pure Argan Oil &amp; Organic Shea Butter. Sulfate &amp; Paraben free salon formula.
                </p>

                <div className="space-y-1.5 mb-4 bg-[#fcf9f8] p-3 rounded-xl border border-[#e8e8e8] text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">500–1K pcs</span>
                    <span className="font-bold text-[#b90064]">₹290 / unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8c7077]">1K+ pcs</span>
                    <span className="font-bold text-[#b90064]">₹240 / unit</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenEnquiryModal) {
                      onOpenEnquiryModal({
                        title: 'Keratin Repair Mask RFQ',
                        supplierName: 'Aura Labs & Manufacturing'
                      });
                    } else {
                      setIsRfqModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2.5 rounded-xl font-bold text-[12.5px] transition-colors cursor-pointer"
                >
                  Send RFQ
                </button>
                <button
                  onClick={() => showToast('Sample formula specs copied!')}
                  className="px-3 py-2.5 border border-[#e8e8e8] rounded-xl text-[#1c1b1b] hover:bg-[#f0edec] transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-4 h-4 text-[#b90064]" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: View Catalog Launcher */}
          <div className="bg-white rounded-2xl overflow-hidden border border-dashed border-[#b90064]/40 hover:border-[#b90064] transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer group hover:bg-[#fde7f3]/20">
            <div className="w-14 h-14 rounded-full bg-[#fde7f3] text-[#b90064] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[#1c1b1b] mb-1">View 124+ Formulas</h4>
            <p className="text-[12.5px] text-[#594047] mb-4">
              Explore complete formulation library with MOQs and pricing tiers.
            </p>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="text-[#b90064] font-bold text-[13px] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Browse Full Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Similar Verified Suppliers Section */}
      <section className="pb-16 px-4 md:px-10 max-w-[1440px] mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1c1b1b] mb-1">
              Similar Verified Suppliers
            </h2>
            <p className="text-[13.5px] text-[#594047] font-medium">
              Top-rated OEM &amp; private label manufacturing partners in Western India.
            </p>
          </div>
          {onNavigateToDirectory && (
            <button
              onClick={onNavigateToDirectory}
              className="text-[#b90064] font-bold text-[13px] hover:underline cursor-pointer"
            >
              View All Suppliers
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Similar Card 1 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Lumina Skin Labs</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Mumbai
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Organic Skincare &amp; Herbal OEM Formulations with ISO 9001.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">500 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 98%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Lumina Skin Labs Direct Inquiry',
                      supplierName: 'Lumina Skin Labs'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>

          {/* Similar Card 2 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">PureEssence Mfg</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Delhi NCR
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Bulk Essential Oils, Cold Pressed Actives &amp; Serum Bases.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">1,000 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 95%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'PureEssence Mfg Direct Inquiry',
                      supplierName: 'PureEssence Mfg'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>

          {/* Similar Card 3 */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-6 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-1.5 text-[#b90064] text-[12px] font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4 fill-[#b90064] text-white" />
                  <span>Nexora Verified</span>
                </div>
                <h3 className="text-lg font-bold text-[#1c1b1b]">Velvet Touch</h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#8c7077] bg-[#f0edec] px-2.5 py-0.5 rounded-full">
                Mumbai
              </span>
            </div>

            <p className="text-[12.5px] text-[#594047] mb-4">
              Luxury Color Cosmetics, Matte Lipsticks &amp; Highlighters.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[12px]">
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Min Order</span>
                <span className="font-bold text-[#1c1b1b]">500 units</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c7077] uppercase font-bold block">Response</span>
                <span className="font-bold text-[#00875a]">&gt; 97%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onOpenEnquiryModal) {
                    onOpenEnquiryModal({
                      title: 'Velvet Touch Cosmetics Direct Inquiry',
                      supplierName: 'Velvet Touch'
                    });
                  } else {
                    setIsRfqModalOpen(true);
                  }
                }}
                className="flex-1 bg-[#b90064] hover:bg-[#8e004b] text-white py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
              >
                Contact
              </button>
              {onNavigateToDirectory && (
                <button
                  onClick={onNavigateToDirectory}
                  className="flex-1 border border-[#e8e8e8] text-[#1c1b1b] hover:bg-[#f0edec] py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e8e8e8] p-3.5 md:hidden z-40 flex gap-3 shadow-lg">
        <button
          onClick={() => {
            if (onOpenRFQModal) onOpenRFQModal();
            else setIsRfqModalOpen(true);
          }}
          className="flex-1 bg-[#b90064] text-white py-3 rounded-xl font-bold text-[13.5px] hover:bg-[#8e004b] transition-colors flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" />
          <span>Request Quote</span>
        </button>
        <button
          onClick={() => {
            const message = encodeURIComponent('Hello Aura Labs & Manufacturing, I found your profile on Nexora Luxe. I would like to discuss a potential B2B enquiry.');
            window.open(`https://wa.me/919820155443?text=${message}`, '_blank');
          }}
          className="p-3 bg-[#25D366] text-white rounded-xl hover:bg-[#20bd5a] transition-colors flex items-center justify-center shadow-xs cursor-pointer"
          title="WhatsApp Supplier"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (onOpenEnquiryModal) {
              onOpenEnquiryModal({
                title: 'Aura Labs Mobile Inquiry',
                supplierName: 'Aura Labs & Manufacturing'
              });
            } else {
              setIsRfqModalOpen(true);
            }
          }}
          className="p-3 border border-[#b90064] text-[#b90064] rounded-xl hover:bg-[#fde7f3] transition-colors flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Corporate Brochure PDF Modal (`doc-modal`) */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8e8e8]">
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-[#f0edec] bg-[#fcf9f8]">
              <h3 className="font-bold text-[16px] text-[#1c1b1b] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#b90064]" />
                <span>Aura Labs Corporate Brochure &amp; Technical Specs</span>
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#f0edec] p-6 md:p-8 flex items-center justify-center overflow-y-auto min-h-[360px]">
              <div className="bg-white w-full max-w-xl aspect-[1/1.3] shadow-md p-8 md:p-12 flex flex-col items-center justify-center text-center border border-[#e8e8e8] rounded-2xl relative">
                <div className="w-16 h-16 bg-[#fde7f3] rounded-full flex items-center justify-center mb-4 text-[#b90064]">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#1c1b1b] mb-2">Aura Labs Corporate Dossier</h2>
                <p className="text-[13px] text-[#594047] max-w-md leading-relaxed">
                  Comprehensive overview of facility certifications (WHO-GMP, ISO 22716, US-FDA), formula library specs, MOQ tiers, and export delivery terms.
                </p>
                <div className="mt-6 py-1.5 px-4 bg-[#f0edec] rounded-full text-[11.5px] font-bold text-[#8c7077]">
                  Page 1 of 12 (Verified PDF)
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#f0edec] bg-white flex justify-end gap-3">
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-[#e8e8e8] text-[#594047] hover:bg-[#f0edec] transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setIsDocModalOpen(false);
                  showToast('Corporate Brochure PDF downloaded to device!');
                }}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF (4.2 MB)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier RFQ & Direct Quote Modal (`rfq-modal`) */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#e8e8e8]">
            <div className="flex justify-between items-center p-5 border-b border-[#f0edec] bg-[#fcf9f8]">
              <div>
                <h3 className="font-bold text-lg text-[#1c1b1b]">Request Custom Quote &amp; Send Enquiry</h3>
                <p className="text-[12px] text-[#8c7077]">Direct inquiry to Aura Labs &amp; Manufacturing</p>
              </div>
              <button
                onClick={() => setIsRfqModalOpen(false)}
                className="p-1.5 text-[#8c7077] hover:text-[#1c1b1b] hover:bg-[#f0edec] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRfqSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-bold text-[#1c1b1b]">Product Interest</label>
                  <select
                    value={rfqProductInterest}
                    onChange={(e) => setRfqProductInterest(e.target.value)}
                    className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                  >
                    <option>Skincare • Serum Base</option>
                    <option>Cosmetics • Foundation</option>
                    <option>Haircare • Treatment</option>
                    <option>Custom Formulation R&amp;D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-bold text-[#1c1b1b]">Estimated Order Volume</label>
                  <input
                    type="text"
                    required
                    value={rfqVolume}
                    onChange={(e) => setRfqVolume(e.target.value)}
                    placeholder="e.g., 10,000 units"
                    className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-[#1c1b1b]">Message &amp; Custom Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={rfqMessage}
                  onChange={(e) => setRfqMessage(e.target.value)}
                  placeholder="Detail your target launch date, active ingredient preferences, packaging specifications, or target price..."
                  className="w-full rounded-xl border border-[#e8e8e8] bg-white text-[13px] p-2.5 focus:ring-1 focus:ring-[#b90064] font-medium"
                />
              </div>

              {/* Multi-file Dropzone */}
              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-[#1c1b1b]">Technical Artwork &amp; Specs</label>
                <div
                  onClick={() => {
                    setUploadedFile('custom_formula_brief_v1.pdf');
                    showToast('File custom_formula_brief_v1.pdf attached!');
                  }}
                  className="border-2 border-dashed border-[#e8e8e8] bg-[#fcf9f8] hover:bg-[#f0edec] transition-colors rounded-xl p-5 text-center cursor-pointer flex flex-col items-center"
                >
                  <UploadCloud className="w-8 h-8 text-[#b90064] mb-1.5" />
                  <div className="text-[13px] font-bold text-[#1c1b1b]">Click to upload or drag &amp; drop artwork</div>
                  <div className="text-[11.5px] text-[#8c7077] mt-0.5">
                    Technical specs, packaging artwork, or formula brief (PDF, PNG, JPG up to 10MB)
                  </div>
                </div>

                {/* Uploaded File Progress Bar */}
                {uploadedFile && (
                  <div className="bg-[#fdf8f8] border border-[#e8e8e8] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#fde7f3] flex items-center justify-center text-[#b90064] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[12px] font-bold text-[#1c1b1b]">{uploadedFile}</span>
                        <span className="text-[10px] font-bold text-[#00875a]">100% Uploaded</span>
                      </div>
                      <div className="w-full bg-[#e8e8e8] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00875a] h-1.5 rounded-full w-full"></div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#00875a] shrink-0" />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#f0edec]">
                <button
                  type="button"
                  onClick={() => setIsRfqModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold border border-[#e8e8e8] text-[#594047] hover:bg-[#f0edec]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#b90064] text-white hover:bg-[#8e004b] flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🛡️ Document Verification Viewer Modal (`selectedReportForPreview`) */}
      {selectedReportForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 animate-in fade-in-50">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-[#e8e8e8] animate-in zoom-in-95 duration-200">
            
            {/* Left Pane: Interactive Document Previewer */}
            <div className="flex-1 bg-zinc-900 flex flex-col justify-between overflow-hidden relative select-none">
              
              {/* Toolbar */}
              <div className="bg-zinc-950/80 backdrop-blur-md p-3 border-b border-zinc-800 flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11.5px] font-bold text-zinc-300 uppercase tracking-wider">
                    {selectedReportForPreview.type} — SECURED PREVIEW
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.15))}
                    className="p-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[11.5px] font-mono text-zinc-400 px-2 min-w-[48px] text-center">
                    {Math.round(previewZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setPreviewZoom(Math.min(2.0, previewZoom + 0.15))}
                    className="p-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewZoom(1.0)}
                    className="p-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer ml-1"
                    title="Reset Zoom"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                  <button
                    onClick={() => {
                      showToast('Preparing document for secure high-resolution print stream...');
                      setTimeout(() => showToast('Print dialog initiated.'), 1200);
                    }}
                    className="p-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                    title="Secure High-Res Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Viewer Canvas (Scrollable viewport) */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative bg-zinc-950/40 pattern-grid">
                <div
                  className="transition-transform duration-200 ease-out origin-center shrink-0"
                  style={{ transform: `scale(${previewZoom})` }}
                >
                  {/* Styled Scanned Paper Container */}
                  <div className="bg-white text-zinc-900 w-[580px] min-h-[760px] p-10 shadow-2xl relative border-8 border-double border-zinc-300/80 rounded-sm select-text flex flex-col justify-between text-left">
                    
                    {/* Watermark Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-3">
                      <div className="text-[#00875a] font-black text-6xl tracking-widest uppercase border-12 border-dashed border-[#00875a]/30 p-4 rounded-3xl -rotate-25 whitespace-nowrap">
                        NEXORA SECURE VERIFIED
                      </div>
                    </div>

                    {/* Cert header */}
                    <div className="text-center pb-6 border-b border-zinc-200">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-600 flex items-center justify-center bg-amber-50">
                          <ShieldCheck className="w-7 h-7 text-amber-600 fill-amber-600/15" />
                        </div>
                      </div>
                      <h1 className="font-extrabold text-[14px] uppercase tracking-[0.15em] text-zinc-600">
                        Official Laboratory &amp; Accreditation Record
                      </h1>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        REGISTRAR AUDIT CODE: {selectedReportForPreview.accreditationNumber}
                      </p>
                    </div>

                    {/* Document Content Dependent on Type */}
                    <div className="flex-1 py-8 space-y-6">
                      
                      {/* Section 1: Certificate Name */}
                      <div className="text-center">
                        <span className="text-[11px] font-extrabold uppercase text-amber-700 bg-amber-50 border border-amber-300/40 px-3 py-1 rounded-full inline-block">
                          {selectedReportForPreview.type} Certification
                        </span>
                        <h2 className="text-lg font-black text-zinc-950 mt-2.5 tracking-tight leading-snug">
                          {selectedReportForPreview.title}
                        </h2>
                      </div>

                      {/* Dynamic Content Details */}
                      {selectedReportForPreview.title.includes('Heavy Metals') || selectedReportForPreview.docType?.includes('Heavy Metal') ? (
                        <div className="space-y-4">
                          <p className="text-[11.5px] text-zinc-600 leading-relaxed text-center">
                            This analytical ledger certifies that the batch specified below has been assayed via ICP-MS spectrometry for toxicologically significant heavy metals, and conforms perfectly to USP &lt;233&gt; standards.
                          </p>
                          <div className="border border-zinc-300 rounded-xl overflow-hidden bg-zinc-50">
                            <table className="w-full text-left text-[11px] font-medium text-zinc-600">
                              <thead>
                                <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-800">
                                  <th className="py-2.5 px-3">Analyzed Element</th>
                                  <th className="py-2.5 px-3">Assayed Value</th>
                                  <th className="py-2.5 px-3">Standard Limit</th>
                                  <th className="py-2.5 px-3 text-right">Result</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                <tr>
                                  <td className="py-2 px-3 font-semibold text-zinc-950">Lead (Pb)</td>
                                  <td className="py-2 px-3 font-mono">&lt; 0.05 ppm</td>
                                  <td className="py-2 px-3 text-zinc-400">&lt; 10.0 ppm</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">100% PASS</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-semibold text-zinc-950">Arsenic (As)</td>
                                  <td className="py-2 px-3 font-mono">&lt; 0.01 ppm</td>
                                  <td className="py-2 px-3 text-zinc-400">&lt; 2.0 ppm</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">100% PASS</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-semibold text-zinc-950">Mercury (Hg)</td>
                                  <td className="py-2 px-3 font-mono">&lt; 0.005 ppm</td>
                                  <td className="py-2 px-3 text-zinc-400">&lt; 1.0 ppm</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">100% PASS</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-semibold text-zinc-950">Cadmium (Cd)</td>
                                  <td className="py-2 px-3 font-mono">&lt; 0.01 ppm</td>
                                  <td className="py-2 px-3 text-zinc-400">&lt; 3.0 ppm</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">100% PASS</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : selectedReportForPreview.title.includes('Stability') || selectedReportForPreview.docType?.includes('Stability') ? (
                        <div className="space-y-4">
                          <p className="text-[11.5px] text-zinc-600 leading-relaxed text-center">
                            Accelerated physical, chemical, and organoleptic stability profile calculated over 24 months in a climate chamber configured at 40°C / 75% relative humidity (RH).
                          </p>
                          <div className="border border-zinc-300 rounded-xl overflow-hidden bg-zinc-50">
                            <table className="w-full text-left text-[11px] font-medium text-zinc-600">
                              <thead>
                                <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-800">
                                  <th className="py-2.5 px-3">Condition Interval</th>
                                  <th className="py-2.5 px-3">Active Potency</th>
                                  <th className="py-2.5 px-3">pH Stability</th>
                                  <th className="py-2.5 px-3 text-right">Physical Integrity</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">Day 0 (Baseline)</td>
                                  <td className="py-2 px-3 font-mono">100.0% Potency</td>
                                  <td className="py-2 px-3 font-mono">pH 5.45</td>
                                  <td className="py-2 px-3 text-right font-semibold text-zinc-800">Conforming</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">6 Months (Accelerated)</td>
                                  <td className="py-2 px-3 font-mono">99.8% Potency</td>
                                  <td className="py-2 px-3 font-mono">pH 5.42</td>
                                  <td className="py-2 px-3 text-right font-semibold text-zinc-800">Conforming</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">12 Months (Accelerated)</td>
                                  <td className="py-2 px-3 font-mono">99.5% Potency</td>
                                  <td className="py-2 px-3 font-mono">pH 5.40</td>
                                  <td className="py-2 px-3 text-right font-semibold text-zinc-800">Conforming</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">24 Months (Accelerated)</td>
                                  <td className="py-2 px-3 font-mono">99.2% Potency</td>
                                  <td className="py-2 px-3 font-mono">pH 5.38</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">PASSED EXCEL</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : selectedReportForPreview.title.includes('Challenge') || selectedReportForPreview.docType?.includes('Challenge') ? (
                        <div className="space-y-4">
                          <p className="text-[11.5px] text-zinc-600 leading-relaxed text-center">
                            Preservative Challenge Efficacy analysis performed under USP &lt;51&gt; category 2 protocols to verify antimicrobial protection over standard inoculation timelines.
                          </p>
                          <div className="border border-zinc-300 rounded-xl overflow-hidden bg-zinc-50">
                            <table className="w-full text-left text-[11px] font-medium text-zinc-600">
                              <thead>
                                <tr className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-800">
                                  <th className="py-2.5 px-3">Pathogen Species</th>
                                  <th className="py-2.5 px-3">Day 7 Log Red.</th>
                                  <th className="py-2.5 px-3">Day 28 Log Red.</th>
                                  <th className="py-2.5 px-3 text-right">USP Compliance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">E. coli (ATCC 8739)</td>
                                  <td className="py-2 px-3 font-mono">&gt; 4.2 Log</td>
                                  <td className="py-2 px-3 font-mono">&gt; 5.0 Log (None)</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">PASSED</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">S. aureus (ATCC 6538)</td>
                                  <td className="py-2 px-3 font-mono">&gt; 4.5 Log</td>
                                  <td className="py-2 px-3 font-mono">&gt; 5.0 Log (None)</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">PASSED</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">P. aeruginosa (ATCC 9027)</td>
                                  <td className="py-2 px-3 font-mono">&gt; 4.8 Log</td>
                                  <td className="py-2 px-3 font-mono">&gt; 5.0 Log (None)</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">PASSED</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-bold text-zinc-950">C. albicans (ATCC 10231)</td>
                                  <td className="py-2 px-3 font-mono">&gt; 3.2 Log</td>
                                  <td className="py-2 px-3 font-mono">&gt; 4.5 Log (None)</td>
                                  <td className="py-2 px-3 text-right font-bold text-emerald-600">PASSED</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        // Standard Gold Border ISO / CDSCO / WHO Certificate layout
                        <div className="border-4 border-[#b90064]/20 p-6 rounded-lg space-y-4 bg-[#fcf9f8]">
                          <p className="text-[12.5px] font-semibold text-zinc-900 text-center leading-relaxed">
                            {selectedReportForPreview.summary}
                          </p>
                          <div className="text-[11.5px] text-zinc-600 space-y-2 font-medium">
                            <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                              <span>Accredited Authority:</span>
                              <span className="font-bold text-zinc-950">{selectedReportForPreview.issuedBy}</span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                              <span>Scope of Certification:</span>
                              <span className="font-semibold text-[#0050d6] text-right truncate max-w-[240px]" title={selectedReportForPreview.scopeOfAudit || 'Aseptic Manufacturing and Cosmetic GMP Quality Control'}>
                                {selectedReportForPreview.scopeOfAudit || 'Aseptic Manufacturing and Cosmetic GMP Quality Control'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                              <span>Audit Standard Compliance:</span>
                              <span className="font-bold text-emerald-600">{selectedReportForPreview.auditScore || '100% Conforming Score'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Registrar Expiry Date:</span>
                              <span className="font-bold text-zinc-950">{selectedReportForPreview.validUntil || 'Dec 31, 2026'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Common Batch Context Footer */}
                      <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-[11px] font-medium text-zinc-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Verified Batch Ledger Target:</span>
                          <span className="font-bold text-zinc-800">{selectedReportForPreview.validUntil || 'Facility Scope Certificate'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cryptographic SHA-256 Ledger Stamp:</span>
                          <span className="font-mono text-[9.5px] text-zinc-700 truncate max-w-[200px]" title={selectedReportForPreview.blockchainHash || '0x6e9f21b7c8a4d0e9a112f438100bcda265fa1a098471bd766a5e12f68b3dc8ef'}>
                            {selectedReportForPreview.blockchainHash || '0x6e9f21b7c8a4d0e9a112f438100bcda265fa1a098471bd766a5e12f68b3dc8ef'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Cert signatures and stamp */}
                    <div className="pt-6 border-t border-zinc-200 flex justify-between items-end">
                      <div className="text-left">
                        <div className="font-mono text-[10px] text-zinc-400">ISSUED BY AUTHORITY</div>
                        <div className="font-bold text-[12px] text-zinc-950 underline decoration-amber-600 mt-1">
                          {selectedReportForPreview.issuedBy.split(' ')[0]} Certified Inspect
                        </div>
                        <div className="text-[9.5px] text-zinc-500">Signatory Compliance Directorate</div>
                      </div>

                      {/* Seal circle */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <div className="w-16 h-16 rounded-full border-2 border-double border-emerald-700 flex flex-col items-center justify-center text-[8px] text-emerald-700 bg-emerald-50 font-extrabold rotate-12 select-none">
                          <span className="text-[6px] tracking-widest">NABL VERIFIED</span>
                          <ShieldCheck className="w-4 h-4 fill-emerald-100" />
                          <span>PASS BATCH</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center text-zinc-500 text-[11px] font-medium">
                Cryptographically audited compliance sheet. Scroll, drag, or pinch to zoom. Official PDF print available in sidebar ledger.
              </div>

            </div>

            {/* Right Pane: Compliance & Verification Sidebar */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#e8e8e8] flex flex-col justify-between bg-[#fcf9f8]">
              
              {/* Header Info */}
              <div className="p-5 border-b border-[#f0edec] bg-white">
                <h3 className="font-black text-[15px] text-[#1c1b1b] flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-[#00875a]" />
                  <span>Trust &amp; Audit Log</span>
                </h3>
                <p className="text-[12px] text-[#594047] font-medium mt-0.5">
                  Secure cryptographic registrar tracking and annual auditing logs.
                </p>
              </div>

              {/* Dynamic Action Tabs */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* Tab buttons */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#f0edec] rounded-xl text-[11px] font-bold">
                  {(['Document', 'AuditLog', 'TrustLedger'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePreviewTab(tab)}
                      className={`py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                        activePreviewTab === tab
                          ? 'bg-white text-[#1c1b1b] shadow-xs'
                          : 'text-[#594047] hover:text-[#1c1b1b]'
                      }`}
                    >
                      {tab === 'Document' ? 'Info' : tab === 'AuditLog' ? 'Audit Log' : 'Ledger'}
                    </button>
                  ))}
                </div>

                {/* Tab content 1: Document Info */}
                {activePreviewTab === 'Document' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-white p-4 rounded-xl border border-[#e8e8e8] space-y-2.5 text-[12px]">
                      <div className="flex justify-between font-semibold text-[#594047]">
                        <span>Title:</span>
                        <span className="font-bold text-[#1c1b1b] text-right max-w-[160px] truncate">{selectedReportForPreview.title}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#594047]">
                        <span>Format:</span>
                        <span className="font-bold text-[#1c1b1b]">Adobe Secure PDF</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#594047]">
                        <span>File Size:</span>
                        <span className="font-bold text-[#1c1b1b]">{selectedReportForPreview.fileSize}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#594047]">
                        <span>Issued On:</span>
                        <span className="font-bold text-[#1c1b1b]">{selectedReportForPreview.issueDate}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-[#594047]">
                        <span>Target Batch:</span>
                        <span className="font-mono font-bold text-[#0050d6]">{selectedReportForPreview.validUntil || 'Facility Global'}</span>
                      </div>
                    </div>

                    <div className="bg-[#e6f4ea] p-4 rounded-xl border border-[#a3cfb1] text-[12.5px] text-[#137333] font-medium space-y-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                        Verified Integrity Check
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-[#137333]/90">
                        This document has been cryptographically scanned. The issuing authority signature and physical seal match the registrar records in the Indian CDSCO database.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab content 2: Audit Logs */}
                {activePreviewTab === 'AuditLog' && (
                  <div className="space-y-3 animate-in fade-in duration-200 text-[12px]">
                    <span className="text-[10px] font-extrabold uppercase text-[#b90064] tracking-wider block">Recent Inspection Timeline</span>
                    
                    <div className="relative pl-5 border-l-2 border-zinc-300 space-y-4">
                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white"></div>
                        <div className="font-bold text-[#1c1b1b]">Annual Physical Audit Completed</div>
                        <div className="text-[11px] text-[#8c7077] font-semibold">Jan 18, 2026 • CDSCO Grade A+</div>
                        <p className="text-[11.5px] text-[#594047] mt-0.5">Cleanroom air particle count test: Class 10,000 verified. Zero particulate contaminants found.</p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white"></div>
                        <div className="font-bold text-[#1c1b1b]">Microbial Lab Recertification</div>
                        <div className="text-[11px] text-[#8c7077] font-semibold">Nov 04, 2025 • NABL Compliance</div>
                        <p className="text-[11.5px] text-[#594047] mt-0.5">Independently certified to perform pathogen challenge tests (USP &lt;51&gt;) in-house.</p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-400 border border-white"></div>
                        <div className="font-bold text-[#1c1b1b]">Pre-Production Routine Audit</div>
                        <div className="text-[11px] text-[#8c7077] font-semibold">Jul 12, 2025 • SGS Inspectorate</div>
                        <p className="text-[11.5px] text-[#594047] mt-0.5">Facility pipeline aseptic clearance validation. Heavy metals trace level calibration confirmed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 3: Registrar Trust Ledger */}
                {activePreviewTab === 'TrustLedger' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-[12px]">
                    <div className="bg-[#0050d6]/5 border border-[#0050d6]/20 p-4 rounded-xl space-y-2">
                      <div className="font-bold text-[#0050d6] flex items-center gap-1.5 text-[12.5px]">
                        <Lock className="w-4 h-4 text-[#0050d6]" />
                        CDSCO Sync Verified
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-zinc-600">
                        This certificate is synchronized with the central CDSCO Quality Registry via secure cryptographic hash ledgering.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-[#8c7077] uppercase tracking-wider block">Registrar Ledger Details</span>
                      <div className="bg-white p-3.5 rounded-xl border border-[#e8e8e8] space-y-2 font-mono text-[10.5px] text-zinc-600">
                        <div>
                          <div className="text-[9px] font-extrabold text-zinc-400 uppercase">LEDGER SYNC TIMESTAMP</div>
                          <div className="font-bold text-zinc-800">{selectedReportForPreview.registrarSync || 'Aug 16, 2026 - 17:00:25 GMT'}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-extrabold text-zinc-400 uppercase">BLOCKCHAIN SHA-256 HASH</div>
                          <div className="font-bold text-[#0050d6] break-all">
                            {selectedReportForPreview.blockchainHash || '0x6e9f21b7c8a4d0e9a112f438100bcda265fa1a098471bd766a5e12f68b3dc8ef'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-extrabold text-zinc-400 uppercase">TRUST VALIDITY INDEX</div>
                          <div className="font-bold text-emerald-600">99.8% (Absolute Credential Authenticity)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Actions */}
              <div className="p-5 border-t border-[#f0edec] bg-white space-y-2">
                <button
                  onClick={() => {
                    showToast(`Downloading certified file: ${selectedReportForPreview.title}...`);
                  }}
                  className="w-full bg-[#00875a] hover:bg-[#006e49] text-white font-bold text-[13px] py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certified Copy</span>
                </button>
                <button
                  onClick={() => setSelectedReportForPreview(null)}
                  className="w-full bg-white border border-[#e8e8e8] hover:bg-[#f0edec] text-[#594047] font-bold text-[13px] py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Close Document Viewer
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
      {/* Premium Directory Claim Profile Flow Modal */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#e8e8e8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left relative">
            <button 
              type="button"
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {claimStatus === 'idle' && (
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200">
                    <Building2 className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Owner Verification Portal
                    </span>
                    <h3 className="text-lg font-black text-[#1c1b1b] mt-1">Claim Aura Beauty Labs</h3>
                  </div>
                </div>

                <p className="text-[13px] text-[#594047] leading-relaxed mb-6 font-medium">
                  Establish identity to gain administration rights for this directory listing. Verified owners can update pricing, MOQs, respond to RFQs, and chat with buyers.
                </p>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!claimFormName || !claimFormEmail || !claimFormPhone) {
                      showToast("❌ Please complete all required fields");
                      return;
                    }
                    setClaimStatus('submitting');
                    setTimeout(() => {
                      setClaimStatus('success');
                      showToast("⚡ Listing claim registered!");
                    }, 2500);
                  }}
                  className="space-y-4 text-[13px]"
                >
                  <div>
                    <label className="block text-[#1c1b1b] font-bold mb-1.5">Authorized Sourcing Specialist Name *</label>
                    <input 
                      type="text"
                      required
                      value={claimFormName}
                      onChange={(e) => setClaimFormName(e.target.value)}
                      placeholder="e.g. Shalini Sen"
                      className="w-full bg-[#fdfaf9] border border-[#e8d4d8] rounded-xl px-4 py-2.5 text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none focus:ring-2 focus:ring-[#b90064] focus:border-[#b90064] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#1c1b1b] font-bold mb-1.5">Official Corporate Email *</label>
                      <input 
                        type="email"
                        required
                        value={claimFormEmail}
                        onChange={(e) => setClaimFormEmail(e.target.value)}
                        placeholder="shalini@aurabeautylabs.com"
                        className="w-full bg-[#fdfaf9] border border-[#e8d4d8] rounded-xl px-4 py-2.5 text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none focus:ring-2 focus:ring-[#b90064] focus:border-[#b90064] font-medium"
                      />
                      <span className="text-[10px] text-stone-500 block mt-1 font-medium">Must match official company domain.</span>
                    </div>
                    <div>
                      <label className="block text-[#1c1b1b] font-bold mb-1.5">Direct Sourcing Contact Number *</label>
                      <input 
                        type="tel"
                        required
                        value={claimFormPhone}
                        onChange={(e) => setClaimFormPhone(e.target.value)}
                        placeholder="+91 98201 55443"
                        className="w-full bg-[#fdfaf9] border border-[#e8d4d8] rounded-xl px-4 py-2.5 text-[#1c1b1b] placeholder:text-[#8c7077] focus:outline-none focus:ring-2 focus:ring-[#b90064] focus:border-[#b90064] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1c1b1b] font-bold mb-1.5">GSTIN / Business Registration ID (for demo)</label>
                    <input 
                      type="text"
                      value={claimFormGst}
                      onChange={(e) => setClaimFormGst(e.target.value)}
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      className="w-full bg-[#fdfaf9] border border-[#e8d4d8] rounded-xl px-4 py-2.5 text-[#1c1b1b] font-mono focus:outline-none focus:ring-2 focus:ring-[#b90064] focus:border-[#b90064] font-medium"
                    />
                  </div>

                  {/* Drag-and-drop simulated file upload */}
                  <div>
                    <label className="block text-[#1c1b1b] font-bold mb-1.5">Upload Authority Proof (GST Certificate / MoA) *</label>
                    <div 
                      onClick={() => setClaimFormDoc("gst_cert_attachment.pdf")}
                      className="border-2 border-dashed border-[#e8d4d8] hover:border-[#b90064] bg-[#fdfaf9] p-5 rounded-2xl text-center cursor-pointer transition-all"
                    >
                      <UploadCloud className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      {claimFormDoc ? (
                        <div>
                          <span className="text-[12.5px] font-bold text-emerald-700">{claimFormDoc}</span>
                          <p className="text-[10px] text-stone-500 mt-0.5">Click to replace file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-[#1c1b1b] text-[12.5px]">Drag &amp; Drop or Click to Upload</p>
                          <p className="text-[10.5px] text-[#8c7077] mt-0.5">Support PDF, PNG, JPG (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f0edec] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsClaimModalOpen(false)}
                      className="bg-white hover:bg-[#f0edec] border border-[#e8e8e8] text-[#594047] font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit Secure Claim</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {claimStatus === 'submitting' && (
              <div className="p-10 text-center space-y-4">
                <RefreshCw className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
                <h3 className="text-base font-black text-[#1c1b1b]">Verifying Corporate Authority</h3>
                <p className="text-[12.5px] text-[#594047] max-w-sm mx-auto leading-relaxed">
                  Executing secure domain registry lookups and authenticating uploaded GST credentials against registrar databases...
                </p>
              </div>
            )}

            {claimStatus === 'success' && (
              <div className="p-8 md:p-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>

                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Claim Registered Successfully
                </span>

                <h3 className="text-xl font-black text-[#1c1b1b] mt-4 mb-2">Claim ID: NEX-CLAIM-99218</h3>
                <p className="text-[13px] text-[#594047] leading-relaxed mb-6 max-w-md mx-auto">
                  Aura Beauty Labs claim details have been successfully submitted for certification audit. Our legal onboarding cell will audit your authorized domain email (<strong className="text-[#1c1b1b] font-bold">{claimFormEmail}</strong>) and attached GST records within 24 hours.
                </p>

                <div className="bg-[#fcf9f8] rounded-xl p-4 border border-[#e8e8e8] text-left mb-6 space-y-1.5 text-[12px] text-[#594047]">
                  <p>• Candidate: <strong className="text-[#1c1b1b] font-bold">{claimFormName}</strong></p>
                  <p>• Sourcing line: <strong className="text-[#1c1b1b]">{claimFormPhone}</strong></p>
                  <p>• Status: <span className="text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending Registrar Call</span></p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="w-full bg-[#1c1b1b] hover:bg-stone-800 text-white font-extrabold text-[13.5px] py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Return to Supplier Profile
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
