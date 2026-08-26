import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../db/database';

export interface SupabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_body: string;
  sent_at: string;
  is_read: boolean;
  attachments?: string[];
}

export function useRealtimeMessages(conversationId: string | null, enabled: boolean = true) {
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!enabled || !conversationId) {
      setMessages([]);
      setStatus('disconnected');
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Initial Fetch
    const fetchInitial = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data as SupabaseMessage[]);
        } else {
          // Sync with local relational DB as fallback
          const dbMsgs = db.getMessages(conversationId);
          if (dbMsgs && dbMsgs.length > 0) {
            setMessages(dbMsgs.map((m: any) => ({
              id: m.id || `msg-${Date.now()}`,
              conversation_id: conversationId,
              sender_id: m.sender_id || 'usr-buyer-priya',
              receiver_id: m.receiver_id || 'usr-supp-1',
              message_body: m.message_body || m.text || '',
              sent_at: m.sent_at || m.timestamp || new Date().toISOString(),
              is_read: m.is_read || false,
              attachments: m.attachments || []
            })));
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.warn('[useRealtimeMessages] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // 2. Realtime Postgres Changes Subscription
    const channelName = `realtime:messages:${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as SupabaseMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setStatus('connected');
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subStatus === 'CLOSED' || subStatus === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        } else {
          setStatus('connecting');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled]);

  const sendMessage = useCallback(async (msg: {
    senderId: string;
    receiverId: string;
    body: string;
    attachments?: string[];
  }) => {
    if (!conversationId || !msg.body.trim()) return null;

    const nowIso = new Date().toISOString();
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newMsgRecord: SupabaseMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: msg.senderId,
      receiver_id: msg.receiverId,
      message_body: msg.body,
      sent_at: nowIso,
      is_read: false,
      attachments: msg.attachments || []
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsgRecord]);

    // Local DB persist
    db.sendMessage({
      conversation_id: conversationId,
      sender_id: msg.senderId,
      receiver_id: msg.receiverId,
      message_body: msg.body,
      attachments: msg.attachments || []
    });

    // Supabase push
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: msg.senderId,
          receiver_id: msg.receiverId,
          message_body: msg.body,
          attachments: msg.attachments || [],
          sent_at: nowIso,
          is_read: false
        })
        .select()
        .single();

      if (!error && data) {
        // Replace temp ID with real DB ID
        setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as SupabaseMessage) : m)));
      }
    } catch (err) {
      console.warn('[useRealtimeMessages] Send error:', err);
    }

    return newMsgRecord;
  }, [conversationId]);

  return { messages, status, loading, sendMessage };
}
