import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  FileText,
  MessageSquare,
  Package,
  ShieldCheck,
  Tag,
  Trash2,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  Building2,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  Plus
} from 'lucide-react';
import { AppNotification } from '../types';
import { useNotifications } from '../hooks/useNotifications';

export interface NotificationCenterProps {
  variant?: 'dropdown' | 'full' | 'widget';
  onNavigate?: (screen: any, params?: any) => void;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  variant = 'full',
  onNavigate,
  onClose
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    simulateNewNotification
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'quote' | 'rfq' | 'message'>('all');
  const [justSimulatedId, setJustSimulatedId] = useState<string | null>(null);

  const handleSimulate = () => {
    const newNotif = simulateNewNotification();
    setJustSimulatedId(newNotif.id);
    setTimeout(() => setJustSimulatedId(null), 3000);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'quote') return n.type === 'quote_update';
    if (activeFilter === 'rfq') return n.type === 'rfq_response';
    if (activeFilter === 'message') return n.type === 'message';
    return true;
  });

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.targetScreen && onNavigate) {
      onNavigate(item.targetScreen, item.targetParams);
      if (onClose) onClose();
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'quote_update':
        return <Tag className="w-4 h-4 text-[#B90064]" />;
      case 'rfq_response':
        return <FileText className="w-4 h-4 text-[#0050D6]" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'sample':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'verification':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#B90064]" />;
    }
  };

  const getTypeBadge = (type: AppNotification['type']) => {
    switch (type) {
      case 'quote_update':
        return { label: 'Quote Received', bg: 'bg-[#FDE7F3] text-[#B90064] border-[#F8B4D9]' };
      case 'rfq_response':
        return { label: 'RFQ Response', bg: 'bg-blue-50 text-[#0050D6] border-blue-200' };
      case 'message':
        return { label: 'Direct Message', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'sample':
        return { label: 'Lab Sample', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'verification':
        return { label: 'Trust & Verification', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'System Notice', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  // -------------------------------------------------------------
  // DROPDOWN VARIANT (Navbar Popover)
  // -------------------------------------------------------------
  if (variant === 'dropdown') {
    return (
      <div className="w-[360px] sm:w-[420px] max-h-[540px] bg-white rounded-2xl border border-[#E8DFE3] shadow-2xl overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-[#FCF9F8] border-b border-[#E8DFE3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FDE7F3] flex items-center justify-center text-[#B90064]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-[#1C1B1B] leading-none flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#B90064] text-white text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-[#8D8087] font-semibold mt-0.5">Real-time sourcing alerts & quotes</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Mark all as read"
                className="text-[11px] font-bold text-[#B90064] hover:underline px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#8D8087] hover:bg-gray-100 hover:text-[#1C1B1B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-white border-b border-[#F0EDEC] flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'quote', label: 'Quotes' },
            { id: 'rfq', label: 'RFQs' },
            { id: 'message', label: 'Messages' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-[#B90064] text-white shadow-xs'
                  : 'bg-[#FCF9F8] text-[#594047] hover:bg-[#F0EDEC]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0EDEC] max-h-[360px]">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const badge = getTypeBadge(notif.type);
              const isHighlight = notif.id === justSimulatedId;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-[#FAF1F5] transition-all cursor-pointer relative group flex items-start gap-3 ${
                    !notif.isRead ? 'bg-[#FDF8F8]' : 'bg-white'
                  } ${isHighlight ? 'ring-2 ring-[#B90064] bg-[#FDE7F3]/30 animate-pulse' : ''}`}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#B90064]" />
                  )}

                  {/* Icon / Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.sender?.avatar ? (
                      <img
                        src={notif.sender.avatar}
                        alt={notif.sender.name}
                        className="w-9 h-9 rounded-xl object-cover border border-[#E8DFE3]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#FCF9F8] border border-[#E8DFE3] flex items-center justify-center">
                        {getIcon(notif.type)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full shadow-2xs border border-[#E8DFE3]">
                      {getIcon(notif.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-[#8D8087] font-semibold whitespace-nowrap">
                        {notif.timeAgo}
                      </span>
                    </div>

                    <h4 className="text-[12px] font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors line-clamp-1">
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-[#594047] line-clamp-2 mt-0.5 leading-relaxed font-medium">
                      {notif.description}
                    </p>

                    {/* Metadata Preview Tag */}
                    {notif.metadata?.price && (
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-[#B90064] bg-[#FDE7F3]/60 px-2 py-0.5 rounded-md inline-flex">
                        <Tag className="w-3 h-3" />
                        <span>{notif.metadata.price}</span>
                        {notif.metadata.quantity && <span className="text-[#8D8087]">• {notif.metadata.quantity}</span>}
                      </div>
                    )}
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    title="Dismiss"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8D8087] hover:text-red-600 rounded-md transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-[#8D8087] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-[12px] font-bold text-[#1C1B1B]">You're all caught up!</p>
              <p className="text-[11px] text-[#8D8087]">No {activeFilter !== 'all' ? activeFilter : ''} notifications at the moment.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#FCF9F8] border-t border-[#E8DFE3] flex items-center justify-between text-xs">
          <button
            onClick={handleSimulate}
            className="text-[11px] font-bold text-[#0050D6] hover:underline flex items-center gap-1 cursor-pointer"
            title="Simulate a live quote / RFQ response for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B90064]" />
            <span>Simulate Incoming Alert</span>
          </button>

          <button
            onClick={() => {
              if (onNavigate) onNavigate('buyer-dashboard', { tab: 'notifications' });
              if (onClose) onClose();
            }}
            className="text-[11px] font-black text-[#B90064] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All in Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // WIDGET VARIANT (Compact Card for BuyerDashboard Overview)
  // -------------------------------------------------------------
  if (variant === 'widget') {
    return (
      <div className="bg-white border border-[#E8DFE3] rounded-2xl p-6 shadow-xs space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDE7F3] text-[#B90064] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1C1B1B] tracking-tight">Live Sourcing Alerts</h3>
              <p className="text-[11px] text-[#8D8087] font-medium">Real-time responses & quote alerts</p>
            </div>
          </div>
          <button
            onClick={handleSimulate}
            className="px-2.5 py-1 bg-[#FCF9F8] hover:bg-[#FAF1F5] border border-[#E8DFE3] hover:border-[#B90064] rounded-lg text-[10px] font-black text-[#B90064] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3 h-3" />
            <span>Test Alert</span>
          </button>
        </div>

        {/* Notifications List (Top 3) */}
        <div className="space-y-2.5">
          {notifications.slice(0, 3).map((notif) => {
            const badge = getTypeBadge(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                  !notif.isRead
                    ? 'bg-[#FDF8F8] border-[#B90064]/20 hover:border-[#B90064]'
                    : 'bg-white border-[#E8DFE3] hover:border-[#8D8087]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-[#8D8087] font-semibold">{notif.timeAgo}</span>
                </div>
                <h4 className="text-[12px] font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors mt-1.5 line-clamp-1">
                  {notif.title}
                </h4>
                <p className="text-[11px] text-[#594047] line-clamp-2 mt-0.5 leading-relaxed font-medium">
                  {notif.description}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onNavigate && onNavigate('buyer-dashboard', { tab: 'notifications' })}
          className="w-full py-2 bg-[#FCF9F8] hover:bg-[#F0EDEC] text-[#1C1B1B] hover:text-[#B90064] rounded-xl text-xs font-bold transition-all cursor-pointer border border-[#E8DFE3] flex items-center justify-center gap-1.5"
        >
          <span>View All Notifications ({notifications.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL VARIANT (Dedicated Tab in BuyerDashboard or Standalone Page)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 text-left animate-in fade-in-50 duration-200">
      {/* Top Banner & Actions */}
      <div className="bg-white border border-[#E8DFE3] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FDE7F3] text-[#B90064] text-[10px] font-black uppercase tracking-wider">
              Procurement Pulse
            </span>
            <span className="text-xs text-[#8D8087] font-bold">
              {unreadCount} unread of {notifications.length} total
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#1C1B1B] tracking-tight">
            Notification <span className="text-[#B90064]">Center</span>
          </h2>
          <p className="text-xs text-[#594047] font-medium mt-0.5">
            Real-time procurement feed monitoring RFQ responses, quote updates, lab sample dispatches, and supplier communications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulate}
            className="px-3.5 py-2 bg-[#FDE7F3] hover:bg-[#FBCFE8] text-[#B90064] border border-[#F8B4D9] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Incoming Alert</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-[#E8DFE3] text-[#1C1B1B] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-2 bg-white hover:bg-red-50 border border-[#E8DFE3] hover:border-red-200 text-[#8D8087] hover:text-red-600 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'quote', label: 'Quote Updates', count: notifications.filter(n => n.type === 'quote_update').length },
          { id: 'rfq', label: 'RFQ Responses', count: notifications.filter(n => n.type === 'rfq_response').length },
          { id: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeFilter === f.id
                ? 'bg-[#B90064] text-white border-[#B90064] shadow-xs'
                : 'bg-white text-[#594047] border-[#E8DFE3] hover:bg-[#FCF9F8]'
            }`}
          >
            <span>{f.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeFilter === f.id ? 'bg-white/20 text-white' : 'bg-[#FCF9F8] text-[#8D8087]'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Notifications Grid */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const badge = getTypeBadge(notif.type);
            const isHighlighted = notif.id === justSimulatedId;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? 'border-[#B90064]/30 bg-gradient-to-r from-[#FDF8F8] to-white'
                    : 'border-[#E8DFE3]'
                } ${isHighlighted ? 'ring-2 ring-[#B90064] animate-pulse' : ''}`}
              >
                {/* Left: Avatar & Text Content */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Sender Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    {notif.sender?.avatar ? (
                      <img
                        src={notif.sender.avatar}
                        alt={notif.sender.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#E8DFE3]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#FCF9F8] border border-[#E8DFE3] flex items-center justify-center text-[#B90064]">
                        {getIcon(notif.type)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs border border-[#E8DFE3]">
                      {getIcon(notif.type)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {notif.sender?.name && (
                        <span className="text-xs font-bold text-[#1C1B1B] flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#8D8087]" />
                          {notif.sender.name}
                          {notif.sender.location && (
                            <span className="text-[10px] text-[#8D8087] font-medium">({notif.sender.location})</span>
                          )}
                        </span>
                      )}
                      <span className="text-[11px] text-[#8D8087] font-semibold flex items-center gap-1 ml-auto md:ml-0">
                        <Clock className="w-3 h-3" />
                        {notif.timeAgo}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1C1B1B] group-hover:text-[#B90064] transition-colors">
                      {notif.title}
                    </h3>

                    <p className="text-xs text-[#594047] leading-relaxed font-medium">
                      {notif.description}
                    </p>

                    {/* Rich Metadata Info */}
                    {notif.metadata && (
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {notif.metadata.price && (
                          <div className="px-2.5 py-1 bg-[#FDE7F3] text-[#B90064] rounded-lg text-xs font-black flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Price: {notif.metadata.price}</span>
                          </div>
                        )}
                        {notif.metadata.quantity && (
                          <div className="px-2.5 py-1 bg-[#FCF9F8] border border-[#E8DFE3] text-[#1C1B1B] rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-[#0050D6]" />
                            <span>Qty: {notif.metadata.quantity}</span>
                          </div>
                        )}
                        {notif.metadata.trackingNumber && (
                          <div className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>AWB: {notif.metadata.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#F0EDEC] w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={() => handleNotificationClick(notif)}
                    className="px-4 py-2 bg-[#B90064] text-white rounded-xl text-xs font-black hover:bg-[#8E004B] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-2 bg-[#FCF9F8] hover:bg-red-50 text-[#8D8087] hover:text-red-600 rounded-xl border border-[#E8DFE3] transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-[#E8DFE3] rounded-2xl p-16 text-center shadow-xs space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-[#1C1B1B]">No Notifications Found</h3>
            <p className="text-xs text-[#594047] max-w-sm mx-auto font-medium">
              You are completely up to date. Sourcing RFQs and manufacturer responses will stream live here.
            </p>
            <button
              onClick={handleSimulate}
              className="mt-2 px-4 py-2 bg-[#B90064] text-white rounded-xl text-xs font-black hover:bg-[#8E004B] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Sourcing Response</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
