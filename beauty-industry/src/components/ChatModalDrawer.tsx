import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  ExternalLink, 
  ChevronLeft,
  Wifi,
  Radio,
  Clock
} from 'lucide-react';
import { db } from '../db/database';
import { getStoredChatThreads, sendChatMessage, ChatThread, ChatMessage } from '../data/chatStore';
import { useChatSubscription } from '../hooks/useChatSubscription';

interface ChatModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSupplier?: {
    id: string;
    name: string;
    location: string;
    isVerified: boolean;
  };
  initialProduct?: {
    title: string;
    image: string;
    price?: string;
    moq?: string;
  };
}

export const ChatModalDrawer: React.FC<ChatModalDrawerProps> = ({
  isOpen,
  onClose,
  initialSupplier,
  initialProduct
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load Local Chat Threads on Mount & Sync
  useEffect(() => {
    const load = () => {
      const all = getStoredChatThreads();
      setThreads(all);
      if (initialSupplier) {
        const found = all.find(t => t.supplierId === initialSupplier.id);
        if (found) {
          setActiveThreadId(found.id);
        } else if (all.length > 0) {
          setActiveThreadId(all[0].id);
        }
      } else if (!activeThreadId && all.length > 0) {
        setActiveThreadId(all[0].id);
      }
    };
    load();
    window.addEventListener('nexora_chat_updated', load);
    return () => window.removeEventListener('nexora_chat_updated', load);
  }, [initialSupplier]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const conversationId = activeThread?.id || 'thread-1';

  // 2. Custom Supabase Realtime Hook for Live Sync
  const { messages: realtimeMessages, connectionState, pushMessage } = useChatSubscription(
    conversationId,
    isOpen
  );

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId, realtimeMessages]);

  if (!isOpen) return null;

  // Map realtime messages to UI structure or fall back to activeThread messages
  const displayMessages = realtimeMessages.length > 0
    ? realtimeMessages.map((rm) => {
        const isBuyer = rm.sender_id.includes('buyer') || rm.sender_id === 'usr-buyer-priya';
        let formattedTime = 'Just now';
        try {
          formattedTime = new Date(rm.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          formattedTime = 'Just now';
        }

        return {
          id: rm.id,
          sender: isBuyer ? ('buyer' as const) : ('supplier' as const),
          senderName: isBuyer ? 'You (Priya Sharma)' : activeThread?.supplierName || 'Supplier',
          text: rm.message_body,
          timestamp: formattedTime,
          attachment: rm.attachments && rm.attachments.length > 0 ? { name: rm.attachments[0], size: '1.2 MB' } : undefined,
          productContext: undefined
        };
      })
    : activeThread?.messages || [];

  // 3. Send Message Handler using useRealtimeMessages Hook
  const handleSend = async (textToSend?: string, customContext?: any) => {
    const text = textToSend || messageInput;
    if (!text.trim() && !attachedFile) return;

    setIsSending(true);

    const supplierId = initialSupplier?.id || activeThread?.supplierId || 'sup-1';
    const supplierName = initialSupplier?.name || activeThread?.supplierName || 'Aura Beauty Labs';
    const supplierLocation = initialSupplier?.location || activeThread?.supplierLocation || 'Mumbai, MH';
    const isVerified = initialSupplier?.isVerified ?? activeThread?.isVerified ?? true;
    const context = customContext || initialProduct;

    // Send via Supabase Realtime Hook
    await pushMessage({
      senderId: 'usr-buyer-priya',
      receiverId: `usr-supp-${supplierId}`,
      body: text,
      attachments: attachedFile ? [attachedFile.name] : []
    });

    // Sync Local Store for instant state consistency
    sendChatMessage(
      supplierId,
      supplierName,
      supplierLocation,
      isVerified,
      text,
      context,
      attachedFile || undefined
    );

    setMessageInput('');
    setAttachedFile(null);
    setIsSending(false);
    setThreads(getStoredChatThreads());
  };

  const handleQuickChip = (chipText: string) => {
    handleSend(chipText);
  };

  const handleAttachMock = () => {
    setAttachedFile({ name: 'Buyer_Requirements_Spec.pdf', size: '1.4 MB' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[95vh] md:h-[85vh] shadow-2xl border border-stone-200 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* LEFT: THREADS LIST */}
        <div className={`w-full md:w-80 border-r border-stone-200 bg-stone-50 flex flex-col shrink-0 ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#b90064]" />
              <h3 className="text-sm font-extrabold text-stone-900">Supplier Inquiries</h3>
            </div>
            <span className="px-2 py-0.5 bg-[#fde7f3] text-[#b90064] text-[10px] font-black rounded-full">
              {threads.length} Active
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
            {threads.map(thread => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              const isActive = thread.id === activeThread?.id;
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                    isActive ? 'bg-[#fde7f3]/50 border-l-4 border-[#b90064]' : 'hover:bg-white bg-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b90064] to-[#70003c] text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {thread.supplierName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900 truncate flex items-center gap-1">
                        {thread.supplierName}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-medium shrink-0">
                        {lastMsg?.timestamp || ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 truncate mt-0.5 font-medium">
                      {lastMsg?.text || 'Start conversation...'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-[#b90064] font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200">
                        {thread.supplierLocation}
                      </span>
                      {thread.unreadCount > 0 && (
                        <span className="bg-[#b90064] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {thread.unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: CHAT WINDOW */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {activeThread ? (
            <>
              {/* Chat Header with Supabase Realtime Status Badge */}
              <div className="p-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveThreadId(null)}
                    className="md:hidden p-1.5 -ml-2 text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b90064] to-[#70003c] text-white font-black flex items-center justify-center text-sm shadow-sm">
                    {activeThread.supplierName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-stone-900">{activeThread.supplierName}</h3>
                      {activeThread.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-[#b90064]" aria-label="Nexora Verified Supplier" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {activeThread.lastActive} • {activeThread.supplierLocation}
                      </p>

                      {/* Supabase Realtime Status Pill */}
                      <span className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
                        connectionState === 'SUBSCRIBED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                        <span>Supabase Realtime {connectionState === 'SUBSCRIBED' ? 'Active' : 'Connecting'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 hover:text-stone-900 cursor-pointer"
                    title="Close Chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#fdf8f8]">
                
                {/* Initial Product Card Context Banner if present */}
                {initialProduct && displayMessages.length <= 1 && (
                  <div className="bg-white p-3.5 rounded-2xl border border-pink-200 shadow-sm flex items-center gap-4 max-w-lg mx-auto mb-4">
                    <img src={initialProduct.image} alt={initialProduct.title} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#b90064] bg-[#fde7f3] px-2 py-0.5 rounded">Inquiring About Product</span>
                      <h4 className="text-xs font-bold text-stone-900 truncate mt-1">{initialProduct.title}</h4>
                      <p className="text-[11px] text-stone-500 font-medium">MOQ: {initialProduct.moq || '1,000 Units'} • {initialProduct.price || 'Price on request'}</p>
                    </div>
                  </div>
                )}

                {displayMessages.map((msg) => {
                  const isBuyer = msg.sender === 'buyer';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-stone-500">{msg.senderName}</span>
                        <span className="text-[9px] text-stone-400">• {msg.timestamp}</span>
                      </div>

                      <div className={`max-w-md p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                        isBuyer 
                          ? 'bg-[#b90064] text-white rounded-tr-xs' 
                          : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                      }`}>
                        {msg.productContext && (
                          <div className={`p-2.5 rounded-xl mb-2.5 flex items-center gap-3 ${isBuyer ? 'bg-black/10' : 'bg-stone-50 border border-stone-200'}`}>
                            <img src={msg.productContext.image} alt="Product" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className={`text-[10px] font-bold truncate ${isBuyer ? 'text-pink-100' : 'text-[#b90064]'}`}>Context Product</p>
                              <p className={`text-xs font-extrabold truncate ${isBuyer ? 'text-white' : 'text-stone-900'}`}>{msg.productContext.title}</p>
                            </div>
                          </div>
                        )}

                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {msg.attachment && (
                          <div className={`mt-2.5 p-2 rounded-lg flex items-center gap-2 text-[11px] font-medium ${isBuyer ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-800'}`}>
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate flex-1">{msg.attachment.name}</span>
                            <span className="text-[10px] opacity-80">({msg.attachment.size})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Inquiry Chips */}
              <div className="px-4 py-2 bg-white border-t border-stone-100 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
                <span className="text-[10px] font-bold text-stone-400 shrink-0">Quick Enquiries:</span>
                <button onClick={() => handleQuickChip("Request Wholesale Price Quote & Tiered Pricing")} className="px-3 py-1 bg-stone-100 hover:bg-[#fde7f3] hover:text-[#b90064] text-stone-700 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer">
                  💰 Request Wholesale Quote
                </button>
                <button onClick={() => handleQuickChip("What is your exact MOQ and lead time for bulk supply?")} className="px-3 py-1 bg-stone-100 hover:bg-[#fde7f3] hover:text-[#b90064] text-stone-700 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer">
                  📦 Ask for MOQ & Lead Time
                </button>
                <button onClick={() => handleQuickChip("Please send sample kit and COA document for evaluation")} className="px-3 py-1 bg-stone-100 hover:bg-[#fde7f3] hover:text-[#b90064] text-stone-700 text-[11px] font-bold rounded-full transition-colors whitespace-nowrap cursor-pointer">
                  🧪 Request Sample Kit & COA
                </button>
              </div>

              {/* Input Area */}
              <div className="p-3.5 border-t border-stone-200 bg-white flex items-center gap-3 shrink-0 relative">
                {attachedFile && (
                  <div className="absolute bottom-16 left-4 bg-stone-900 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                    <Paperclip className="w-3.5 h-3.5 text-pink-400" />
                    <span>{attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="text-stone-400 hover:text-white ml-2 cursor-pointer font-bold">×</button>
                  </div>
                )}

                <button
                  onClick={handleAttachMock}
                  className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-500 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
                  title="Attach Spec Sheet / File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message to the supplier..."
                  className="flex-1 bg-stone-100 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#b90064] transition-colors"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={isSending || (!messageInput.trim() && !attachedFile)}
                  className="bg-[#b90064] hover:bg-[#a00056] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <MessageSquare className="w-12 h-12 text-stone-300 mb-2" />
              <p className="text-sm font-bold text-stone-600">No conversation selected</p>
              <p className="text-xs text-stone-400 mt-1">Select a supplier from the left to start direct B2B messaging.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
