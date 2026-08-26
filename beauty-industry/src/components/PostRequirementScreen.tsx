import React, { useState } from 'react';
import {
  ChevronRight,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
  FlaskConical,
  Layers,
  Upload,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Info,
  Sliders,
  Award,
  Download,
  FolderTree,
  Filter
} from 'lucide-react';
import { db } from '../db/database';
import { CATEGORY_TAXONOMY, getSubcategoriesForCategoryName } from '../data/categories';

interface PostRequirementScreenProps {
  onNavigateToExplore: () => void;
  onNavigateToRFQs?: () => void;
}

export const PostRequirementScreen: React.FC<PostRequirementScreenProps> = ({
  onNavigateToExplore,
  onNavigateToRFQs
}) => {
  // Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Step 1: Requirement Details
  const [requirementType, setRequirementType] = useState<'oem' | 'supply' | 'ingredients' | 'packaging'>('oem');
  const [productName, setProductName] = useState('Vitamin C Brightening Serum (15% Ascorbic Acid)');
  const [category, setCategory] = useState('Skincare');
  const [subcategory, setSubcategory] = useState('Serums & Treatments');
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(['Serums & Treatments']);
  const [selectedVisualRefs, setSelectedVisualRefs] = useState<string[]>(['dropper', 'pump']);
  
  // Dynamic OEM / Formulation
  const [formulaType, setFormulaType] = useState('Custom Formulation');
  const [targetMOQ, setTargetMOQ] = useState('1,000 - 5,000');
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>(['Clean Beauty (Credo Standard)', 'Vegan', 'Cruelty-Free (Leaping Bunny)']);
  
  // Quantities & Commercials
  const [quantity, setQuantity] = useState('2500');
  const [unit, setUnit] = useState('Units');
  const [frequency, setFrequency] = useState<'one-time' | 'recurring'>('one-time');
  const [targetUnitPrice, setTargetUnitPrice] = useState('3.50');
  const [totalBudget, setTotalBudget] = useState('8750');
  
  // Specifications
  const [details, setDetails] = useState(
    'Seeking WHO-GMP certified OEM lab to manufacture 15% L-Ascorbic Acid Serum stabilized with 1% Ferulic Acid & Vitamin E. Fragrance-free, amber glass bottle with UV coating. Target shelf life 24 months.'
  );
  const [requireSamples, setRequireSamples] = useState<'yes' | 'no'>('yes');
  
  // Uploaded Files
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: string; type: string }>>([
    { id: '1', name: 'brand_formulation_brief.pdf', size: '2.4 MB', type: 'pdf' },
    { id: '2', name: 'reference_bottle_packaging.jpg', size: '1.1 MB', type: 'image' }
  ]);

  // Step 2: Supplier Preferences
  const [preferredSupplierTypes, setPreferredSupplierTypes] = useState<string[]>(['Manufacturer / OEM', 'Brand Owner']);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(['India (All Hubs)', 'South Korea']);
  const [requiredCertifications, setRequiredCertifications] = useState<string[]>(['WHO-GMP', 'ISO 22716', 'US FDA Registered']);
  const [preferredResponseTime, setPreferredResponseTime] = useState('Within 24 Hours');
  const [additionalSupplierNotes, setAdditionalSupplierNotes] = useState('Prefer manufacturers with existing export documentation for US/EU markets.');

  // Step 3: Contact Details
  const [buyerName, setBuyerName] = useState('Elena Rostova');
  const [buyerEmail, setBuyerEmail] = useState('elena@auracosmetics.com');
  const [buyerPhone, setBuyerPhone] = useState('+91 98201 44521');
  const [companyName, setCompany] = useState('Aura Cosmetics Ltd.');
  const [deliveryCity, setDeliveryCity] = useState('Mumbai, Maharashtra');

  // Live match and interactive success overlay simulation states
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(45);
  const [progressText, setProgressText] = useState('Notifying 5 matching labs in Europe...');
  
  // Direct Lead Distribution System State
  const [distributionStep, setDistributionStep] = useState<number>(0);
  const [leadLogs, setLeadLogs] = useState<Array<{ time: string; text: string; channel?: 'Email' | 'WhatsApp' | 'Platform'; supplier?: string; status: 'pending' | 'sending' | 'success' }>>([]);
  const [distributionFinished, setDistributionFinished] = useState(false);

  // Error messaging
  const [errorMessage, setErrorMessage] = useState('');

  const rfqReference = `RFQ-847291`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(rfqReference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleInsertTemplate = () => {
    setDetails(
      'Formula Spec: 15% L-Ascorbic Acid + 1% Ferulic Acid + Hyaluronic Acid. Texture: Lightweight fast-absorbing water-gel. Packaging: 30ml Amber Glass Dropper Bottle with Matte Pink Collar. Compliance: Clean Beauty, Vegan, Micro-Biological Challenge Tested. Target Shelf Life: 24 Months.'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type.includes('image') ? 'image' : 'pdf'
      };
      setAttachments([...attachments, newFile]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachments(attachments.filter((f) => f.id !== id));
  };

  const toggleCompliance = (item: string) => {
    if (selectedCompliance.includes(item)) {
      setSelectedCompliance(selectedCompliance.filter((i) => i !== item));
    } else {
      setSelectedCompliance([...selectedCompliance, item]);
    }
  };

  const toggleSupplierType = (item: string) => {
    if (preferredSupplierTypes.includes(item)) {
      setPreferredSupplierTypes(preferredSupplierTypes.filter((i) => i !== item));
    } else {
      setPreferredSupplierTypes([...preferredSupplierTypes, item]);
    }
  };

  const toggleLocation = (loc: string) => {
    if (preferredLocations.includes(loc)) {
      setPreferredLocations(preferredLocations.filter((l) => l !== loc));
    } else {
      setPreferredLocations([...preferredLocations, loc]);
    }
  };

  const toggleCert = (cert: string) => {
    if (requiredCertifications.includes(cert)) {
      setRequiredCertifications(requiredCertifications.filter((c) => c !== cert));
    } else {
      setRequiredCertifications([...requiredCertifications, cert]);
    }
  };

  const handleStep1Next = () => {
    if (!productName.trim() || !quantity.trim()) {
      setErrorMessage('Please provide a product name and sourcing quantity.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim() || !buyerPhone.trim()) {
      setErrorMessage('Please complete your name, business email, and phone number.');
      return;
    }
    setErrorMessage('');
    
    try {
      // Phase 4 Relational Database Write: Public RFQ with Multi-Supplier Lead Distribution
      db.createRFQEnquiry({
        buyer_id: 'buyer-prof-priya',
        supplier_id: null,
        product_id: null,
        requirement_title: productName,
        category: category,
        quantity_required: parseInt(quantity, 10) || 1000,
        quantity_unit: unit,
        target_budget: totalBudget ? parseFloat(totalBudget) : (parseFloat(targetUnitPrice) * (parseInt(quantity, 10) || 1000)),
        delivery_location: deliveryCity,
        details: `${details}\n\nCompliance: ${selectedCompliance.join(', ')}\nPackaging: ${selectedVisualRefs.join(', ')}\nSupplier Notes: ${additionalSupplierNotes}`,
        attachments: attachments.map(a => a.name),
        status: 'new',
        type: 'public_rfq',
        send_to_similar_suppliers: true
      });
    } catch (err) {
      console.warn('[PostRequirementScreen] DB write error handled gracefully', err);
    }

    // Start real-time Lead Distribution System
    setShowSuccessOverlay(true);
    setProgressBarWidth(10);
    setProgressText('Processing specifications and running matching AI...');
    setDistributionFinished(false);
    setDistributionStep(0);

    const initialLogs: Array<{ time: string; text: string; channel?: 'Email' | 'WhatsApp' | 'Platform'; supplier?: string; status: 'pending' | 'sending' | 'success' }> = [
      { time: '13:08:15', text: '🔍 Parsed RFQ brief for ' + productName, status: 'success' },
      { time: '13:08:16', text: '⚙️ Matching requirements against 48 verified beauty-industry manufacturers...', status: 'sending' }
    ];
    setLeadLogs(initialLogs);

    // Timeout chain representing live Lead Pushing
    setTimeout(() => {
      setProgressBarWidth(35);
      setProgressText('3 Match-grade OEM partners targeted.');
      setLeadLogs(prev => [
        ...prev.map(l => l.text.includes('Matching requirements') ? { ...l, status: 'success' as const } : l),
        { time: '13:08:17', text: '🎯 Targeted: Aura Beauty Labs (Mumbai), Dermaglow India (Delhi), Verde Pack Labs (Seoul)', status: 'success' },
        { time: '13:08:18', text: '✉️ Dispatching formal private-label RFQ briefs via automated secure SMTP mailers...', status: 'sending' }
      ]);
    }, 1000);

    setTimeout(() => {
      setProgressBarWidth(65);
      setProgressText('Dispatched email brief packets.');
      setLeadLogs(prev => [
        ...prev.map(l => l.text.includes('Dispatching formal') ? { ...l, status: 'success' as const } : l),
        { time: '13:08:19', text: '📨 SMTP Email sent to aura@aurabeautylabs.com', channel: 'Email', supplier: 'Aura Beauty Labs', status: 'success' },
        { time: '13:08:19', text: '📨 SMTP Email sent to corporate@dermaglow.in', channel: 'Email', supplier: 'Dermaglow India', status: 'success' },
        { time: '13:08:20', text: '💬 Invoking WhatsApp Business API endpoints for automated instant alerts...', status: 'sending' }
      ]);
    }, 2200);

    setTimeout(() => {
      setProgressBarWidth(90);
      setProgressText('WhatsApp notification streams delivered.');
      setLeadLogs(prev => [
        ...prev.map(l => l.text.includes('Invoking WhatsApp') ? { ...l, status: 'success' as const } : l),
        { time: '13:08:21', text: '🟢 WhatsApp alert delivered to Aura Sourcing Desk (+91 98201 55443)', channel: 'WhatsApp', supplier: 'Aura Beauty Labs', status: 'success' },
        { time: '13:08:21', text: '🟢 WhatsApp alert delivered to Dermaglow Sales (+91 98110 33221)', channel: 'WhatsApp', supplier: 'Dermaglow India', status: 'success' },
        { time: '13:08:22', text: '⚡ Injecting lead details directly into Supplier Dashboards...', status: 'sending' }
      ]);
    }, 3400);

    setTimeout(() => {
      setProgressBarWidth(100);
      setProgressText('All notifications pushed successfully!');
      setDistributionFinished(true);
      setLeadLogs(prev => [
        ...prev.map(l => l.text.includes('Injecting lead details') ? { ...l, status: 'success' as const } : l),
        { time: '13:08:23', text: '✨ Direct Lead Distribution Complete! Suppliers notified via Email & WhatsApp.', channel: 'Platform', status: 'success' }
      ]);
    }, 4500);
  };

  return (
    <div className="bg-[#fdf8f8] min-h-screen pb-24 text-[#1c1b1b]">
      <main className="max-w-[1280px] mx-auto px-5 md:px-10 py-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[13px] font-medium text-[#594047] mb-6">
          <button onClick={onNavigateToExplore} className="hover:text-[#b90064] transition-colors cursor-pointer">
            Explore
          </button>
          <ChevronRight className="w-4 h-4 text-[#8c7077]" />
          <span className="text-[#1c1b1b] font-bold">Post Requirement (RFQ)</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#fde7f3] text-[#b90064] text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Screen 10.1 — Public RFQ Form</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1c1b1b] tracking-tight mb-2">
            Tell Us What You Need
          </h1>
          <p className="text-[15px] text-[#594047] max-w-2xl font-medium">
            Provide detailed specifications to get accurate quotes from verified luxury manufacturers and premium beauty suppliers.
          </p>
        </div>

        {/* 3-Step Progress Indicator */}
        {!submitted && (
          <div className="flex items-center justify-between mb-10 relative max-w-3xl mx-auto md:mx-0">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#e8e8e8] rounded-full z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#b90064] rounded-full z-0 transition-all duration-300"
              style={{
                width: currentStep === 1 ? '15%' : currentStep === 2 ? '55%' : '100%'
              }}
            ></div>

            {/* Step 1 Indicator */}
            <div
              onClick={() => setCurrentStep(1)}
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all ${
                  currentStep >= 1
                    ? 'bg-[#b90064] text-white shadow-md ring-4 ring-[#fde7f3]'
                    : 'bg-white border-2 border-[#e8e8e8] text-[#594047]'
                }`}
              >
                1
              </div>
              <span className={`text-[12px] font-bold ${currentStep === 1 ? 'text-[#b90064]' : 'text-[#594047]'}`}>
                Requirement
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div
              onClick={() => currentStep > 1 && setCurrentStep(2)}
              className={`relative z-10 flex flex-col items-center gap-1.5 ${currentStep >= 2 ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all ${
                  currentStep >= 2
                    ? 'bg-[#b90064] text-white shadow-md ring-4 ring-[#fde7f3]'
                    : 'bg-white border-2 border-[#e8e8e8] text-[#594047]'
                }`}
              >
                2
              </div>
              <span className={`text-[12px] font-bold ${currentStep === 2 ? 'text-[#b90064]' : 'text-[#594047]'}`}>
                Supplier Preferences
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div
              onClick={() => currentStep > 2 && setCurrentStep(3)}
              className={`relative z-10 flex flex-col items-center gap-1.5 ${currentStep >= 3 ? 'cursor-pointer' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] transition-all ${
                  currentStep === 3
                    ? 'bg-[#b90064] text-white shadow-md ring-4 ring-[#fde7f3]'
                    : 'bg-white border-2 border-[#e8e8e8] text-[#594047]'
                }`}
              >
                3
              </div>
              <span className={`text-[12px] font-bold ${currentStep === 3 ? 'text-[#b90064]' : 'text-[#594047]'}`}>
                Review &amp; Submit
              </span>
            </div>
          </div>
        )}

        {/* Success Confirmation View */}
        {submitted ? (
          <div className="bg-white rounded-3xl border border-[#e8e8e8] shadow-lg p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#e6f4ea] text-[#00875a] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00875a] bg-[#e6f4ea] px-3 py-1 rounded-full">
                Sourcing Request Published
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1c1b1b] mt-3">
                Requirement Posted Successfully!
              </h2>
              <p className="text-[14px] text-[#594047] font-medium mt-2">
                Your RFQ has been broadcasted to <strong className="text-[#1c1b1b]">38+ verified manufacturers</strong> matching your exact specifications.
              </p>
            </div>

            {/* Reference Box */}
            <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-2xl p-5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[11px] font-bold text-[#8c7077] uppercase tracking-wider">
                  RFQ Reference Number
                </p>
                <p className="text-lg font-extrabold text-[#b90064] font-mono mt-0.5">
                  {rfqReference}
                </p>
              </div>
              <button
                onClick={handleCopyRef}
                className="bg-white border border-[#e8e8e8] hover:border-[#b90064] text-[#1c1b1b] font-bold text-[12px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedRef ? <Check className="w-4 h-4 text-[#00875a]" /> : <Copy className="w-4 h-4 text-[#b90064]" />}
                <span>{copiedRef ? 'Copied' : 'Copy Ref'}</span>
              </button>
            </div>

            <div className="bg-[#fde7f3]/50 border border-[#b90064]/20 rounded-2xl p-4 text-left text-[13px] text-[#594047] space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#b90064]">
                <Clock className="w-4 h-4" />
                <span>What Happens Next?</span>
              </div>
              <p className="leading-relaxed">
                • Verified suppliers will review your formula specs and packaging criteria.<br />
                • You will receive direct quotes and sample offers in your <strong className="text-[#1c1b1b]">Buyer Workspace</strong> within 24 hours.<br />
                • Free benchmark samples will be dispatched upon request confirmation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto bg-white hover:bg-[#f1edec] border border-[#e8e8e8] text-[#1c1b1b] font-bold text-[13.5px] px-6 py-3.5 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Post Another Requirement
              </button>
              <button
                onClick={onNavigateToRFQs || onNavigateToExplore}
                className="w-full sm:w-auto bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13.5px] px-7 py-3.5 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track in Buyer Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Form Card Container */
          <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-3xl border border-[#e8e8e8] shadow-md p-6 md:p-10 space-y-10 relative overflow-hidden">
            
            {errorMessage && (
              <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a] text-[#93000a] text-[13.5px] font-semibold rounded-2xl flex items-center gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: REQUIREMENT DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-10 animate-in fade-in duration-200">
                
                {/* 1. Requirement Type Selection */}
                <section className="space-y-4">
                  <h2 className="text-lg font-extrabold text-[#1c1b1b] tracking-tight">
                    What type of requirement are you posting?
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Option 1: Product Supply */}
                    <div
                      onClick={() => setRequirementType('supply')}
                      className={`relative h-44 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-4 flex flex-col justify-between ${
                        requirementType === 'supply'
                          ? 'border-[#b90064] ring-4 ring-[#fde7f3] shadow-sm'
                          : 'border-[#e8e8e8] hover:border-[#b90064]/50'
                      }`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80"
                        alt="Product Supply"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="relative z-10 flex justify-end">
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          requirementType === 'supply' ? 'bg-[#b90064] border-white text-white' : 'border-white/80 bg-black/40'
                        }`}>
                          {requirementType === 'supply' && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <div className="relative z-10 text-white flex items-center gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                        <Package className="w-5 h-5 text-[#ffd9e2]" />
                        <span className="text-[13px] font-bold">Product Supply</span>
                      </div>
                    </div>

                    {/* Option 2: OEM / Custom (Popular) */}
                    <div
                      onClick={() => setRequirementType('oem')}
                      className={`relative h-44 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-4 flex flex-col justify-between ${
                        requirementType === 'oem'
                          ? 'border-[#b90064] ring-4 ring-[#fde7f3] shadow-sm'
                          : 'border-[#e8e8e8] hover:border-[#b90064]/50'
                      }`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80"
                        alt="OEM Formulation"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="relative z-10 flex justify-between items-center">
                        <span className="bg-[#b90064] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-xs">
                          Popular
                        </span>
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          requirementType === 'oem' ? 'bg-[#b90064] border-white text-white' : 'border-white/80 bg-black/40'
                        }`}>
                          {requirementType === 'oem' && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <div className="relative z-10 text-white flex items-center gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                        <FlaskConical className="w-5 h-5 text-[#ffd9e2]" />
                        <span className="text-[13px] font-bold">OEM / Custom</span>
                      </div>
                    </div>

                    {/* Option 3: Raw Ingredients */}
                    <div
                      onClick={() => setRequirementType('ingredients')}
                      className={`relative h-44 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-4 flex flex-col justify-between ${
                        requirementType === 'ingredients'
                          ? 'border-[#b90064] ring-4 ring-[#fde7f3] shadow-sm'
                          : 'border-[#e8e8e8] hover:border-[#b90064]/50'
                      }`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1608248597260-231a4731a591?auto=format&fit=crop&w=500&q=80"
                        alt="Raw Ingredients"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="relative z-10 flex justify-end">
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          requirementType === 'ingredients' ? 'bg-[#b90064] border-white text-white' : 'border-white/80 bg-black/40'
                        }`}>
                          {requirementType === 'ingredients' && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <div className="relative z-10 text-white flex items-center gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                        <Sparkles className="w-5 h-5 text-[#ffd9e2]" />
                        <span className="text-[13px] font-bold">Raw Ingredients</span>
                      </div>
                    </div>

                    {/* Option 4: Packaging */}
                    <div
                      onClick={() => setRequirementType('packaging')}
                      className={`relative h-44 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all p-4 flex flex-col justify-between ${
                        requirementType === 'packaging'
                          ? 'border-[#b90064] ring-4 ring-[#fde7f3] shadow-sm'
                          : 'border-[#e8e8e8] hover:border-[#b90064]/50'
                      }`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80"
                        alt="Packaging"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="relative z-10 flex justify-end">
                        <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          requirementType === 'packaging' ? 'bg-[#b90064] border-white text-white' : 'border-white/80 bg-black/40'
                        }`}>
                          {requirementType === 'packaging' && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                      <div className="relative z-10 text-white flex items-center gap-2 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                        <Layers className="w-5 h-5 text-[#ffd9e2]" />
                        <span className="text-[13px] font-bold">Packaging</span>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-[#f0edec]" />

                {/* 2. Basic Product Details */}
                <section className="space-y-6">
                  <h2 className="text-lg font-extrabold text-[#1c1b1b]">Product Details</h2>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-[#1c1b1b] flex items-center justify-between">
                      <span>Product Name / Specific Requirement <span className="text-[#ba1a1a]">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Vitamin C Brightening Serum (15% Ascorbic Acid)"
                      className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-2 focus:ring-[#fde7f3] rounded-xl px-4 py-3.5 text-[14px] font-medium text-[#1c1b1b] outline-none transition-all"
                    />
                  </div>

                  {/* Selection Path Visual Feedback Banner */}
                  <div className="bg-[#FAF1F5] border border-[#F0D5E3] rounded-2xl p-4 space-y-2 transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-[11.5px] font-extrabold text-[#594047] tracking-wider uppercase">
                        <FolderTree className="w-4 h-4 text-[#b90064]" />
                        <span>Active Taxonomy Path</span>
                      </div>
                      {selectedSubcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubcategories([]);
                            setSubcategory('');
                          }}
                          className="text-[11px] font-bold text-[#b90064] hover:underline cursor-pointer"
                        >
                          Clear Selection ({selectedSubcategories.length})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[13px]">
                      <span className="bg-white text-[#b90064] font-extrabold px-3 py-1.5 rounded-lg border border-[#f0d5e3] shadow-2xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#b90064]" />
                        {category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#b90064]/60 shrink-0" />
                      {selectedSubcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {selectedSubcategories.map((subItem) => (
                            <span
                              key={subItem}
                              className="bg-[#b90064] text-white font-bold px-3 py-1 rounded-lg text-[12px] flex items-center gap-1.5 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              {subItem}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = selectedSubcategories.filter(s => s !== subItem);
                                  setSelectedSubcategories(updated);
                                  setSubcategory(updated[0] || '');
                                }}
                                className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#8d8087] text-[12.5px] italic font-medium">
                          Select one or more subcategories below
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1c1b1b] flex items-center justify-between">
                          <span>Primary Category <span className="text-[#ba1a1a]">*</span></span>
                          <span className="text-[11px] font-semibold text-[#8d8087]">Auto-clears subcategories on change</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => {
                            const newCategory = e.target.value;
                            setCategory(newCategory);
                            // Auto-clear subcategories on main category change
                            setSelectedSubcategories([]);
                            setSubcategory('');
                          }}
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-4 py-3.5 text-[14px] font-medium text-[#1c1b1b] outline-none cursor-pointer transition-all"
                        >
                          {Object.keys(CATEGORY_TAXONOMY).map((catName) => (
                            <option key={catName} value={catName}>
                              {catName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subcategory Multi-Select */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1c1b1b] flex items-center justify-between">
                          <span>Subcategory Multi-Select <span className="text-[#ba1a1a]">*</span></span>
                          <span className="text-[11px] font-extrabold text-[#b90064]">
                            {selectedSubcategories.length} Selected
                          </span>
                        </label>

                        {/* Interactive Pill Chips */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl">
                          {getSubcategoriesForCategoryName(category).map((subItem) => {
                            const isSelected = selectedSubcategories.includes(subItem);
                            return (
                              <button
                                key={subItem}
                                type="button"
                                onClick={() => {
                                  let updated: string[];
                                  if (isSelected) {
                                    updated = selectedSubcategories.filter(s => s !== subItem);
                                  } else {
                                    updated = [...selectedSubcategories, subItem];
                                  }
                                  setSelectedSubcategories(updated);
                                  setSubcategory(updated[0] || '');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#b90064] text-white shadow-2xs border border-[#b90064]'
                                    : 'bg-white text-[#1c1b1b] border border-[#e8e8e8] hover:border-[#b90064] hover:bg-[#faf1f5]'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-[#8d8087] shrink-0" />
                                )}
                                <span>{subItem}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Visual Reference Thumbnails */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b] flex items-center justify-between">
                        <span>Visual References (Style / Texture)</span>
                        <span className="text-[11px] text-[#594047] font-medium uppercase tracking-wider">Select up to 3</span>
                      </label>

                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {[
                          { id: 'dropper', label: 'Dropper', img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80' },
                          { id: 'pump', label: 'Pump Bottle', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80' },
                          { id: 'jar', label: 'Glass Jar', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80' }
                        ].map((ref) => {
                          const isSelected = selectedVisualRefs.includes(ref.id);
                          return (
                            <div
                              key={ref.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedVisualRefs(selectedVisualRefs.filter((r) => r !== ref.id));
                                } else {
                                  setSelectedVisualRefs([...selectedVisualRefs, ref.id]);
                                }
                              }}
                              className={`w-24 h-24 rounded-2xl overflow-hidden border-2 cursor-pointer shrink-0 relative transition-all ${
                                isSelected ? 'border-[#b90064] ring-2 ring-[#fde7f3]' : 'border-[#e8e8e8]'
                              }`}
                            >
                              <img src={ref.img} alt={ref.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20"></div>
                              <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded text-center truncate">
                                {ref.label}
                              </span>
                            </div>
                          );
                        })}

                        <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#e8e8e8] bg-[#fcf9f8] hover:bg-[#f0edec] flex flex-col items-center justify-center text-[#594047] cursor-pointer shrink-0 transition-colors">
                          <Plus className="w-5 h-5 text-[#b90064]" />
                          <span className="text-[10px] font-bold mt-1">Add Own</span>
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Dynamic OEM / Formulation Preferences */}
                {requirementType === 'oem' && (
                  <section className="bg-[#f7f2f2] p-6 md:p-8 rounded-2xl border border-[#e8e8e8] space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#fde7f3] text-[#b90064] flex items-center justify-center font-bold">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#1c1b1b]">Formulation Preferences</h3>
                        <p className="text-[12px] text-[#594047] font-medium">Specify active ingredient profiles and batch specs</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1c1b1b]">Formula Type</label>
                        <select
                          value={formulaType}
                          onChange={(e) => setFormulaType(e.target.value)}
                          className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-4 py-3.5 text-[14px] font-medium text-[#1c1b1b] outline-none cursor-pointer"
                        >
                          <option value="Custom Formulation">Custom Formulation (R&amp;D From Scratch)</option>
                          <option value="White Label / Private Label">White Label (Ready Stock Formula)</option>
                          <option value="Semi-Custom (Base + Actives)">Semi-Custom (Base + Selected Actives)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-[#1c1b1b]">Target MOQ Range</label>
                        <select
                          value={targetMOQ}
                          onChange={(e) => setTargetMOQ(e.target.value)}
                          className="w-full bg-white border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-4 py-3.5 text-[14px] font-medium text-[#1c1b1b] outline-none cursor-pointer"
                        >
                          <option value="500 - 1,000">500 - 1,000 units</option>
                          <option value="1,000 - 5,000">1,000 - 5,000 units</option>
                          <option value="5,000 - 10,000">5,000 - 10,000 units</option>
                          <option value="10,000+">10,000+ units</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b]">Compliance &amp; Certifications Required</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          'Clean Beauty (Credo Standard)',
                          'Vegan',
                          'Cruelty-Free (Leaping Bunny)',
                          'ISO 22716',
                          'WHO-GMP Certified'
                        ].map((item) => {
                          const isChecked = selectedCompliance.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleCompliance(item)}
                              className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                                isChecked
                                  ? 'bg-[#b90064] border-[#b90064] text-white shadow-xs'
                                  : 'bg-white border-[#e8e8e8] text-[#594047] hover:border-[#b90064]'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                <hr className="border-[#f0edec]" />

                {/* 4. Quantity & Commercials */}
                <section className="space-y-6">
                  <h2 className="text-lg font-extrabold text-[#1c1b1b]">Quantity &amp; Budget</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b]">
                        Sourcing Quantity <span className="text-[#ba1a1a]">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="e.g., 2500"
                          className="flex-1 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-4 py-3.5 text-[14px] font-bold text-[#1c1b1b] outline-none"
                        />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-32 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl px-3 py-3.5 text-[13px] font-bold text-[#1c1b1b] outline-none cursor-pointer"
                        >
                          <option value="Units">Units</option>
                          <option value="kg">kg</option>
                          <option value="Liters">Liters</option>
                          <option value="Cartons">Cartons</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b]">Purchase Frequency</label>
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-[13.5px] text-[#1c1b1b]">
                          <input
                            type="radio"
                            name="freq"
                            checked={frequency === 'one-time'}
                            onChange={() => setFrequency('one-time')}
                            className="text-[#b90064] focus:ring-[#b90064] w-4 h-4"
                          />
                          <span>One-time purchase</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-medium text-[13.5px] text-[#1c1b1b]">
                          <input
                            type="radio"
                            name="freq"
                            checked={frequency === 'recurring'}
                            onChange={() => setFrequency('recurring')}
                            className="text-[#b90064] focus:ring-[#b90064] w-4 h-4"
                          />
                          <span>Recurring orders</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b]">Target Unit Price (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7077] font-bold">$</span>
                        <input
                          type="number"
                          step="0.10"
                          value={targetUnitPrice}
                          onChange={(e) => setTargetUnitPrice(e.target.value)}
                          placeholder="e.g. 3.50"
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl pl-8 pr-4 py-3.5 text-[14px] font-bold text-[#1c1b1b] outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-[#1c1b1b]">Total Estimated Budget (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7077] font-bold">$</span>
                        <input
                          type="number"
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(e.target.value)}
                          placeholder="e.g. 8750"
                          className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-xl pl-8 pr-4 py-3.5 text-[14px] font-bold text-[#1c1b1b] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Detailed Specifications & Samples */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-[#1c1b1b]">Requirement Details &amp; Specifications</label>
                    <button
                      type="button"
                      onClick={handleInsertTemplate}
                      className="text-[#b90064] hover:underline font-bold text-[12px] flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Insert Template</span>
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe your exact formulation needs, key active ingredients, texture preferences, fragrance profiles, and any specific packaging compatibility requirements..."
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:ring-2 focus:ring-[#fde7f3] rounded-2xl p-4 text-[13.5px] font-medium text-[#1c1b1b] outline-none resize-y"
                  />

                  {/* Benchmark Samples Toggle */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#fde7f3]/40 border border-[#b90064]/20 p-5 rounded-2xl gap-4">
                    <div>
                      <p className="text-[14px] font-bold text-[#1c1b1b]">Require Benchmark Samples?</p>
                      <p className="text-[12px] text-[#594047] font-medium mt-0.5">
                        Suppliers can offer paid or free sample starter kits prior to full production runs.
                      </p>
                    </div>

                    <div className="flex items-center bg-white border border-[#e8e8e8] rounded-xl overflow-hidden p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setRequireSamples('yes')}
                        className={`px-5 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                          requireSamples === 'yes' ? 'bg-[#b90064] text-white shadow-2xs' : 'text-[#594047] hover:bg-[#f0edec]'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequireSamples('no')}
                        className={`px-5 py-2 text-[12.5px] font-bold rounded-lg transition-all cursor-pointer ${
                          requireSamples === 'no' ? 'bg-[#b90064] text-white shadow-2xs' : 'text-[#594047] hover:bg-[#f0edec]'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </section>

                {/* 6. Attachments Section */}
                <section className="space-y-4">
                  <h3 className="text-[14px] font-bold text-[#1c1b1b]">Attachments (Optional)</h3>

                  <div className="border-2 border-dashed border-[#e8e8e8] hover:border-[#b90064] rounded-2xl p-8 text-center bg-[#fcf9f8] transition-all cursor-pointer group">
                    <label className="cursor-pointer block">
                      <div className="w-14 h-14 rounded-full bg-[#fde7f3] text-[#b90064] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <p className="text-[14px] font-bold text-[#1c1b1b]">Click to upload or drag and drop</p>
                      <p className="text-[12px] text-[#594047] font-medium mt-1">
                        Upload spec sheets, benchmark product photos, or brand guidelines (PDF, JPG, PNG up to 10MB)
                      </p>
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Attachment Preview Cards */}
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {attachments.map((file) => (
                        <div key={file.id} className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-8 h-8 rounded-lg bg-[#fde7f3] text-[#b90064] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-[12px] font-bold text-[#1c1b1b] truncate">{file.name}</p>
                              <p className="text-[10px] text-[#8c7077] font-medium">{file.size}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-[#8c7077] hover:text-[#ba1a1a] p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Navigation CTA */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#f0edec]">
                  <button
                    type="button"
                    onClick={onNavigateToExplore}
                    className="bg-white hover:bg-[#f1edec] text-[#594047] font-bold text-[13.5px] px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleStep1Next}
                    className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13.5px] px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Supplier Preferences</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: SUPPLIER & COMPLIANCE PREFERENCES */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                <div className="border-b border-[#f0edec] pb-4">
                  <h2 className="text-xl font-extrabold text-[#1c1b1b]">Supplier &amp; Location Preferences</h2>
                  <p className="text-[13px] text-[#594047] font-medium mt-0.5">
                    Choose the types of suppliers, geographic manufacturing hubs, and certifications you require.
                  </p>
                </div>

                {/* Preferred Supplier Types */}
                <section className="space-y-3">
                  <label className="text-[13.5px] font-bold text-[#1c1b1b]">Preferred Supplier Types</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      'Manufacturer / OEM',
                      'Wholesaler / Distributor',
                      'Brand Owner',
                      'Exporter'
                    ].map((type) => {
                      const isChecked = preferredSupplierTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() => toggleSupplierType(type)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            isChecked
                              ? 'border-[#b90064] bg-[#fde7f3]/50 text-[#b90064]'
                              : 'border-[#e8e8e8] bg-[#fcf9f8] text-[#1c1b1b] hover:border-[#b90064]/50'
                          }`}
                        >
                          <span className="text-[13px] font-bold">{type}</span>
                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isChecked ? 'bg-[#b90064] border-[#b90064] text-white' : 'border-[#e8e8e8] bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Preferred Locations */}
                <section className="space-y-3">
                  <label className="text-[13.5px] font-bold text-[#1c1b1b]">Geographic Manufacturing Hubs</label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      'India (All Hubs)',
                      'Mumbai / Gujarat Cluster',
                      'South Korea',
                      'Italy',
                      'USA',
                      'France',
                      'Japan'
                    ].map((loc) => {
                      const isChecked = preferredLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                            isChecked
                              ? 'bg-[#b90064] border-[#b90064] text-white shadow-2xs'
                              : 'bg-[#fcf9f8] border-[#e8e8e8] text-[#594047] hover:border-[#b90064]'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{loc}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Required Certifications */}
                <section className="space-y-3">
                  <label className="text-[13.5px] font-bold text-[#1c1b1b]">Required Certifications &amp; Accreditations</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'WHO-GMP Certified',
                      'ISO 22716 (Cosmetics GMP)',
                      'US FDA Registered',
                      'EcoCert Organic',
                      'Halal Certified',
                      'Sedex SMETA Audited'
                    ].map((cert) => {
                      const isChecked = requiredCertifications.includes(cert);
                      return (
                        <div
                          key={cert}
                          onClick={() => toggleCert(cert)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isChecked
                              ? 'border-[#b90064] bg-[#fde7f3]/50 text-[#b90064]'
                              : 'border-[#e8e8e8] bg-[#fcf9f8] text-[#1c1b1b] hover:border-[#b90064]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#b90064]" />
                            <span className="text-[12.5px] font-bold">{cert}</span>
                          </div>
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-[#b90064] border-[#b90064] text-white' : 'border-[#e8e8e8] bg-white'
                          }`}>
                            {isChecked && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Response Time */}
                <section className="space-y-3">
                  <label className="text-[13.5px] font-bold text-[#1c1b1b]">Preferred Response Time</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      'Within 24 Hours',
                      'Within 3 Days',
                      'Within 1 Week'
                    ].map((time) => (
                      <div
                        key={time}
                        onClick={() => setPreferredResponseTime(time)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-center ${
                          preferredResponseTime === time
                            ? 'border-[#b90064] bg-[#fde7f3] text-[#b90064] font-bold'
                            : 'border-[#e8e8e8] bg-[#fcf9f8] text-[#594047] font-semibold hover:border-[#b90064]'
                        }`}
                      >
                        <span className="text-[13px]">{time}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Additional Supplier Notes */}
                <section className="space-y-2">
                  <label className="text-[13.5px] font-bold text-[#1c1b1b]">Additional Vendor Instructions</label>
                  <textarea
                    rows={3}
                    value={additionalSupplierNotes}
                    onChange={(e) => setAdditionalSupplierNotes(e.target.value)}
                    placeholder="Enter any additional requirements, e.g., 'Prefer suppliers with existing export documentation for US/EU markets.'"
                    className="w-full bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] rounded-2xl p-4 text-[13.5px] font-medium text-[#1c1b1b] outline-none"
                  />
                </section>

                {/* Step 2 Actions */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-[#f0edec]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="bg-white hover:bg-[#f1edec] border border-[#e8e8e8] text-[#594047] font-bold text-[13.5px] px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Requirement</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStep2Next}
                    className="bg-[#b90064] hover:bg-[#8e004b] text-white font-bold text-[13.5px] px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-98 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Review &amp; Submit</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: REVIEW & SUBMIT */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                <div className="border-b border-[#f0edec] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#1c1b1b]">Review Sourcing Submission</h2>
                    <p className="text-[13px] text-[#594047] font-medium mt-0.5">
                      Please review your RFQ details before posting. Your request will be instantly matched with qualified premium suppliers.
                    </p>
                  </div>
                  <span className="bg-[#fde7f3] text-[#b90064] text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full self-start md:self-auto">
                    Step 3 of 3
                  </span>
                </div>

                {/* Bento Grid Layout for Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 text-left">
                  
                  {/* Left Column: Details & Buyer Info (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Requirement Summary */}
                    <div className="bg-white/80 backdrop-blur-md border border-[#e8e8e8] rounded-2xl p-6 relative overflow-hidden shadow-2xs group hover:border-[#b90064]/30 transition-all duration-300">
                      {/* Decorative gradient blob */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffb0c8]/20 rounded-full mix-blend-multiply filter blur-2xl opacity-50 pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[16px] font-extrabold text-[#1c1b1b] flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#b90064]" />
                          Requirement Summary
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-[#594047] hover:text-[#b90064] p-1.5 rounded-lg hover:bg-[#fcf9f8] transition-colors"
                          title="Edit Product Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>

                      {/* Selected Classification Path Breadcrumb Indicator */}
                      <div className="bg-[#FAF1F5] border border-[#F0D5E3] rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-[#b90064] shrink-0" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#594047]">Selected Classification Path:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[13px]">
                          <span className="bg-white text-[#1c1b1b] font-bold px-3 py-1 rounded-lg border border-[#e8e8e8] shadow-2xs flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#b90064]" />
                            {category}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#b90064]/60 shrink-0" />
                          {selectedSubcategories.length > 0 ? (
                            selectedSubcategories.map((subItem) => (
                              <span key={subItem} className="bg-[#b90064] text-white font-bold px-3 py-1 rounded-lg text-[12px] shadow-2xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                {subItem}
                              </span>
                            ))
                          ) : (
                            <span className="bg-[#b90064] text-white font-bold px-3 py-1 rounded-lg text-[12px] shadow-2xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              {subcategory || 'General'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 relative z-10">
                        {/* Product Image Card */}
                        <div className="w-full md:w-1/3 bg-[#fcf9f8] rounded-xl p-2.5 border border-[#e8e8e8] shadow-3xs shrink-0 flex flex-col justify-between">
                          <div className="relative h-32 rounded-lg overflow-hidden bg-[#f0edec]">
                            <img
                              alt="Visual Benchmark Reference"
                              className="w-full h-full object-cover"
                              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80"
                            />
                            <div className="absolute inset-0 bg-black/10"></div>
                          </div>
                          <p className="text-[12px] font-bold text-center mt-2.5 text-[#594047] truncate">
                            {category} - {selectedSubcategories.length > 0 ? selectedSubcategories.join(', ') : subcategory || 'All Subcategories'}
                          </p>
                        </div>

                        {/* Specs Grid */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-1 text-[#594047]">
                              <svg className="w-4 h-4 text-[#b90064]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                              </svg>
                              <span className="text-[10.5px] font-extrabold uppercase tracking-wider">Target Volume</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                              <p className="text-[15px] font-extrabold text-[#1c1b1b]">{quantity || '2,500'}</p>
                              <span className="text-[11px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-md ml-1.5">
                                {unit || 'Units'} / {frequency === 'recurring' ? 'Month' : 'Batch'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-1 text-[#594047]">
                              <svg className="w-4 h-4 text-[#0150d6]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.22.11a10.118 10.118 0 008.56 0l.219-.11m-8.56.118L10 16.07a4.5 4.5 0 01-1.13-1.897l8.932-8.931z" />
                              </svg>
                              <span className="text-[10.5px] font-extrabold uppercase tracking-wider">Target Unit Price</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                              <p className="text-[15px] font-extrabold text-[#1c1b1b]">${targetUnitPrice || '3.50'}</p>
                              <span className="text-[11px] font-bold text-[#0150d6] bg-[#dbe1ff] px-2 py-0.5 rounded-md ml-1.5">
                                USD / Unit
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#fcf9f8] p-4 rounded-xl border border-[#e8e8e8] flex flex-col justify-center sm:col-span-2">
                            <div className="flex items-center gap-1.5 mb-1 text-[#594047]">
                              <Clock className="w-4 h-4 text-[#b90064]" />
                              <span className="text-[10.5px] font-extrabold uppercase tracking-wider">Timeline & Launch Strategy</span>
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                              <p className="text-[14px] font-bold text-[#1c1b1b]">Q3 2026 Production Launch</p>
                              <span className="text-[10.5px] font-extrabold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Aggressive
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brief details strip */}
                      <div className="mt-4 pt-4 border-t border-[#f0edec] text-[13px] text-[#594047] leading-relaxed">
                        <strong className="text-[#1c1b1b]">Brief description:</strong> "{details}"
                      </div>
                    </div>

                    {/* Supplier & Location Preferences Summary */}
                    <div className="bg-white/80 backdrop-blur-md border border-[#e8e8e8] rounded-2xl p-6 group hover:border-[#b90064]/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[16px] font-extrabold text-[#1c1b1b] flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#b90064]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                          </svg>
                          Supplier Preferences
                        </h3>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-[#594047] hover:text-[#b90064] p-1.5 rounded-lg hover:bg-[#fcf9f8] transition-colors"
                          title="Edit Supplier Preferences"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2.5 mt-3">
                        {preferredSupplierTypes.map((type) => (
                          <span key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fde7f3] text-[#b90064] font-bold text-[12px] rounded-full border border-[#ffcbd9]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b90064]"></span>
                            {type}
                          </span>
                        ))}
                        {preferredLocations.map((loc) => (
                          <span key={loc} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dbe1ff] text-[#0150d6] font-bold text-[12px] rounded-full border border-[#b4c5ff]">
                            <MapPin className="w-3.5 h-3.5" />
                            {loc}
                          </span>
                        ))}
                        {requiredCertifications.map((cert) => (
                          <span key={cert} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0edec] text-[#1c1b1b] font-bold text-[12px] rounded-full border border-[#e8e8e8]">
                            <Award className="w-3.5 h-3.5 text-[#b90064]" />
                            {cert}
                          </span>
                        ))}
                        {selectedCompliance.map((item) => (
                          <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e2bdc7]/30 text-[#5a3f47] font-bold text-[12px] rounded-full border border-[#e2bdc7]">
                            <Check className="w-3 h-3 text-green-600" />
                            {item}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 font-bold text-[12px] rounded-full border border-green-200">
                          <Clock className="w-3 h-3" />
                          SLA: {preferredResponseTime}
                        </span>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-2xl p-6 relative shadow-3xs">
                      <h3 className="text-[16px] font-extrabold text-[#1c1b1b] mb-6 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#b90064]" />
                        Business Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c7077] absolute -top-2 left-3.5 bg-[#fcf9f8] px-1.5 z-10">
                            Company Name
                          </label>
                          <input
                            className="w-full bg-[#f0edec]/60 text-[#1c1b1b] font-bold text-[13.5px] p-3 rounded-xl border border-[#e8e8e8]/80 outline-none"
                            readOnly
                            type="text"
                            value={companyName}
                          />
                        </div>

                        <div className="relative">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c7077] absolute -top-2 left-3.5 bg-[#fcf9f8] px-1.5 z-10">
                            Contact Person
                          </label>
                          <input
                            className="w-full bg-[#f0edec]/60 text-[#1c1b1b] font-bold text-[13.5px] p-3 rounded-xl border border-[#e8e8e8]/80 outline-none"
                            readOnly
                            type="text"
                            value={buyerName}
                          />
                        </div>

                        <div className="relative">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c7077] absolute -top-2 left-3.5 bg-[#fcf9f8] px-1.5 z-10">
                            Business Email
                          </label>
                          <input
                            className="w-full bg-[#f0edec]/60 text-[#1c1b1b] font-bold text-[13.5px] p-3 rounded-xl border border-[#e8e8e8]/80 outline-none"
                            readOnly
                            type="text"
                            value={buyerEmail}
                          />
                        </div>

                        <div className="relative">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8c7077] absolute -top-2 left-3.5 bg-[#fcf9f8] px-1.5 z-10">
                            Phone / WhatsApp
                          </label>
                          <input
                            className="w-full bg-[#f0edec]/60 text-[#1c1b1b] font-bold text-[13.5px] p-3 rounded-xl border border-[#e8e8e8]/80 outline-none"
                            readOnly
                            type="text"
                            value={buyerPhone}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Distribution Preview & Actions (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Distribution Preview (Matching Suppliers) */}
                    <div className="bg-white/90 border border-[#e8e8e8] rounded-2xl p-6 relative overflow-hidden flex flex-col shadow-2xs group hover:border-[#b90064]/30 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-5">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e6007e] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#b90064]"></span>
                        </span>
                        <h3 className="text-[15px] font-extrabold text-[#1c1b1b]">Live Sourcing Match</h3>
                      </div>
                      
                      <p className="text-[12.5px] text-[#594047] font-medium mb-4 leading-relaxed">
                        Based on your criteria, our network has identified high-potential premium partners.
                      </p>

                      {/* Match Cards List */}
                      <div className="flex flex-col gap-4 mb-5">
                        
                        {/* Match Item 1 */}
                        <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-shadow duration-200 relative group/match">
                          <div className="h-20 overflow-hidden relative">
                            <img
                              alt="Laboratoires Luxe Facility"
                              className="w-full h-full object-cover group-hover/match:scale-105 transition-transform duration-500"
                              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-2 left-3.5 flex gap-1.5">
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-0.5">
                                ISO 22716
                              </span>
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20">
                                🇮🇳 IN / 🇪🇺 EU
                              </span>
                            </div>
                          </div>
                          <div className="p-3 relative">
                            <div className="absolute -top-7 right-3 bg-white rounded-full p-0.5 shadow-sm">
                              <div className="w-9 h-9 rounded-full bg-[#fde7f3] flex items-center justify-center text-[#b90064] font-extrabold text-[12px] border border-[#ffcbd9]">
                                98%
                              </div>
                            </div>
                            <h4 className="font-bold text-[13px] text-[#1c1b1b] truncate pr-12">Laboratoires Luxe</h4>
                            <p className="text-[11px] text-[#594047] font-semibold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0150d6]"></span>
                              Custom Formula & GMP
                            </p>
                          </div>
                        </div>

                        {/* Match Item 2 */}
                        <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-shadow duration-200 relative group/match">
                          <div className="h-20 overflow-hidden relative">
                            <img
                              alt="Verde Pack Automation"
                              className="w-full h-full object-cover group-hover/match:scale-105 transition-transform duration-500"
                              src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-2 left-3.5 flex gap-1.5">
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-0.5">
                                WHO-GMP
                              </span>
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20">
                                🇰🇷 KR / 🇺🇸 US
                              </span>
                            </div>
                          </div>
                          <div className="p-3 relative">
                            <div className="absolute -top-7 right-3 bg-white rounded-full p-0.5 shadow-sm">
                              <div className="w-9 h-9 rounded-full bg-[#fde7f3] flex items-center justify-center text-[#b90064] font-extrabold text-[12px] border border-[#ffcbd9]">
                                94%
                              </div>
                            </div>
                            <h4 className="font-bold text-[13px] text-[#1c1b1b] truncate pr-12">Verde Pack Labs</h4>
                            <p className="text-[11px] text-[#594047] font-semibold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0150d6]"></span>
                              Packaging Vessels
                            </p>
                          </div>
                        </div>

                        {/* Match Item 3 */}
                        <div className="bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl overflow-hidden shadow-3xs hover:shadow-2xs transition-shadow duration-200 relative group/match">
                          <div className="h-20 overflow-hidden relative">
                            <img
                              alt="SwissBio Form Cleanroom"
                              className="w-full h-full object-cover group-hover/match:scale-105 transition-transform duration-500"
                              src="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=400&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-2 left-3.5 flex gap-1.5">
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-0.5">
                                US FDA
                              </span>
                              <span className="bg-black/50 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/20">
                                🇨🇭 CH / 🇮🇳 IN
                              </span>
                            </div>
                          </div>
                          <div className="p-3 relative">
                            <div className="absolute -top-7 right-3 bg-white rounded-full p-0.5 shadow-sm">
                              <div className="w-9 h-9 rounded-full bg-[#fde7f3] flex items-center justify-center text-[#b90064] font-extrabold text-[12px] border border-[#ffcbd9]">
                                89%
                              </div>
                            </div>
                            <h4 className="font-bold text-[13px] text-[#1c1b1b] truncate pr-12">SwissBio Form</h4>
                            <p className="text-[11px] text-[#594047] font-semibold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0150d6]"></span>
                              Cleanroom Formulation
                            </p>
                          </div>
                        </div>

                        {/* More Labs indicator */}
                        <div className="bg-white border border-dashed border-[#e8e8e8] hover:border-[#b90064] rounded-xl p-3 flex items-center justify-center text-center cursor-default transition-all duration-300">
                          <div className="flex items-center gap-1.5 text-[#594047]">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[12.5px] font-extrabold">12 More Labs Available</span>
                          </div>
                        </div>

                      </div>

                      {/* Actions with validation Checkbox */}
                      <div className="mt-auto border-t border-[#f0edec] pt-5">
                        <div className="flex items-start gap-2.5 mb-4">
                          <input
                            required
                            defaultChecked
                            className="mt-0.5 rounded text-[#b90064] focus:ring-[#b90064] border-[#e8e8e8] w-4 h-4 cursor-pointer"
                            id="termsCheck"
                            type="checkbox"
                          />
                          <label className="text-[11.5px] text-[#594047] font-medium leading-relaxed cursor-pointer" htmlFor="termsCheck">
                            By posting this RFQ, you agree to Nexora Luxe's{' '}
                            <a className="text-[#b90064] hover:underline font-bold" href="#">
                              Procurement Terms
                            </a>{' '}
                            &amp; NDA Guidelines.
                          </label>
                        </div>

                        {/* Primary CTA: Submit */}
                        <button
                          type="button"
                          onClick={handleSubmitRFQ}
                          className="w-full bg-[#b90064] hover:bg-[#8e004b] text-white font-extrabold text-[13.5px] py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(185,0,100,0.3)] flex items-center justify-center gap-2 cursor-pointer scale-100 hover:scale-101 active:scale-99"
                        >
                          <span>Post RFQ to Network</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 7.18a14.96 14.96 0 00-6.16 12.12 14.96 14.96 0 0012.12-6.16z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 14.37a6 6 0 005.84 7.38v-4.8M9.59 14.37a14.98 14.98 0 01-6.16-12.12A14.98 14.98 0 0114.37 7.18" />
                          </svg>
                        </button>

                        {/* Secondary CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitted(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full mt-3 bg-transparent text-[#b90064] font-bold text-[13px] py-3 rounded-xl border border-[#b90064] hover:bg-[#fde7f3] transition-colors cursor-pointer text-center"
                        >
                          Save as Draft
                        </button>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Return Buttons */}
                <div className="flex items-center justify-between gap-3 pt-6 border-t border-[#f0edec]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-white hover:bg-[#f1edec] border border-[#e8e8e8] text-[#594047] font-bold text-[13.5px] px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Preferences</span>
                  </button>
                </div>

              </div>
            )}

      {/* SUCCESS OVERLAY (SCREEN 10.3) */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-[#1c1b1b]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-[#e8e8e8] p-6 md:p-10 text-center animate-in zoom-in-95 duration-300">
            
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6 pb-6 border-b border-[#f0edec] text-left">
              <div className="w-16 h-16 bg-[#fde7f3] rounded-full flex items-center justify-center shrink-0 relative">
                <div className="absolute inset-0 border-4 border-[#b90064] rounded-full animate-ping opacity-25"></div>
                <CheckCircle2 className="w-8 h-8 text-[#b90064]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#b90064] bg-[#fde7f3] px-2.5 py-0.5 rounded-full">
                  Direct Sourcing Engine Live
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b] mt-1.5">
                  RFQ Dispatched &amp; Live Lead Pushed!
                </h2>
                <p className="text-[13px] text-[#594047] font-medium leading-relaxed mt-0.5">
                  Your requirements are being distributed directly to verified matching suppliers via automated Email SMTP &amp; official WhatsApp API alerts.
                </p>
              </div>
            </div>

            {/* Progress Tracker and Live Stream Console */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
              
              {/* Left Column: Progress status and supplier badges */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-[#fdf8f8] rounded-2xl p-4 border border-[#e8e8e8] shadow-3xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#1c1b1b]">
                      Lead Distribution
                    </span>
                    <span className="text-[10.5px] font-extrabold text-[#b90064] animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b90064]"></span>
                      {distributionFinished ? 'Pushed' : 'Routing...'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-[#f0edec] rounded-full h-2.5 mb-2 overflow-hidden">
                    <div 
                      className="bg-[#b90064] h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progressBarWidth}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-[11.5px] font-bold text-[#594047] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#b90064] shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                    <span>{progressText}</span>
                  </p>
                </div>

                {/* Targeted Suppliers status card */}
                <div className="bg-white rounded-2xl p-4 border border-[#e8e8e8] space-y-3">
                  <h4 className="text-[10.5px] font-extrabold uppercase tracking-widest text-[#8c7077]">Targeted Recipients</h4>
                  
                  <div className="space-y-2.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#b90064]"></span>
                        <span className="font-bold text-[#1c1b1b]">Aura Beauty Labs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Email SMTP</span>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">WhatsApp</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#b90064]"></span>
                        <span className="font-bold text-[#1c1b1b]">Dermaglow India</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Email SMTP</span>
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">WhatsApp</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8c7077]"></span>
                        <span className="font-bold text-[#1c1b1b]">Verde Pack Labs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">Email SMTP</span>
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">N/A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Terminal logs */}
              <div className="md:col-span-7 flex flex-col h-[280px]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1c1b1b] text-stone-400 rounded-t-xl text-[10px] font-bold uppercase tracking-wider font-mono">
                  <span>System Lead-Push Logs</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="flex-1 bg-[#121111] rounded-b-xl p-4 font-mono text-[11px] text-[#e6f4ea] overflow-y-auto space-y-2.5 no-scrollbar shadow-inner text-left">
                  {leadLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-stone-500 font-bold shrink-0">[{log.time}]</span>
                      <p className="flex-1 text-stone-200">
                        {log.text}
                      </p>
                      {log.status === 'success' && (
                        <span className="text-emerald-400 font-extrabold shrink-0">✔</span>
                      )}
                      {log.status === 'sending' && (
                        <span className="text-[#b90064] font-extrabold shrink-0 animate-pulse">...</span>
                      )}
                    </div>
                  ))}
                  {!distributionFinished && (
                    <div className="text-stone-500 text-[10px] italic animate-pulse">
                      &gt; Awaiting next automated trigger payload dispatch...
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 mt-6 border-t border-[#f0edec]">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessOverlay(false);
                  setSubmitted(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!distributionFinished}
                className={`w-full sm:w-auto font-extrabold text-[13.5px] px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  distributionFinished 
                    ? 'bg-[#b90064] hover:bg-[#8e004b] text-white shadow-md' 
                    : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                }`}
              >
                <span>Continue to RFQ Reference Desk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

          </form>
        )}

      </main>
    </div>
  );
};

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m22 2-7 20-4-9-9-4Z"/>
      <path d="M22 2 11 13"/>
    </svg>
  );
}
