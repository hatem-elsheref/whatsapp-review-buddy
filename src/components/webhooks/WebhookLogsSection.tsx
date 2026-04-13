import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface WebhookLog {
  id: number;
  event_type: string;
  direction: string | null;
  from_number: string | null;
  to_number: string | null;
  message_id: string | null;
  status: string | null;
  payload: Record<string, unknown> | null;
  http_status: number | null;
  created_at: string;
}

const WebhookLogsSection = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URLSearchParams();
      url.append('page', page.toString());
      if (filter !== 'ALL') {
        url.append('event_type', filter);
      }
      const data = await api.get<{ data: WebhookLog[]; meta: { last_page?: number } }>(`/webhook-logs?${url}`);
      if (page === 1) {
        setLogs(data.data || []);
      } else {
        setLogs(prev => [...prev, ...(data.data || [])]);
      }
      setHasMore((data.meta?.last_page || 1) > page);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter(l => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (l.from_number?.toLowerCase().includes(searchLower)) ||
             (l.to_number?.toLowerCase().includes(searchLower)) ||
             (l.event_type?.toLowerCase().includes(searchLower));
    }
    return true;
  });

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const getEventTypeColor = (type: string) => {
    if (type === 'message_received') return 'bg-blue-100 text-blue-700';
    if (type === 'message_status') return 'bg-green-100 text-green-700';
    if (type === 'webhook_verified') return 'bg-purple-100 text-purple-700';
    if (type === 'webhook_verify') return 'bg-gray-100 text-gray-700';
    return 'bg-muted text-muted-foreground';
  };

  const getDirectionIcon = (direction: string | null) => {
    if (direction === 'inbound') return '↓';
    if (direction === 'outbound') return '↑';
    return '↔';
  };

  const httpColor = (code: number | null) => {
    if (!code) return 'bg-muted text-muted-foreground';
    return code >= 200 && code < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Webhook Logs</h2>
          <span className="text-xs text-muted-foreground">({logs.length} entries)</span>
        </div>
        <button 
          onClick={() => { setPage(1); fetchLogs(); }} 
          className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-1"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {['ALL', 'message_received', 'message_status', 'webhook_verified', 'webhook_verify'].map(f => (
            <button 
              key={f} 
              onClick={() => { setFilter(f); setPage(1); }} 
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              {f === 'ALL' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by number or event..." 
            className="w-full bg-muted rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none" 
          />
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No log entries</div>
        ) : (
          <>
            {filtered.map(log => (
              <div key={log.id} className="border-b border-border last:border-0">
                <button 
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} 
                  className="w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
                >
                  {expandedId === log.id ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{formatTime(log.created_at)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded w-24 text-center shrink-0 ${getEventTypeColor(log.event_type)}`}>
                    {log.event_type?.replace('_', ' ')}
                  </span>
                  <span className="text-sm shrink-0">{getDirectionIcon(log.direction)}</span>
                  <span className="text-xs text-muted-foreground truncate w-32">{log.from_number || '-'}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-muted-foreground truncate w-32">{log.to_number || '-'}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${httpColor(log.http_status)}`}>
                    {log.http_status || '-'}
                  </span>
                </button>
                {expandedId === log.id && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Event:</span> {log.event_type}</div>
                      <div><span className="text-muted-foreground">Direction:</span> {log.direction || '-'}</div>
                      <div><span className="text-muted-foreground">Message ID:</span> {log.message_id || '-'}</div>
                      <div><span className="text-muted-foreground">Status:</span> {log.status || '-'}</div>
                      <div><span className="text-muted-foreground">Date:</span> {formatDate(log.created_at)}</div>
                    </div>
                    {log.payload && (
                      <pre className="bg-background rounded-lg p-3 text-xs overflow-x-auto max-h-48">
                        <code>{JSON.stringify(log.payload, null, 2)}</code>
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {hasMore && (
              <div className="p-3 text-center">
                <button 
                  onClick={loadMore} 
                  disabled={loading}
                  className="text-xs text-primary hover:underline"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

export default WebhookLogsSection;