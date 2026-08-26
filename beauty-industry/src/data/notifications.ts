import { AppNotification } from '../types';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    type: 'quote_update',
    title: 'New Sourcing Quote Received (₹188/unit)',
    description: 'Dermaglow India submitted Quote #QT-102 for your RFQ "Vitamin C Brightening Serum (Bulk)". Best price candidate with 25 days lead time.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    timeAgo: '15m ago',
    isRead: false,
    priority: 'high',
    targetScreen: 'rfq-tracking',
    targetParams: { rfqId: 'RFQ-8821', quoteId: 'QT-102' },
    sender: {
      name: 'Dermaglow India',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      isVerified: true,
      location: 'Ahmedabad, GJ'
    },
    metadata: {
      rfqId: 'RFQ-8821',
      quoteId: 'QT-102',
      price: '₹188 / unit',
      quantity: '5,000 Units',
      supplierName: 'Dermaglow India',
      productName: 'Vitamin C Brightening Serum (Bulk)'
    }
  },
  {
    id: 'notif-002',
    type: 'rfq_response',
    title: 'Aura Beauty Labs Responded to RFQ',
    description: 'Technical formulation team reviewed your 15% L-Ascorbic Acid brief and confirmed compliance with WHO-GMP clean beauty standards.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    timeAgo: '45m ago',
    isRead: false,
    priority: 'high',
    targetScreen: 'rfq-tracking',
    targetParams: { rfqId: 'RFQ-8821', quoteId: 'QT-101' },
    sender: {
      name: 'Aura Beauty Labs',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isVerified: true,
      location: 'Mumbai, MH'
    },
    metadata: {
      rfqId: 'RFQ-8821',
      quoteId: 'QT-101',
      price: '₹195 / unit',
      quantity: '5,000 Units',
      supplierName: 'Aura Beauty Labs',
      productName: 'Vitamin C Brightening Serum (Bulk)'
    }
  },
  {
    id: 'notif-003',
    type: 'message',
    title: 'New Message from LuxeForm Packaging',
    description: '“Hello Elena, we have updated the CAD die-cut templates for the 30ml gold-foiled luxury dropper bottles. Please review.”',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    timeAgo: '2h ago',
    isRead: false,
    priority: 'medium',
    targetScreen: 'buyer-enquiry-log',
    targetParams: { enquiryId: 'enq-103', supplierName: 'LuxeForm Packaging' },
    sender: {
      name: 'LuxeForm Packaging',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      isVerified: true,
      location: 'New Delhi, DL'
    },
    metadata: {
      supplierName: 'LuxeForm Packaging',
      productName: 'Eco-friendly Glass Dropper Bottles (30ml)'
    }
  },
  {
    id: 'notif-004',
    type: 'sample',
    title: 'Lab Sample Dispatch Confirmed',
    description: '3x Custom patch-test formulation samples of Peptide Barrier Cream dispatched via BlueDart Express (AWB: #BD-9938210).',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
    timeAgo: '6h ago',
    isRead: true,
    priority: 'medium',
    targetScreen: 'sample-request',
    targetParams: { trackingNumber: 'BD-9938210' },
    sender: {
      name: 'Aura Beauty Labs',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      isVerified: true,
      location: 'Mumbai, MH'
    },
    metadata: {
      trackingNumber: 'BD-9938210',
      productName: 'Peptide Barrier Cream Samples',
      supplierName: 'Aura Beauty Labs'
    }
  },
  {
    id: 'notif-005',
    type: 'verification',
    title: 'GST & Business Profile 100% Verified',
    description: 'Your business profile (Radiant Beauty Solutions) has achieved Nexora Trusted Buyer tier with prioritized quote routing.',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
    timeAgo: '1d ago',
    isRead: true,
    priority: 'low',
    targetScreen: 'buyer-dashboard',
    sender: {
      name: 'Nexora Verification Desk',
      avatar: '',
      isVerified: true,
      location: 'HQ'
    }
  }
];

const STORAGE_KEY = 'nexora_notifications_v2';
const EVENT_KEY = 'nexora:notifications:change';

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: notifs }));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function markNotificationAsRead(id: string): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
  saveStoredNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, isRead: true }));
  saveStoredNotifications(updated);
  return updated;
}

export function deleteNotification(id: string): AppNotification[] {
  const current = getStoredNotifications();
  const updated = current.filter(n => n.id !== id);
  saveStoredNotifications(updated);
  return updated;
}

export function clearAllNotifications(): AppNotification[] {
  saveStoredNotifications([]);
  return [];
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'timeAgo' | 'isRead'>): AppNotification {
  const current = getStoredNotifications();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeAgo: 'Just now',
    isRead: false
  };
  const updated = [newNotif, ...current];
  saveStoredNotifications(updated);
  return newNotif;
}

export function simulateRandomNotification(): AppNotification {
  const templates: Array<Omit<AppNotification, 'id' | 'timestamp' | 'timeAgo' | 'isRead'>> = [
    {
      type: 'quote_update',
      title: 'Revised Counter-Offer from Radiant Cosmeceuticals',
      description: 'Radiant Cosmeceuticals submitted a revised tier of ₹192/unit for 10,000 units with free shipping.',
      priority: 'high',
      targetScreen: 'rfq-tracking',
      targetParams: { rfqId: 'RFQ-8821', quoteId: 'QT-103' },
      sender: {
        name: 'Radiant Cosmeceuticals',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
        location: 'Noida, UP'
      },
      metadata: {
        rfqId: 'RFQ-8821',
        quoteId: 'QT-103',
        price: '₹192 / unit',
        quantity: '10,000 Units',
        supplierName: 'Radiant Cosmeceuticals'
      }
    },
    {
      type: 'rfq_response',
      title: 'New Bid on RFQ #RFQ-8819 (Salon Equipment)',
      description: 'CosmoTech Equipments placed a response for "Professional Hair Spa Steamer" offering 15 units in stock.',
      priority: 'medium',
      targetScreen: 'rfq-tracking',
      targetParams: { rfqId: 'RFQ-8819' },
      sender: {
        name: 'CosmoTech Equipments',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
        location: 'Bengaluru, KA'
      },
      metadata: {
        rfqId: 'RFQ-8819',
        price: '₹8,200 / unit',
        quantity: '15 Units',
        supplierName: 'CosmoTech Equipments'
      }
    },
    {
      type: 'message',
      title: 'Direct Chat Reply: Aura Beauty Labs',
      description: '“Hi Elena, our R&D lab head verified the stability matrix with 1% ferulic acid. We can dispatch test batch samples tomorrow.”',
      priority: 'high',
      targetScreen: 'buyer-enquiry-log',
      targetParams: { enquiryId: 'enq-101', supplierName: 'Aura Beauty Labs' },
      sender: {
        name: 'Aura Beauty Labs',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
        location: 'Mumbai, MH'
      },
      metadata: {
        supplierName: 'Aura Beauty Labs',
        productName: 'Vitamin C Brightening Serum'
      }
    }
  ];

  const picked = templates[Math.floor(Math.random() * templates.length)];
  return addNotification(picked);
}
