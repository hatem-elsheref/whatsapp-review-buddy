import { useState, useEffect, useRef, useCallback } from 'react';
import { api, contactAvatarLabel, contactDisplayName, Conversation, Contact, PaginatedResponse } from '@/lib/api';
import { Loader2, Search } from 'lucide-react';
import { formatDistanceStrict } from 'date-fns';
import { playNotificationSound, subscribeToChat, NewMessageEvent } from '@/lib/pusher';

interface CustomerListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedId?: number;
  readClearSignal?: { seq: number; conversationId: number | null };
}

function mergeConversationFromEvent(
  conv: Conversation,
  evt: NewMessageEvent,
  bumpUnread: boolean
): Conversation {
  return {
    ...conv,
    last_message_at: evt.created_at,
    unread_inbound_count: bumpUnread
      ? (conv.unread_inbound_count ?? 0) + 1
      : conv.unread_inbound_count,
    ...(evt.window_expires_at != null && evt.window_expires_at !== ''
      ? { window_expires_at: evt.window_expires_at }
      : {}),
    ...(typeof evt.window_open === 'boolean'
      ? { window_open: evt.window_open, window_remaining_seconds: evt.window_remaining_seconds ?? null }
      : {}),
  };
}

const CustomerList = ({ onSelectConversation, selectedId, readClearSignal }: CustomerListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Conversation>['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const conversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    const params = new URLSearchParams();
    params.set('page', String(pageNum));
    if (searchDebounced.trim()) params.set('search', searchDebounced.trim());

    const data = await api.get<PaginatedResponse<Conversation>>(`/conversations?${params.toString()}`);

    setMeta(data.meta);
    setPage(pageNum);
    setConversations((prev) => (append ? [...prev, ...(data.data || [])] : data.data || []));
  }, [searchDebounced]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await fetchPage(1, false);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        if (!cancelled) {
          setConversations([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  useEffect(() => {
    if (!readClearSignal?.conversationId) return;
    const id = readClearSignal.conversationId;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_inbound_count: 0 } : c))
    );
  }, [readClearSignal?.seq, readClearSignal?.conversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const unsub = subscribeToChat(async (evt: NewMessageEvent) => {
      if (evt.direction === 'inbound') {
        playNotificationSound();
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === evt.conversation_id);
        if (idx === -1) {
          return prev;
        }
        const bumpUnread = evt.direction === 'inbound' && selectedId !== evt.conversation_id;
        const updated = mergeConversationFromEvent(prev[idx], evt, bumpUnread);
        return [updated, ...prev.filter((c) => c.id !== evt.conversation_id)];
      });

      const inList = conversationsRef.current.some((c) => c.id === evt.conversation_id);
      if (!inList) {
        try {
          const res = await api.get<{ data: Conversation }>(`/conversations/${evt.conversation_id}`);
          const c = res.data;
          const conv = mergeConversationFromEvent(
            {
              ...c,
              contact: c.contact as Contact | undefined,
              status: c.status ?? 'open',
            },
            evt,
            false
          );
          setConversations((prev) => [conv, ...prev.filter((x) => x.id !== conv.id)]);
        } catch {
          // ignore
        }
      }
    });
    return unsub;
  }, [selectedId]);

  const loadMore = async () => {
    if (!meta || page >= meta.last_page || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
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

  const isWindowOpen = (conv: Conversation) => {
    if (typeof conv.window_open === 'boolean') return conv.window_open;
    const windowExpiresAt = conv.window_expires_at;
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

  const totalLabel = meta?.total ?? conversations.length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        <div>
          <h2 className="font-semibold text-sm">Chat Inbox</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {totalLabel} conversation{totalLabel === 1 ? '' : 's'}
            {searchDebounced.trim() ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone…"
            className="w-full bg-muted rounded-lg pl-9 pr-3 py-2 text-sm outline-none border border-transparent focus:border-border"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchDebounced.trim() ? 'No conversations match your search' : 'No conversations yet'}
          </div>
        ) : (
          conversations.map((conv) => {
            const contact = conv.contact;
            const listTitle = contactDisplayName(contact);
            const listAvatar = contactAvatarLabel(contact);
            const lastMsgTime = conv.last_message_at;
            const isActive = selectedId === conv.id;
            const windowOpen = isWindowOpen(conv);
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
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-sm truncate">{listTitle}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(conv.unread_inbound_count ?? 0) > 0 && (
                          <span className="text-[10px] font-semibold min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            {(conv.unread_inbound_count ?? 0) > 99 ? '99+' : conv.unread_inbound_count}
                          </span>
                        )}
                        {lastMsgTime && <span className="text-xs text-muted-foreground">{formatTime(lastMsgTime)}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {windowOpen
                        ? `Active • ${getWindowTimeLeft(conv.window_expires_at) ?? '24h window'} left`
                        : 'Template only'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
        {meta && page < meta.last_page && (
          <div className="p-3 border-t border-border">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="w-full py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
