import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  UserCheck,
  Sparkles,
  PhoneCall,
  FileText,
  Building2,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface LiveChatWidgetProps {
  onOpenRFQModal?: () => void;
  onOpenEnquiryModal?: (item: any) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'support' | 'user';
  text: string;
  time: string;
  actionType?: 'rfq' | 'supplier_recommendation' | 'callback';
  actionData?: any;
}

const QUICK_PROMPTS = [
  '🔍 Find OEM Haircare & Keratin Manufacturer',
  '🧪 What is the standard MOQ for Vitamin C Serum?',
  '📋 Assist me with posting a verified RFQ',
  '📞 Request Sourcing Specialist Callback'
];

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  onOpenRFQModal,
  onOpenEnquiryModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'support'>('ai');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Welcome to Nexora Luxe Sourcing Desk! I am your AI B2B Matchmaker. Are you sourcing bulk formulas, private label cosmetics, or salon equipment?',
      time: 'Just now'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Simulate realistic AI / Support response
    setTimeout(() => {
      setIsTyping(false);
      let reply: Message;

      const lower = text.toLowerCase();

      if (lower.includes('haircare') || lower.includes('keratin') || lower.includes('oem')) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'I found 2 Tier-1 ISO 22716 verified manufacturers for Keratin & Haircare formulations matching your criteria. "Aura Beauty Labs" (Mumbai) currently has active capacity with 500 Unit MOQ.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'supplier_recommendation',
          actionData: {
            name: 'Aura Beauty Labs',
            location: 'Mumbai, MH',
            moq: '500 Units',
            rating: '98/100 Verified Score'
          }
        };
      } else if (lower.includes('moq') || lower.includes('vitamin c') || lower.includes('price')) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'For 10%-15% Ethyl Ascorbic Acid / Vitamin C Serums, standard factory MOQ starts at 500–1,000 bottles with custom screen printing. Average B2B benchmark is ₹180 - ₹240/unit for certified bulk runs.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else if (lower.includes('rfq') || lower.includes('requirement') || lower.includes('post')) {
        reply = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'You can broadcast a single RFQ requirement directly to 120+ audited factories on Nexora Luxe. Would you like to launch the Quick RFQ creator now?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'rfq'
        };
      } else if (lower.includes('call') || lower.includes('specialist') || lower.includes('human') || lower.includes('support')) {
        reply = {
          id: `supp-${Date.now()}`,
          sender: 'support',
          text: 'Our Nexora Procurement Desk Lead (Rajesh S., Senior Beauty Category Specialist) is available. We can schedule a 10-minute briefing call or send verified supplier catalog dossiers directly to your WhatsApp.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'callback'
        };
      } else {
        reply = {
          id: `ai-${Date.now()}`,
          sender: activeTab === 'ai' ? 'ai' : 'support',
          text: `Thank you for the inquiry regarding "${text}". I have mapped your request against verified manufacturers in Delhi NCR, Mumbai, and Baddi industrial clusters. Would you like to post an RFQ or request customized supplier quotes?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: 'rfq'
        };
      }

      setMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm-init',
        sender: 'ai',
        text: 'Conversation reset. How can our sourcing intelligence desk assist your beauty procurement today?',
        time: 'Just now'
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          id="open-live-chat-btn"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-[#b90064] hover:bg-[#9a0053] text-white px-4 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-white/20"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00ff88] rounded-full ring-2 ring-[#b90064] animate-pulse"></span>
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-[12px] font-bold tracking-tight block leading-tight">Live Sourcing Desk</span>
            <span className="text-[10px] text-pink-100 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> AI Assistant Online
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-[#b90064] text-[11px] font-black flex items-center justify-center shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Live Chat Dialog Window */}
      {isOpen && (
        <div
          id="live-chat-drawer"
          className="w-[92vw] sm:w-[410px] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#e8e8e8] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-[#1c1b1b] text-white p-4 flex items-center justify-between border-b border-[#313030]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#b90064] flex items-center justify-center text-white shadow-sm">
                {activeTab === 'ai' ? <Sparkles className="w-5 h-5 text-white" /> : <UserCheck className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[13px] font-bold text-white tracking-tight">Nexora Sourcing Desk</h3>
                  <span className="w-2 h-2 rounded-full bg-[#00ff88]"></span>
                </div>
                <p className="text-[11px] text-[#a09095]">
                  {activeTab === 'ai' ? 'AI B2B Procurement Intelligence' : 'Verified Category Specialist (Online)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#a09095]">
              <button
                onClick={handleResetChat}
                title="Restart chat"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                id="close-live-chat-btn"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tab */}
          <div className="bg-[#fcf9f8] px-3 py-2 border-b border-[#e8e8e8] flex items-center justify-between gap-2">
            <div className="flex rounded-lg bg-[#eee7ea] p-0.5 text-[11px] font-semibold w-full">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ai'
                    ? 'bg-white text-[#b90064] shadow-xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                AI Sourcing Bot
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`flex-1 py-1.5 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'support'
                    ? 'bg-white text-[#0050d6] shadow-xs'
                    : 'text-[#594047] hover:text-[#1c1b1b]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Desk Specialist
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fdf8f8]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.sender !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-[#b90064] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                      {msg.sender === 'ai' ? 'AI' : 'NX'}
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-[12.5px] leading-relaxed shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#b90064] text-white rounded-br-xs'
                        : 'bg-white text-[#1c1b1b] border border-[#e8e8e8] rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Rich Action Card in Message */}
                    {msg.actionType === 'supplier_recommendation' && msg.actionData && (
                      <div className="mt-2.5 p-2.5 bg-[#fcf9f8] rounded-xl border border-[#e8e8e8] text-[11px] text-[#1c1b1b]">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="flex items-center gap-1 text-[#b90064]">
                            <Building2 className="w-3.5 h-3.5" />
                            {msg.actionData.name}
                          </span>
                          <span className="text-[10px] text-[#0050d6] font-semibold">{msg.actionData.rating}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#594047] mb-2">
                          <span>📍 {msg.actionData.location}</span>
                          <span>MOQ: {msg.actionData.moq}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (onOpenEnquiryModal) {
                              onOpenEnquiryModal({
                                name: 'OEM Haircare & Keratin Treatment System',
                                supplier: msg.actionData.name,
                                moq: msg.actionData.moq,
                                price: '₹140 - ₹280 / Unit',
                                image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80'
                              });
                            }
                          }}
                          className="w-full py-1.5 bg-[#b90064] text-white font-bold rounded-lg text-center hover:bg-[#9a0053] transition-colors flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send Direct Sourcing Enquiry
                        </button>
                      </div>
                    )}

                    {msg.actionType === 'rfq' && (
                      <div className="mt-2.5">
                        <button
                          onClick={() => {
                            if (onOpenRFQModal) onOpenRFQModal();
                          }}
                          className="w-full py-1.5 px-3 bg-[#0050d6] hover:bg-[#0040ab] text-white font-bold rounded-lg text-center text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" /> Launch RFQ Form (Broadcast to 120+ Suppliers)
                        </button>
                      </div>
                    )}

                    {msg.actionType === 'callback' && (
                      <div className="mt-2.5 p-2 bg-[#f0f5ff] rounded-xl border border-[#d0e0ff] text-[11px]">
                        <p className="font-semibold text-[#0050d6] mb-1.5 flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5" /> Free Sourcing Consultation Line
                        </p>
                        <p className="text-[10px] text-[#594047] mb-2">
                          Direct Desk Toll-Free: <strong>1800-420-LUXE (9 AM - 8 PM IST)</strong>
                        </p>
                        <button
                          onClick={() => {
                            alert('Callback request scheduled! A Category Specialist will contact your registered business phone within 15 minutes.');
                          }}
                          className="w-full py-1.5 bg-[#0050d6] text-white font-bold rounded-lg text-center hover:bg-[#0040ab] transition-colors text-[11px]"
                        >
                          Confirm Instant Callback
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[9.5px] text-[#8c7077] mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#b90064] text-white flex items-center justify-center text-[10px] font-bold">
                  AI
                </div>
                <div className="bg-white border border-[#e8e8e8] px-3 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#b90064] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#b90064] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#b90064] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Sourcing Prompts */}
          <div className="bg-[#fcf9f8] px-3 py-2 border-t border-[#e8e8e8] flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap text-[10.5px] font-medium bg-white hover:bg-[#fde7f3] text-[#594047] hover:text-[#b90064] border border-[#e8e8e8] hover:border-[#b90064]/30 px-2.5 py-1.5 rounded-full transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-[#e8e8e8]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                id="live-chat-input"
                placeholder={activeTab === 'ai' ? 'Ask AI about formulas, MOQ, suppliers...' : 'Type message to desk specialist...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#fcf9f8] border border-[#e8e8e8] focus:border-[#b90064] focus:bg-white rounded-xl px-3.5 py-2 text-[12.5px] text-[#1c1b1b] outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-9 h-9 bg-[#b90064] disabled:bg-[#eee7ea] disabled:text-[#a09095] hover:bg-[#9a0053] text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
