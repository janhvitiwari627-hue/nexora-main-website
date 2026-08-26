import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../db/database';

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_body: string;
  sent_at: string;
  is_read: boolean;
  attachments?: string[];
}

export function useChatSubscription(conversationId: string | null, enabled: boolean = true) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [connectionState, setConnectionState] = useState<'SUBSCRIBED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!enabled || !conversationId) {
      setMessages([]);
      setConnectionState('DISCONNECTED');
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Initial Fetch for conversation messages
    const fetchConversationMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(data as ChatMessageRecord[]);
        } else {
          // Fallback to local relational database
          const dbMsgs = db.getMessages(conversationId);
          if (dbMsgs && dbMsgs.length > 0) {
            setMessages(
              dbMsgs.map((m: any) => ({
                id: m.id || `msg-${Date.now()}`,
                conversation_id: conversationId,
                sender_id: m.sender_id || 'usr-buyer-priya',
                receiver_id: m.receiver_id || 'usr-supp-1',
                message_body: m.message_body || m.text || '',
                sent_at: m.sent_at || m.timestamp || new Date().toISOString(),
                is_read: m.is_read || false,
                attachments: m.attachments || []
              }))
            );
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        console.warn('[useChatSubscription] Initial fetch warning:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationMessages();

    // 2. Setup Supabase Realtime Channel Subscription on 'messages' table
    const channelName = `realtime-chat:${conversationId}`;
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
          const newRecord = payload.new as ChatMessageRecord;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRecord.id)) return prev;
            return [...prev, newRecord];
          });
          setConnectionState('SUBSCRIBED');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('SUBSCRIBED');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionState('DISCONNECTED');
        } else {
          setConnectionState('CONNECTING');
        }
      });

    // Cleanup subscription on active conversation change or unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, enabled]);

  // Send message helper function
  const pushMessage = useCallback(
    async (payload: { senderId: string; receiverId: string; body: string; attachments?: string[] }) => {
      if (!conversationId || !payload.body.trim()) return null;

      const nowIso = new Date().toISOString();
      const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const tempMessage: ChatMessageRecord = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: payload.senderId,
        receiver_id: payload.receiverId,
        message_body: payload.body,
        sent_at: nowIso,
        is_read: false,
        attachments: payload.attachments || []
      };

      // Optimistic update
      setMessages((prev) => [...prev, tempMessage]);

      // Local db persistence
      db.sendMessage({
        conversation_id: conversationId,
        sender_id: payload.senderId,
        receiver_id: payload.receiverId,
        message_body: payload.body,
        attachments: payload.attachments || []
      });

      // Supabase database insert (triggers Realtime broadcast)
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: payload.senderId,
            receiver_id: payload.receiverId,
            message_body: payload.body,
            attachments: payload.attachments || [],
            sent_at: nowIso,
            is_read: false
          })
          .select()
          .single();

        if (!error && data) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as ChatMessageRecord) : m)));
        }
      } catch (err) {
        console.warn('[useChatSubscription] Push message error:', err);
      }

      return tempMessage;
    },
    [conversationId]
  );

  return {
    messages,
    connectionState,
    loading,
    pushMessage
  };
}
