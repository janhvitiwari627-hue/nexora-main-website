import { useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import {
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  simulateRandomNotification
} from '../data/notifications';

const EVENT_KEY = 'nexora:notifications:change';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStoredNotifications());

  const refresh = useCallback(() => {
    setNotifications(getStoredNotifications());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexora_notifications_v2') {
        refresh();
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification[]>;
      if (customEvent.detail) {
        setNotifications(customEvent.detail);
      } else {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_KEY, handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_KEY, handleCustom);
    };
  }, [refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = useCallback((id: string) => {
    const updated = markNotificationAsRead(id);
    setNotifications(updated);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    const updated = markAllNotificationsAsRead();
    setNotifications(updated);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = deleteNotification(id);
    setNotifications(updated);
  }, []);

  const handleClearAll = useCallback(() => {
    const updated = clearAllNotifications();
    setNotifications(updated);
  }, []);

  const handleSimulate = useCallback(() => {
    const newNotif = simulateRandomNotification();
    refresh();
    return newNotif;
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    markAsRead: handleMarkRead,
    markAllAsRead: handleMarkAllRead,
    deleteNotification: handleDelete,
    clearAll: handleClearAll,
    simulateNewNotification: handleSimulate,
    refresh
  };
}
