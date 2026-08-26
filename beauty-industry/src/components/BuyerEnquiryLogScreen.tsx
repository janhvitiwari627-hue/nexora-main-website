import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Phone, 
  Mail, 
  Send, 
  Sparkles, 
  Building2, 
  MapPin, 
  ArrowRight, 
  Download, 
  Plus, 
  X, 
  Check, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { BuyerEnquiry } from '../types';
import { BUYER_MOCK_ENQUIRIES } from '../data/mockData';

interface BuyerEnquiryLogScreenProps {
  onBack: () => void;
  onNavigateToChat: (supplierId: string) => void;
  onCallSupplier: (name: string) => void;
  onWhatsAppSupplier: (name: string) => void;
  onNavigateToExplore: () => void;
}

export const BuyerEnquiryLogScreen: React.FC<BuyerEnquiryLogScreenProps> = ({
  onBack,
  onNavigateToChat,
  onCallSupplier,
  onWhatsAppSupplier,
  onNavigateToExplore
}) => {
  const [enquiries, setEnquiries] = useState<BuyerEnquiry[]>(() => {
    const stored = localStorage.getItem('nexora_buyer_enquiries');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return BUYER_MOCK_ENQUIRIES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Responded' | 'Quoted' | 'Closed'>('All');
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(() => {
    return BUYER_MOCK_ENQUIRIES.length > 0 ? BUYER_MOCK_ENQUIRIES[0].id : null;
  });

  // Message Replies simulation
  const [conversations, setConversations] = useState<Record<string, Array<{ sender: 'buyer' | 'supplier'; text: string; time: string }>>>({
    'enq-101': [
      { sender: 'buyer', text: 'Hi Aura Beauty Labs, we need a bulk quote for 200 units of Argan Repair Hair Serum. Do you offer custom private labeling for this batch?', time: '2026-08-14 10:30 AM' },
      { sender: 'supplier', text: 'Hello, thank you for reaching out! Yes, we absolutely offer private labeling for Argan Repair Hair Serum. For a 200-unit batch, we can proceed with our standard packaging and apply your custom branding/labels. We have sent the formal PDF quote and pricing tiers to your email. Please review and let us know if you want any formulation tweaks.', time: '2026-08-14 02:45 PM' }
    ],
    'enq-102': [
      { sender: 'buyer', text: 'Hello, we are interested in your Peptide Barrier Repair Cream. Could we purchase 3 custom samples for laboratory formulation and patch testing? Please advise on the cost.', time: '2026-08-15 11:15 AM' },
      { sender: 'supplier', text: 'Thank you for your interest! Your request is being processed. Our sampling lab is currently reviewing your application and we will notify you once the custom patch testing samples are prepared and dispatched.', time: '2026-08-15 04:00 PM' }
    ],
    'enq-103': [
      { sender: 'buyer', text: 'Dear LuxeForm Packaging, we require custom branding for 30ml Luxury Dropper Bottles. Could you send us the template files and your MOQ requirements for gold-foiling?', time: '2026-08-10 09:00 AM' },
      { sender: 'supplier', text: 'Hello! Thank you for contacting LuxeForm. Yes, gold-foiling is available. The template files for our 30ml bottles have been attached. Quote #LF-8892 has been generated and is now valid for 7 days. Our standard MOQ for custom gold-foiling on glass is 5,000 units, but we can make a one-time concession for 2,000 units.', time: '2026-08-10 03:30 PM' }
    ]
  });

  const [replyText, setReplyText] = useState('');
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);

  // Pricing Negotiation States
  const [negotiations, setNegotiations] = useState<Record<string, {
    stage: 'initial' | 'counter_submitted' | 'supplier_responded' | 'final_accepted' | 'final_declined';
    originalPrice: number;
    currentOfferPrice: number;
    counterPrice: number;
    volume: number;
    remarks: string;
    finalPrice?: number;
  }>>({
    'enq-101': {
      stage: 'initial',
      originalPrice: 195,
      currentOfferPrice: 195,
      counterPrice: 0,
      volume: 5000,
      remarks: ''
    },
    'enq-102': {
      stage: 'initial',
      originalPrice: 220,
      currentOfferPrice: 220,
      counterPrice: 0,
      volume: 3000,
      remarks: ''
    },
    'enq-103': {
      stage: 'initial',
      originalPrice: 45,
      currentOfferPrice: 45,
      counterPrice: 0,
      volume: 10000,
      remarks: ''
    }
  });

  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterQtyInput, setCounterQtyInput] = useState('');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [isSimulatingNegotiation, setIsSimulatingNegotiation] = useState(false);

  // Form states for creating a custom mock enquiry
  const [newProdName, setNewProdName] = useState('');
  const [newSuppName, setNewSuppName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveToStorage = (updatedList: BuyerEnquiry[]) => {
    localStorage.setItem('nexora_buyer_enquiries', JSON.stringify(updatedList));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEnquiryId) return;

    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add message
    const currentMessages = conversations[selectedEnquiryId] || [];
    const updatedMessages: Array<{ sender: 'buyer' | 'supplier'; text: string; time: string }> = [
      ...currentMessages,
      { sender: 'buyer', text: replyText, time: timestamp }
    ];
    
    setConversations({
      ...conversations,
      [selectedEnquiryId]: updatedMessages
    });

    // Update last message in main list
    const updatedEnquiries = enquiries.map(enq => {
      if (enq.id === selectedEnquiryId) {
        return {
          ...enq,
          lastMessage: replyText,
          status: 'Pending' as const // Shifting status to pending after buyer replies
        };
      }
      return enq;
    });

    setEnquiries(updatedEnquiries);
    saveToStorage(updatedEnquiries);
    setReplyText('');
    triggerToast('Reply sent successfully!');

    // Simulate auto-response from supplier in 2 seconds
    setTimeout(() => {
      const supplierReplyTimestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentMessagesAfter = updatedMessages;
      const finalMessages: Array<{ sender: 'buyer' | 'supplier'; text: string; time: string }> = [
        ...currentMessagesAfter,
        { sender: 'supplier', text: `Thank you for your response. Our beauty team has received your message regarding: "${replyText.substring(0, 30)}...". We are analyzing your request and will provide a commercial update within 12 hours.`, time: supplierReplyTimestamp }
      ];

      setConversations(prev => ({
        ...prev,
        [selectedEnquiryId]: finalMessages
      }));

      const finalEnquiries = updatedEnquiries.map(enq => {
        if (enq.id === selectedEnquiryId) {
          return {
            ...enq,
            lastMessage: 'Supplier is reviewing your response.',
            status: 'Responded' as const
          };
        }
        return enq;
      });

      setEnquiries(finalEnquiries);
      saveToStorage(finalEnquiries);
    }, 2000);
  };

  const handleCreateEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newSuppName.trim() || !newSubject.trim()) {
      triggerToast('Please fill out all required fields.');
      return;
    }

    const newId = `enq-${Date.now()}`;
    const newEnq: BuyerEnquiry = {
      id: newId,
      productName: newProdName,
      supplierName: newSuppName,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      subject: newSubject,
      lastMessage: newDetails || 'Enquiry initiated.'
    };

    const updated = [newEnq, ...enquiries];
    setEnquiries(updated);
    saveToStorage(updated);

    // Seed conversations
    setConversations({
      ...conversations,
      [newId]: [
        { sender: 'buyer', text: `Subject: ${newSubject}\n\nDetails: ${newDetails || 'Please send quotation.'}`, time: new Date().toLocaleString() }
      ]
    });

    setSelectedEnquiryId(newId);
    setIsNewEnquiryOpen(false);
    triggerToast('New sourcing enquiry posted to supplier!');
    
    // Clear form
    setNewProdName('');
    setNewSuppName('');
    setNewSubject('');
    setNewDetails('');
  };

  const handleCounterOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryId || !counterPriceInput.trim() || !counterQtyInput.trim()) {
      triggerToast('Please fill out target price and target volume.');
      return;
    }

    const priceNum = parseFloat(counterPriceInput);
    const qtyNum = parseInt(counterQtyInput);

    if (isNaN(priceNum) || priceNum <= 0 || isNaN(qtyNum) || qtyNum <= 0) {
      triggerToast('Please enter valid positive values.');
      return;
    }

    const targetEnquiry = enquiries.find(eq => eq.id === selectedEnquiryId);
    if (!targetEnquiry) return;

    // Transition to counter_submitted
    setNegotiations(prev => ({
      ...prev,
      [selectedEnquiryId]: {
        ...prev[selectedEnquiryId],
        stage: 'counter_submitted',
        counterPrice: priceNum,
        volume: qtyNum,
        remarks: negotiationNotes
      }
    }));

    setIsSimulatingNegotiation(true);
    triggerToast('B2B Sourcing Counter-Offer submitted to supplier!');

    // Append user counter message to chat timeline
    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentMessages = conversations[selectedEnquiryId] || [];
    const userMessageText = `📢 OFFICIAL COUNTER-OFFER SUBMITTED:\n• Target Price: ₹${priceNum} / unit\n• Target Volume: ${qtyNum.toLocaleString()} Units\n• Remarks: ${negotiationNotes || 'None'}`;
    const updatedMessages = [
      ...currentMessages,
      { sender: 'buyer' as const, text: userMessageText, time: timestamp }
    ];

    setConversations(prev => ({
      ...prev,
      [selectedEnquiryId]: updatedMessages
    }));

    // Trigger auto supplier response after 2.5 seconds
    setTimeout(() => {
      setIsSimulatingNegotiation(false);
      const supplierTimestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let supplierResponseText = '';
      let nextStage: 'final_accepted' | 'supplier_responded' = 'supplier_responded';
      let finalOfferPrice = priceNum;

      // Pricing matrix logic
      const originalPriceVal = negotiations[selectedEnquiryId]?.originalPrice || 195;
      const lowerBoundAcceptable = originalPriceVal * 0.93; // 7% max discount direct accept

      if (priceNum >= lowerBoundAcceptable) {
        // Accept!
        nextStage = 'final_accepted';
        supplierResponseText = `✅ COUNTER-OFFER ACCEPTED!\n\nDear Elena,\nWe have analyzed your target price of ₹${priceNum} / unit for ${qtyNum.toLocaleString()} units with our pricing matrix and can confirm acceptance. This offers a specialized commercial discount due to our long-standing professional collaboration.\n\nWe are preparing the formal B2B supply agreement. Please click "Confirm Agreement" below to proceed.`;
        finalOfferPrice = priceNum;
      } else {
        // Counter-counter propose!
        nextStage = 'supplier_responded';
        const revisedCounterPrice = Math.round(originalPriceVal * 0.95); // 5% discount final offer
        finalOfferPrice = revisedCounterPrice;
        supplierResponseText = `⚠️ COUNTER-PROPOSAL SUBMITTED\n\nDear Elena,\nThank you for your target offer of ₹${priceNum} / unit. After careful formulation audit and ingredient sourcing evaluation (10% L-Ascorbic Acid content), we cannot support ₹${priceNum} without compromising active quality.\n\nHowever, we are happy to meet you halfway with our absolute final price of ₹${revisedCounterPrice} / unit for a volume of ${qtyNum.toLocaleString()} units.\n\nPlease review and let us know if this works.`;
      }

      setConversations(prev => {
        const currentMsgs = prev[selectedEnquiryId] || [];
        return {
          ...prev,
          [selectedEnquiryId]: [
            ...currentMsgs,
            { sender: 'supplier' as const, text: supplierResponseText, time: supplierTimestamp }
          ]
        };
      });

      setNegotiations(prev => ({
        ...prev,
        [selectedEnquiryId]: {
          ...prev[selectedEnquiryId],
          stage: nextStage,
          currentOfferPrice: finalOfferPrice
        }
      }));

      // Update Enquiry list status to 'Quoted'
      const updatedEnquiries = enquiries.map(e => {
        if (e.id === selectedEnquiryId) {
          return {
            ...e,
            status: 'Quoted' as const,
            lastMessage: nextStage === 'final_accepted' ? 'Counter-Offer Accepted' : 'Supplier Counter-Proposed'
          };
        }
        return e;
      });
      setEnquiries(updatedEnquiries);
      saveToStorage(updatedEnquiries);
      triggerToast(nextStage === 'final_accepted' ? 'Supplier accepted counter-offer!' : 'Supplier sent counter-proposal.');
    }, 2500);
  };

  const handleAcceptNegotiation = () => {
    if (!selectedEnquiryId) return;
    const finalPrice = negotiations[selectedEnquiryId]?.currentOfferPrice;
    
    setNegotiations(prev => ({
      ...prev,
      [selectedEnquiryId]: {
        ...prev[selectedEnquiryId],
        stage: 'final_accepted'
      }
    }));

    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentMessages = conversations[selectedEnquiryId] || [];
    const updatedMessages = [
      ...currentMessages,
      { sender: 'buyer' as const, text: `🤝 AGREEMENT CONFIRMED:\nElena Rostova (You) accepted the final price of ₹${finalPrice} / unit. Digital sourcing contract has been signed and dispatched to both accounts.`, time: timestamp }
    ];

    setConversations(prev => ({
      ...prev,
      [selectedEnquiryId]: updatedMessages
    }));

    // Update status to 'Closed'
    const updatedEnquiries = enquiries.map(e => {
      if (e.id === selectedEnquiryId) {
        return {
          ...e,
          status: 'Closed' as const,
          lastMessage: `Sourcing closed successfully at ₹${finalPrice}/unit`
        };
      }
      return e;
    });
    setEnquiries(updatedEnquiries);
    saveToStorage(updatedEnquiries);
    triggerToast('Sourcing agreement confirmed and finalized!');
  };

  const handleDeclineNegotiation = () => {
    if (!selectedEnquiryId) return;
    
    setNegotiations(prev => ({
      ...prev,
      [selectedEnquiryId]: {
        ...prev[selectedEnquiryId],
        stage: 'final_declined'
      }
    }));

    const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentMessages = conversations[selectedEnquiryId] || [];
    const updatedMessages = [
      ...currentMessages,
      { sender: 'buyer' as const, text: `❌ NEGOTIATION TERMINATED:\nElena Rostova (You) declined the final proposal. Sourcing requirement has been marked as closed without agreement.`, time: timestamp }
    ];

    setConversations(prev => ({
      ...prev,
      [selectedEnquiryId]: updatedMessages
    }));

    // Update status to 'Closed'
    const updatedEnquiries = enquiries.map(e => {
      if (e.id === selectedEnquiryId) {
        return {
          ...e,
          status: 'Closed' as const,
          lastMessage: 'Negotiation declined & closed'
        };
      }
      return e;
    });
    setEnquiries(updatedEnquiries);
    saveToStorage(updatedEnquiries);
    triggerToast('Negotiation terminated & closed.');
  };

  const handleDownloadReport = () => {
    const header = 'Enquiry ID,Product Name,Supplier Name,Date,Status,Subject\n';
    const rows = enquiries.map(e => `"${e.id}","${e.productName}","${e.supplierName}","${e.date}","${e.status}","${e.subject}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `NexoraLuxe_Enquiries_Report_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    triggerToast('CSV Export generated successfully!');
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = 
      enq.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    return enq.status === activeTab && matchesSearch;
  });

  const selectedEnquiry = enquiries.find(e => e.id === selectedEnquiryId);
  const selectedMessages = selectedEnquiryId ? conversations[selectedEnquiryId] || [] : [];

  const getStatusColor = (status: BuyerEnquiry['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]';
      case 'Responded':
        return 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]';
      case 'Quoted':
        return 'bg-[#fde7f3] text-[#b90064] border-[#fbcfe8]';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-[#fdf8f8] min-h-[calc(100vh-80px)] py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 z-50 bg-[#1c1b1b] text-white px-4 py-3 rounded-xl shadow-xl border border-[#313030] flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#e6007e]" />
          <span className="text-[13px] font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#594047] hover:text-[#b90064] transition-colors mb-3 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Workspace</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-[#1c1b1b] tracking-tight">
            Buyer <span className="text-[#b90064]">Enquiry Log</span>
          </h1>
          <p className="text-xs text-[#594047] font-medium mt-1">
            Monitor communication cycles, review official supplier responses, and initiate B2B discussion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2.5 bg-white border border-[#e8e8e8] text-xs font-black text-[#594047] hover:text-[#b90064] hover:bg-[#fde7f3]/10 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => setIsNewEnquiryOpen(true)}
            className="px-4 py-2.5 bg-[#b90064] text-white text-xs font-black rounded-xl hover:bg-[#8e004b] transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sourcing Enquiry</span>
          </button>
        </div>
      </div>

      {/* Sourcing Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 text-left shadow-xs">
          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Total Enquiries</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1c1b1b]">{enquiries.length}</span>
            <span className="text-[10px] text-green-600 font-bold">Active Sourcing</span>
          </div>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 text-left shadow-xs">
          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Pending Responses</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#d97706]">{enquiries.filter(e => e.status === 'Pending').length}</span>
            <span className="text-[10px] text-[#8c7077] font-medium">Awaiting Supplier</span>
          </div>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 text-left shadow-xs">
          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Commercial Quotes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#b90064]">{enquiries.filter(e => e.status === 'Quoted').length}</span>
            <span className="text-[10px] text-[#b90064] font-black uppercase tracking-widest">Ready to Compare</span>
          </div>
        </div>
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 text-left shadow-xs">
          <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Response Velocity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0050d6]">4.2h</span>
            <span className="text-[10px] text-[#0050d6] font-bold">Industry Leading</span>
          </div>
        </div>
      </div>

      {/* Main Sourcing Log Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: List & Search Filtration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search bar & Filter */}
          <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by product, supplier, or request..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] placeholder-[#8c7077] focus:outline-hidden focus:border-[#b90064] font-medium"
              />
              <Search className="w-4 h-4 text-[#8c7077] absolute left-3 top-3" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {(['All', 'Pending', 'Responded', 'Quoted', 'Closed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#b90064] text-white border-[#b90064] shadow-xs'
                      : 'bg-[#fcf9f8] text-[#594047] border-[#e8e8e8] hover:bg-[#f0edec]'
                  }`}
                >
                  {tab} ({tab === 'All' ? enquiries.length : enquiries.filter(e => e.status === tab).length})
                </button>
              ))}
            </div>
          </div>

          {/* Sourcing Request list cards */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredEnquiries.length > 0 ? (
              filteredEnquiries.map(enq => {
                const isSelected = selectedEnquiryId === enq.id;
                return (
                  <div
                    key={enq.id}
                    onClick={() => setSelectedEnquiryId(enq.id)}
                    className={`border rounded-2xl p-4 text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#fdf8f8] border-[#b90064] shadow-xs'
                        : 'bg-white border-[#e8e8e8] hover:border-[#8c7077]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] text-[#8c7077] font-bold block mb-1">
                        Ref: {enq.id} • Posted {enq.date}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusColor(enq.status)}`}>
                        {enq.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-[#1c1b1b] mt-1 hover:text-[#b90064] transition-colors line-clamp-1">
                      {enq.productName}
                    </h3>

                    <div className="flex items-center gap-1 text-[10px] text-[#594047] font-semibold mt-1">
                      <Building2 className="w-3 h-3 text-[#b90064]" />
                      <span>{enq.supplierName}</span>
                    </div>

                    <p className="text-[11px] text-[#8c7077] font-medium mt-2 line-clamp-2 italic bg-[#fcf9f8] p-2 rounded-lg border border-[#f0edec]">
                      &ldquo;{enq.subject}&rdquo;
                    </p>

                    {isSelected && (
                      <div className="absolute right-4 bottom-4 w-1.5 h-1.5 rounded-full bg-[#b90064]" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-[#e8e8e8] rounded-2xl p-10 text-center text-xs text-[#8c7077] font-bold">
                No beauty enquiries found matching your search.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Active Sourcing Conversation Hub (7 cols) */}
        <div className="lg:col-span-7">
          {selectedEnquiry ? (
            <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[620px]">
              
              {/* Card Top Information */}
              <div className="p-5 border-b border-[#f0edec] bg-[#fcf9f8] text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#b90064] tracking-widest uppercase block mb-1">
                      Verified Sourcing Discussion (Enquiry {selectedEnquiry.id})
                    </span>
                    <h2 className="text-base font-black text-[#1c1b1b] leading-tight">
                      {selectedEnquiry.productName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#594047] font-medium mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#8c7077]" />
                        <strong>{selectedEnquiry.supplierName}</strong>
                      </span>
                      <span className="text-[#8c7077]">•</span>
                      <span className="flex items-center gap-1 text-[#0050d6] font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Date Initiated: {selectedEnquiry.date}</span>
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedEnquiry.status)} self-start md:self-center`}>
                    {selectedEnquiry.status}
                  </span>
                </div>
              </div>

              {/* Chat Timeline list */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[350px] bg-[#fdf8f8]/30">
                {selectedMessages.map((msg, index) => {
                  const isBuyer = msg.sender === 'buyer';
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col max-w-[85%] ${
                        isBuyer ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div className="text-[9px] font-bold text-[#8c7077] uppercase tracking-wider mb-1 px-1">
                        {isBuyer ? 'Elena Rostova (You)' : selectedEnquiry.supplierName} • {msg.time}
                      </div>
                      <div 
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-line text-left ${
                          isBuyer 
                            ? 'bg-[#b90064] text-white rounded-tr-none shadow-xs' 
                            : 'bg-white border border-[#e8e8e8] text-[#1c1b1b] rounded-tl-none shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* B2B Pricing Negotiation Center */}
              {(() => {
                const neg = negotiations[selectedEnquiry.id];
                if (!neg) return null;
                
                return (
                  <div className="border-t border-b border-[#f0edec] bg-[#fdf8f8]/40 p-4 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-[#1c1b1b] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#b90064] animate-pulse"></span>
                        B2B Pricing & Sourcing Negotiation Center
                      </h4>
                      <span className="text-[10px] font-bold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Stage: {neg.stage.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Step Timeline Progress */}
                    <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                      <div className="bg-white border border-[#e8e8e8] rounded-lg p-1.5">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Step 1</span>
                        <span className="text-[10px] font-black text-[#1c1b1b] block">RFQ Posted</span>
                        <span className="text-[8px] font-bold text-[#8c7077]">Completed</span>
                      </div>
                      <div className="bg-white border border-[#e8e8e8] rounded-lg p-1.5">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Step 2</span>
                        <span className="text-[10px] font-black text-[#1c1b1b] block">Initial: ₹{neg.originalPrice}</span>
                        <span className="text-[8px] font-bold text-[#8c7077]">Quote Received</span>
                      </div>
                      <div className="bg-white border border-[#e8e8e8] rounded-lg p-1.5">
                        <span className="text-[9px] font-bold text-[#b90064] uppercase tracking-widest block">Step 3</span>
                        <span className="text-[10px] font-black text-[#1c1b1b] block">
                          {neg.stage === 'initial' ? 'Pending' : `Countered: ₹${neg.counterPrice}`}
                        </span>
                        <span className={`text-[8px] font-bold block ${neg.stage === 'initial' ? 'text-[#8c7077]' : 'text-[#b90064]'}`}>
                          {neg.stage === 'initial' ? 'Ready' : 'Submitted'}
                        </span>
                      </div>
                      <div className="bg-white border border-[#e8e8e8] rounded-lg p-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest block text-stone-500">Step 4</span>
                        <span className="text-[10px] font-black text-[#1c1b1b] block">
                          {neg.stage === 'final_accepted' ? 'Accepted' : neg.stage === 'final_declined' ? 'Declined' : 'Awaiting Review'}
                        </span>
                        <span className="text-[8px] font-bold text-[#8c7077]">Final Outcome</span>
                      </div>
                    </div>

                    {/* Live interactive console forms */}
                    {neg.stage === 'initial' && (
                      <form onSubmit={handleCounterOffer} className="space-y-3 bg-white border border-[#e8e8e8] rounded-xl p-3.5 shadow-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Your Counter Price (per unit)</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs font-black text-[#8c7077]">₹</span>
                              <input 
                                type="number" 
                                required
                                placeholder="185"
                                value={counterPriceInput}
                                onChange={e => setCounterPriceInput(e.target.value)}
                                className="w-full pl-6 pr-2.5 py-1.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg text-xs font-bold focus:outline-hidden focus:border-[#b90064]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Target Volume (MOQ Units)</label>
                            <input 
                              type="number" 
                              required
                              placeholder="5000"
                              value={counterQtyInput}
                              onChange={e => setCounterQtyInput(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg text-xs font-bold focus:outline-hidden focus:border-[#b90064]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#8c7077] uppercase tracking-wider block mb-1">Commercial Sourcing Terms / Remarks (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Can sign annual contract for regular dispatch if price is locked."
                            value={negotiationNotes}
                            onChange={e => setNegotiationNotes(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-lg text-xs font-bold focus:outline-hidden focus:border-[#b90064]"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-2 bg-[#b90064] text-white text-[11px] font-black uppercase tracking-wider rounded-lg hover:bg-[#8e004b] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          Submit Formal Counter-Offer
                        </button>
                      </form>
                    )}

                    {neg.stage === 'counter_submitted' && (
                      <div className="bg-white border border-[#e8e8e8] rounded-xl p-4 text-center shadow-xs space-y-2">
                        <div className="animate-spin w-5 h-5 border-2 border-[#b90064] border-t-transparent rounded-full mx-auto" />
                        <h5 className="text-xs font-bold text-[#1c1b1b]">Awaiting Supplier Commercial Feedback</h5>
                        <p className="text-[10px] text-[#594047] max-w-md mx-auto">
                          Our smart pricing routing has forwarded your Counter-Offer of <strong>₹{neg.counterPrice} / unit</strong> to {selectedEnquiry.supplierName}. Supplier sourcing managers are auditing batch formulation margins...
                        </p>
                      </div>
                    )}

                    {neg.stage === 'supplier_responded' && (
                      <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-3.5 shadow-xs text-left space-y-3">
                        <div>
                          <span className="text-[9px] font-black text-[#d97706] uppercase tracking-wider block mb-0.5">Supplier Decisive Proposal Received</span>
                          <p className="text-[11px] text-[#1c1b1b] leading-relaxed">
                            {selectedEnquiry.supplierName} returned a final bottom price offer of <strong className="text-[#b90064] text-xs">₹{neg.currentOfferPrice} / unit</strong> for {neg.volume.toLocaleString()} units.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleAcceptNegotiation}
                            className="flex-1 py-1.5 bg-[#b90064] text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-[#8e004b] transition-all cursor-pointer shadow-xs"
                          >
                            Accept Final Offer (₹{neg.currentOfferPrice})
                          </button>
                          <button 
                            onClick={handleDeclineNegotiation}
                            className="flex-1 py-1.5 bg-white border border-[#e8e8e8] text-[#594047] hover:text-[#b90064] text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                          >
                            Decline & Close Sourcing
                          </button>
                        </div>
                      </div>
                    )}

                    {neg.stage === 'final_accepted' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-xs space-y-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wide">Sourcing Agreement Finalized!</h5>
                        <p className="text-[10px] text-emerald-700 max-w-md mx-auto leading-relaxed">
                          Negotiation completed successfully. Both parties agreed to the specialized price of <strong>₹{neg.currentOfferPrice} / unit</strong> for {neg.volume.toLocaleString()} units. Digital contract dispatched.
                        </p>
                      </div>
                    )}

                    {neg.stage === 'final_declined' && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-xs space-y-1">
                        <AlertCircle className="w-6 h-6 text-gray-500 mx-auto" />
                        <h5 className="text-xs font-black text-gray-700 uppercase tracking-wide">Sourcing Closed (Declined)</h5>
                        <p className="text-[10px] text-gray-600">
                          This pricing negotiation has been terminated. You can post a new requirement or contact other verified private label manufacturers.
                        </p>
                      </div>
                    )}

                  </div>
                );
              })()}

              {/* Action and Input Reply Tray */}
              <div className="p-4 border-t border-[#f0edec] bg-[#fcf9f8] space-y-4">
                
                {/* Instant CTA Links */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-[#8c7077] uppercase tracking-wider mr-1">Direct Sourcing Actions:</span>
                  
                  <button
                    onClick={() => onCallSupplier(selectedEnquiry.supplierName)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#1c1b1b] border border-[#e8e8e8] rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3 h-3 text-[#b90064]" />
                    <span>Call Supplier</span>
                  </button>

                  <button
                    onClick={() => onWhatsAppSupplier(selectedEnquiry.supplierName)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#1c1b1b] border border-[#e8e8e8] rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-green-600 fill-green-600/10" />
                    <span>WhatsApp Supplier</span>
                  </button>

                  <button
                    onClick={() => onNavigateToChat(selectedEnquiry.supplierName)}
                    className="px-3 py-1.5 bg-white hover:bg-[#b90064] hover:text-white hover:border-[#b90064] text-[#b90064] border border-[#b90064]/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Request Quotation</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex gap-2.5">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Enter message to negotiate pricing, request catalogs or custom formulations..."
                    className="flex-1 px-4 py-3 bg-white border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className={`px-5 py-3 bg-[#b90064] text-white rounded-xl text-xs font-black shadow-md hover:bg-[#8e004b] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      !replyText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send Reply</span>
                  </button>
                </form>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-16 text-center shadow-xs">
              <AlertCircle className="w-12 h-12 text-[#b90064] mx-auto mb-4" />
              <h3 className="text-base font-bold text-[#1c1b1b]">No Enquiry Selected</h3>
              <p className="text-xs text-[#594047] max-w-sm mx-auto mt-2 font-medium">
                Please select a sourcing request from the left panel list to inspect verified dialogue history and engage suppliers.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: SUBMIT NEW ENQUIRY (SIMULATION) */}
      {isNewEnquiryOpen && (
        <div className="fixed inset-0 bg-[#1c1b1b]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e8e8e8] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 border-b border-[#f0edec] bg-[#fcf9f8] flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#b90064] uppercase tracking-wider block">Submit B2B Sourcing Enquiry</span>
                <h3 className="text-base font-black text-[#1c1b1b]">Connect with Beauty Suppliers</h3>
              </div>
              <button 
                onClick={() => setIsNewEnquiryOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-[#8c7077] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="p-5 space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-[#8c7077] uppercase tracking-widest block mb-1">
                  Product / Sourcing Requirement <span className="text-[#b90064]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Organic Cold Pressed Rosehip Oil (Bulk)"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#8c7077] uppercase tracking-widest block mb-1">
                  Target Supplier Name <span className="text-[#b90064]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Aura Beauty Labs or Radiant Cosmeceuticals"
                  value={newSuppName}
                  onChange={e => setNewSuppName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#8c7077] uppercase tracking-widest block mb-1">
                  Sourcing Subject <span className="text-[#b90064]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Request for pricing matrix & custom packaging options"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#8c7077] uppercase tracking-widest block mb-1">
                  Message Details / Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Include volume needed, target pricing, ingredient specifications, certifications required (WHO-GMP, Cruelty-free etc.)..."
                  value={newDetails}
                  onChange={e => setNewDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#fcf9f8] border border-[#e8e8e8] rounded-xl text-xs text-[#1c1b1b] focus:outline-hidden focus:border-[#b90064] font-medium resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#f0edec] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewEnquiryOpen(false)}
                  className="px-4 py-2 bg-[#fcf9f8] hover:bg-[#f0edec] border border-[#e8e8e8] text-xs font-black text-[#594047] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#b90064] text-white text-xs font-black rounded-xl hover:bg-[#8e004b] transition-all cursor-pointer shadow-md"
                >
                  Post Sourcing Enquiry
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
