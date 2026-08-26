export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'supplier';
  senderName: string;
  text: string;
  timestamp: string;
  productContext?: {
    title: string;
    image: string;
    price?: string;
    moq?: string;
  };
  attachment?: {
    name: string;
    size: string;
  };
}

export interface ChatThread {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierAvatar?: string;
  supplierLocation: string;
  isVerified: boolean;
  lastActive: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'nexora_chat_threads_v1';

const DEFAULT_THREADS: ChatThread[] = [
  {
    id: 'thread-1',
    supplierId: 'sup-1',
    supplierName: 'Aura Beauty Labs',
    supplierLocation: 'Mumbai, MH',
    isVerified: true,
    lastActive: 'Online',
    unreadCount: 1,
    messages: [
      {
        id: 'm-1',
        sender: 'supplier',
        senderName: 'Aura Beauty Labs (Sales Desk)',
        text: 'Hello! Welcome to Aura Beauty Labs. How can we assist your private label or bulk sourcing requirements today?',
        timestamp: '10:30 AM'
      }
    ]
  },
  {
    id: 'thread-2',
    supplierId: 'sup-2',
    supplierName: 'Dermaglow India',
    supplierLocation: 'Bengaluru, KA',
    isVerified: true,
    lastActive: '2 hrs ago',
    unreadCount: 0,
    messages: [
      {
        id: 'm-2',
        sender: 'supplier',
        senderName: 'Dermaglow India',
        text: 'Thanks for your inquiry regarding our Vitamin C Serums. Samples are dispatched within 48 hours.',
        timestamp: 'Yesterday'
      }
    ]
  }
];

export function getStoredChatThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THREADS));
      return DEFAULT_THREADS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_THREADS;
  }
}

export function saveChatThreads(threads: ChatThread[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new Event('nexora_chat_updated'));
  } catch (e) {
    console.error('Failed to save chat threads', e);
  }
}

export function sendChatMessage(supplierId: string, supplierName: string, supplierLocation: string, isVerified: boolean, text: string, productContext?: ChatMessage['productContext'], attachment?: ChatMessage['attachment']) {
  const threads = getStoredChatThreads();
  let thread = threads.find(t => t.supplierId === supplierId);
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'buyer',
    senderName: 'You (Buyer)',
    text,
    timestamp: timeStr,
    productContext,
    attachment
  };

  if (!thread) {
    thread = {
      id: `thread-${Date.now()}`,
      supplierId,
      supplierName,
      supplierLocation,
      isVerified,
      lastActive: 'Online',
      unreadCount: 0,
      messages: [newMsg]
    };
    threads.unshift(thread);
  } else {
    thread.messages.push(newMsg);
  }

  saveChatThreads(threads);

  // Simulate automated supplier response after 2 seconds
  setTimeout(() => {
    const freshThreads = getStoredChatThreads();
    const targetThread = freshThreads.find(t => t.supplierId === supplierId);
    if (targetThread) {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const autoReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'supplier',
        senderName: `${supplierName} (Desk)`,
        text: `Thank you for reaching out regarding "${productContext?.title || 'our product'}". Our sourcing manager has received your message and will send a formal quote & MOQ breakdown shortly.`,
        timestamp: replyTime
      };
      targetThread.messages.push(autoReply);
      targetThread.unreadCount += 1;
      saveChatThreads(freshThreads);
    }
  }, 2000);

  return thread.id;
}

export function supplierReplyMessage(threadId: string, text: string) {
  const threads = getStoredChatThreads();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const replyMsg: ChatMessage = {
    id: `msg-s-${Date.now()}`,
    sender: 'supplier',
    senderName: `${thread.supplierName} (Sales)`,
    text,
    timestamp: timeStr
  };

  thread.messages.push(replyMsg);
  saveChatThreads(threads);
}
