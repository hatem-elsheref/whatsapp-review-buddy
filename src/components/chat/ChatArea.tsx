import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { formatDistanceStrict } from 'date-fns';
import { api, contactAvatarLabel, contactDisplayName, Conversation, Message } from '@/lib/api';
import ChatBubble from './ChatBubble';
import MessageComposer from './MessageComposer';
import { Loader2, MessageCircle as MessageSquare } from 'lucide-react';
import { subscribeToChat, NewMessageEvent, MessageStatusUpdatedEvent } from '@/lib/pusher';

interface ChatAreaProps {
  conversation: Conversation;
}

const ChatArea = ({ conversation }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [windowExpiresAt, setWindowExpiresAt] = useState<string | null>(conversation.window_expires_at ?? null);
  const [windowOpenOverride, setWindowOpenOverride] = useState<boolean | null>(conversation.window_open ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const expiresAtMs = useMemo(() => {
    if (!windowExpiresAt) return null;
    const t = new Date(windowExpiresAt).getTime();
    return Number.isNaN(t) ? null : t;
  }, [windowExpiresAt]);

  const windowOpen = useMemo(() => {
    if (windowOpenOverride !== null) return windowOpenOverride;
    if (!expiresAtMs) return false;
    return expiresAtMs > now;
  }, [expiresAtMs, now, windowOpenOverride]);

  const windowLabel = useMemo(() => {
    if (!expiresAtMs) return null;
    if (expiresAtMs <= now) return null;
    return formatDistanceStrict(expiresAtMs, now, { roundingMethod: 'floor' });
  }, [expiresAtMs, now]);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<{ data: Message[] }>(`/conversations/${conversation.id}/messages`);
      const msgs = data.data || [];
      setMessages(msgs.reverse());
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]);

  const handleNewMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    const unsub = subscribeToChat((evt: NewMessageEvent) => {
      if (evt.conversation_id !== conversation.id) return;
      if (typeof evt.window_open === 'boolean') setWindowOpenOverride(evt.window_open);
      if (evt.window_expires_at) setWindowExpiresAt(evt.window_expires_at);
      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(evt.id))) return prev;
        const next: Message = {
          id: evt.id,
          conversation_id: evt.conversation_id,
          contact_id: evt.contact_id,
          meta_message_id: null,
          direction: evt.direction,
          type: evt.type,
          content: evt.content,
          template_name: null,
          template_components: null,
          interactive_payload: null,
          media_id: null,
          media_url: null,
          media_download_url: null,
          media_type: null,
          status: null,
          sent_at: null,
          created_at: evt.created_at,
        };
        return [...prev, next];
      });
    }, (s: MessageStatusUpdatedEvent) => {
      if (s.conversation_id !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(s.id)
            ? {
                ...m,
                status: s.status,
                meta_message_id: s.meta_message_id,
                sent_at: s.sent_at ?? m.sent_at,
                delivered_at: s.delivered_at ?? m.delivered_at,
                read_at: s.read_at ?? m.read_at,
              }
            : m
        )
      );
    });
    return unsub;
  }, [conversation.id]);

  const contact = conversation.contact;
  const headerName = contactDisplayName(contact);
  const avatarLabel = contactAvatarLabel(contact);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {avatarLabel}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base">{headerName}</p>
          <p className="text-sm text-muted-foreground">{contact?.phone_number}</p>
        </div>
        {windowOpen && (
          <span
            className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium"
            title={expiresAtMs ? `Window expires at ${new Date(expiresAtMs).toLocaleString()}` : undefined}
          >
            24h window • {windowLabel ?? 'active'}
          </span>
        )}
        {!windowOpen && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
            Template only
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start the conversation</p>
          </div>
        ) : (
          <div className="w-full px-4 py-4 space-y-3">
            {messages.map((msg, index) => {
              const msgDate = msg.created_at ? new Date(msg.created_at) : null;
              const prevMsgDate = index > 0 && messages[index - 1].created_at ? new Date(messages[index - 1].created_at) : null;
              const showDate = !prevMsgDate || (msgDate && prevMsgDate && msgDate.toDateString() !== prevMsgDate.toDateString());
              
              return (
                <div key={msg.id}>
                  {showDate && msgDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] bg-white/80 border border-gray-200 text-gray-600 px-3 py-1 rounded-full shadow-sm">
                        {msgDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <ChatBubble key={msg.id} message={msg} />
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer 
        conversationId={conversation.id} 
        canSendFreeText={windowOpen}
        onMessageSent={handleNewMessage}
      />
    </div>
  );
};

export default ChatArea;