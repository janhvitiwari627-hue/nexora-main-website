import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Building2, 
  MapPin, 
  Clock, 
  CheckCheck, 
  Paperclip, 
  FileText, 
  Plus, 
  Phone, 
  Mail, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { SupplierPartner, Product, ChatMessage } from '../types';

interface SupplierChatModalProps {
  isOpen: boolean;
  supplier: SupplierPartner | null;
  productContext?: Product | null;
  onClose: () => void;
  onAddToQuote?: (product: Product, quantity: number) => void;
  onViewSupplierProfile?: (supplier: SupplierPartner) => void;
}

export const SupplierChatModal: React.FC<SupplierChatModalProps> = ({
  isOpen,
  supplier,
  productContext,
  onClose,
  onAddToQuote,
  onViewSupplierProfile
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quoteAddedNotification, setQuoteAddedNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const quickPrompts = [
    {
      label: '📦 Bulk MOQ & Lead Time',
      text: `Hello, what is your standard production and delivery lead time for an initial order of ${productContext?.moq ? productContext.moq * 5 : '250'} units?`
    },
    {
      label: '💰 Tiered Pricing for 500+ Units',
      text: 'Do you offer additional custom volume discounts for orders exceeding 500 units?'
    },
    {
      label: '🧪 Request Physical Sample',
      text: `Could we arrange a physical testing sample of ${productContext ? productContext.name : 'your featured line'} dispatched to our salon?`
    },
    {
      label: '🏷️ Private Label / OEM',
      text: 'Are custom private label branding, packaging, and localized ingredient labeling supported for this catalog?'
    },
    {
      label: '📄 Request COA & MSDS Sheets',
      text: 'Please provide the technical Safety Data Sheets (MSDS) and European compliance certifications for review.'
    }
  ];

  // Initialize initial conversation when opened
  useEffect(() => {
    if (!isOpen || !supplier) return;

    const initialGreeting: ChatMessage = {
      id: `msg-welcome-${supplier.id}`,
      sender: 'supplier',
      text: `Bonjour & Welcome! You are speaking with the B2B Key Account desk at ${supplier.name}. How can we assist with your salon or retail procurement requirements today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (productContext) {
      const productContextMsg: ChatMessage = {
        id: `msg-ctx-${productContext.id}`,
        sender: 'supplier',
        text: `I see you are inquiring about ${productContext.name} (${productContext.brand}). We currently have active inventory available in ${supplier.location} with lead time of ${productContext.leadTimeDays} business days.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        productContext: {
          id: productContext.id,
          name: productContext.name,
          brand: productContext.brand,
          image: productContext.image,
          price: productContext.price,
          moq: productContext.moq
        }
      };
      setMessages([initialGreeting, productContextMsg]);
    } else {
      setMessages([initialGreeting]);
    }
  }, [isOpen, supplier?.id, productContext?.id]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen || !supplier) return null;

  // Generate contextual AI/Supplier reply
  const simulateSupplierResponse = (userText: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let replyText = '';
      const lower = userText.toLowerCase();

      if (lower.includes('sample') || lower.includes('testing')) {
        replyText = `We would be delighted to dispatch a complimentary salon tester kit! Our team will prepare standard dispatch from our ${supplier.location} logistics hub. Please confirm your delivery address and business tax number.`;
      } else if (lower.includes('lead time') || lower.includes('delivery') || lower.includes('shipping')) {
        replyText = `Standard express dispatch takes 3–5 business days within the region. For full freight pallet shipments, expected delivery is typically ${productContext?.leadTimeDays || 7} business days with full temperature-controlled tracking.`;
      } else if (lower.includes('discount') || lower.includes('pricing') || lower.includes('tier') || lower.includes('500')) {
        replyText = `Yes, for annual contracts or volume orders over 500 units, we offer an additional 12% margin discount along with free door-to-door freight. Would you like us to generate a formal wholesale Pro-Forma invoice?`;
      } else if (lower.includes('private label') || lower.includes('oem') || lower.includes('branding')) {
        replyText = `We offer custom silk-screen printing, hot-foil stamping, and bespoke outer carton packaging for custom runs starting at 1,000 units. Our in-house regulatory team also assists with EU/FDA compliance dossiers.`;
      } else if (lower.includes('msds') || lower.includes('coa') || lower.includes('certificate')) {
        replyText = `All batches are ISO 22716 GMP certified and dermatologist approved. I have flagged our quality control department to attach the full European safety dossier to this thread.`;
      } else {
        replyText = `Thank you for your message! Our wholesale sales executive has received your inquiry. We can certainly accommodate your procurement timeline and wholesale terms. Let us know if you would like a customized quotation drafted.`;
      }

      const supplierMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'supplier',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, supplierMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) {
      setInputMessage('');
    }

    simulateSupplierResponse(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[88vh] max-h-[780px] shadow-2xl border border-[#EDEDED] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FFF5F8] via-[#FFF0F5] to-white border-b border-[#F0E6EC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#B8005A] text-[#B8005A] font-bold text-base flex items-center justify-center shadow-xs">
                {supplier.initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full" title="Online" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-[#1E1E1E] leading-tight">
                  {supplier.name}
                </h3>
                {supplier.verified && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#B8005A] bg-[#FFF0F5] border border-[#FFD1E3] px-2 py-0.5 rounded-full uppercase">
                    <Sparkles className="w-2.5 h-2.5" />
                    VERIFIED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#737373] mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B8005A]" />
                  {supplier.location}
                </span>
                <span>•</span>
                <span className="text-[#10B981] font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {supplier.responseRate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {onViewSupplierProfile && (
              <button
                onClick={() => {
                  onClose();
                  onViewSupplierProfile(supplier);
                }}
                className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#525252] hover:text-[#B8005A] px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#FFF0F5] transition-colors"
              >
                <span>Profile</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-[#FFF0F5] text-[#555] hover:text-[#B8005A] border border-[#E5E5E5] flex items-center justify-center transition-all shadow-xs cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Context Banner (if inquiring regarding a product) */}
        {productContext && (
          <div className="bg-[#FFF9FB] px-4 py-2.5 border-b border-[#FFD1E3] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={productContext.image || undefined}
                alt={productContext.name}
                className="w-10 h-10 rounded-lg object-cover border border-[#FFD6E5] shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#B8005A] tracking-wider block">
                  Product Inquiry
                </span>
                <h4 className="text-xs font-bold text-[#1E1E1E] truncate">
                  {productContext.name}
                </h4>
                <p className="text-[11px] text-[#737373] truncate">
                  ${productContext.price.toFixed(2)} / {productContext.unit} • MOQ: {productContext.moq} units
                </p>
              </div>
            </div>

            {onAddToQuote && (
              <button
                onClick={() => {
                  onAddToQuote(productContext, productContext.moq);
                  setQuoteAddedNotification(true);
                  setTimeout(() => setQuoteAddedNotification(false), 3000);
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-all ${
                  quoteAddedNotification
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#B8005A] hover:bg-[#A0004E] text-white shadow-xs'
                }`}
              >
                {quoteAddedNotification ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Added to Quote!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to RFQ Quote</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAFAFA]">
          <div className="text-center my-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#737373] bg-white border border-[#E5E5E5] px-3 py-1 rounded-full shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              Encrypted Verified B2B Distributor Channel
            </span>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#FFD1E3] text-[#B8005A] text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs mt-1">
                    {supplier.initials}
                  </div>
                )}

                <div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-[#B8005A] text-white rounded-tr-xs'
                        : 'bg-white text-[#1E1E1E] border border-[#EDEDED] rounded-tl-xs'
                    }`}
                  >
                    {msg.productContext && (
                      <div className="mb-2 p-2 rounded-xl bg-[#FFF0F5] border border-[#FFD1E3] text-[#1E1E1E] flex items-center gap-2">
                        <img
                          src={msg.productContext.image || undefined}
                          alt={msg.productContext.name}
                          className="w-8 h-8 rounded-md object-cover"
                        />
                        <div className="text-[11px]">
                          <strong className="block text-[#B8005A] truncate">{msg.productContext.name}</strong>
                          <span className="text-[#737373]">
                            ${msg.productContext.price.toFixed(2)} • MOQ: {msg.productContext.moq}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  <div
                    className={`flex items-center gap-1 text-[10px] text-[#8E8E93] mt-1 px-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-[#B8005A]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#FFD1E3] text-[#B8005A] text-xs font-bold flex items-center justify-center shrink-0">
                {supplier.initials}
              </div>
              <div className="bg-white border border-[#EDEDED] rounded-2xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B8005A] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#B8005A] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#B8005A] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-[#8E8E93] ml-1.5">{supplier.name} is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-[#F0F0F0] overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-[#8E8E93] uppercase shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[#B8005A]" />
            Quick Inquiries:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="text-[11px] font-medium text-[#4A4A4A] bg-[#F8F8F8] hover:bg-[#FFF0F5] hover:text-[#B8005A] border border-[#E5E5E5] hover:border-[#FFD1E3] px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#EDEDED] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage("Could you please attach the wholesale product catalog in PDF format?")}
              className="p-2.5 text-[#737373] hover:text-[#B8005A] hover:bg-[#FFF0F5] rounded-xl transition-colors cursor-pointer"
              title="Request Line Sheet PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${supplier.name} sales desk...`}
              className="flex-1 bg-[#F5F5F7] border border-transparent focus:border-[#B8005A] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1E1E1E] placeholder:text-[#8E8E93] focus:outline-none transition-all"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                inputMessage.trim() && !isTyping
                  ? 'bg-[#B8005A] hover:bg-[#A0004E] text-white shadow-xs active:scale-95'
                  : 'bg-[#EDEDED] text-[#A3A3A3] cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8E8E93] mt-2 px-1">
            <span>Direct phone: {supplier.phone}</span>
            <span>Estimated response: under 1 hour</span>
          </div>
        </div>

      </div>
    </div>
  );
};
