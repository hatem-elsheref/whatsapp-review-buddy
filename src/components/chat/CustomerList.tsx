import { useState, useEffect } from 'react';
import { api, contactAvatarLabel, contactDisplayName, Conversation } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { formatDistanceStrict } from 'date-fns';

interface CustomerListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: number;
}

const CustomerList = ({ onSelectConversation, selectedId }: CustomerListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await api.get<{ data: Conversation[] }>('/conversations');
      setConversations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const isWindowOpen = (windowExpiresAt: string | null) => {
    if (!windowExpiresAt) return false;
    const t = new Date(windowExpiresAt).getTime();
    if (Number.isNaN(t)) return false;
    return t > Date.now();
  };

  const getWindowTimeLeft = (windowExpiresAt: string | null) => {
    if (!windowExpiresAt) return null;
    const t = new Date(windowExpiresAt).getTime();
    if (Number.isNaN(t)) return null;
    if (t <= now) return null;
    return formatDistanceStrict(t, now, { roundingMethod: 'floor' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Chat Inbox</h2>
        <p className="text-xs text-muted-foreground mt-1">{conversations.length} conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const contact = conv.contact;
            const listTitle = contactDisplayName(contact);
            const listAvatar = contactAvatarLabel(contact);
            const lastMsgTime = conv.last_message_at;
            const isActive = selectedId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full text-left p-3 border-b border-border transition-colors ${
                  isActive ? 'bg-accent' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {listAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm truncate">{listTitle}</span>
                      {lastMsgTime && <span className="text-xs text-muted-foreground">{formatTime(lastMsgTime)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {isWindowOpen(conv.window_expires_at)
                        ? `Active • ${getWindowTimeLeft(conv.window_expires_at) ?? '24h window'} left`
                        : 'Template only'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerList;