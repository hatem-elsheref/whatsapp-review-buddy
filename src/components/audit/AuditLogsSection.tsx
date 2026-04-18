import { useState, useEffect, useCallback, Fragment } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditLogRow {
  id: number;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, unknown> | null;
  ip: string | null;
  user: { id: number; name: string; email: string } | null;
  created_at: string;
}

const actionColor = (action: string) => {
  if (action.startsWith('meta_settings')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
  if (action.startsWith('user.') || action.startsWith('auth.')) return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200';
  if (action.startsWith('flow')) return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200';
  if (action.startsWith('ai_settings')) return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
  if (action.startsWith('contact.')) return 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200';
  if (action.startsWith('templates.')) return 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200';
  if (action.startsWith('whatsapp.') || action.startsWith('external.whatsapp')) return 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200';
  return 'bg-muted text-muted-foreground';
};

const shortSubject = (type: string | null, id: number | null) => {
  if (!type && id == null) return '—';
  const parts = type?.split('\\') ?? [];
  const short = parts[parts.length - 1] || type || '';
  return id != null ? `${short} #${id}` : short || '—';
};

const AuditLogsSection = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ last_page: number; total: number } | null>(null);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('per_page', '40');
      const res = await api.get<{
        data: AuditLogRow[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
      }>(`/audit-logs?${params.toString()}`);

      setMeta({
        last_page: res.meta.last_page,
        total: res.meta.total,
      });
      setPage(pageNum);
      setLogs((prev) => (append ? [...prev, ...(res.data || [])] : res.data || []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
      if (!append) setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const filtered = logs.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.action.toLowerCase().includes(q) ||
      row.user?.email?.toLowerCase().includes(q) ||
      row.user?.name?.toLowerCase().includes(q) ||
      (row.subject_type?.toLowerCase().includes(q) ?? false) ||
      String(row.subject_id ?? '').includes(q) ||
      (row.ip?.toLowerCase().includes(q) ?? false)
    );
  });

  const loadMore = () => {
    if (!meta || page >= meta.last_page || loading) return;
    void fetchPage(page + 1, true);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Audit log</h2>
            <p className="text-sm text-muted-foreground">
              Admin actions: settings, users, flow, and AI configuration.
              {meta != null && (
                <span className="ml-1">· {meta.total} event{meta.total === 1 ? '' : 's'}</span>
              )}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by action, user, IP…"
            className="w-full bg-muted rounded-lg pl-9 pr-3 py-2 text-sm outline-none border border-transparent focus:border-border"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No audit entries match your filter.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="p-3 w-8" />
                <th className="p-3">When</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3 hidden md:table-cell">Subject</th>
                <th className="p-3 hidden lg:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const open = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      className={`border-b border-border last:border-0 ${open ? 'bg-muted/40' : 'hover:bg-muted/25'} transition-colors`}
                    >
                      <td className="p-2 align-top">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : row.id)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                          aria-expanded={open}
                        >
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-3 align-top text-muted-foreground whitespace-nowrap">{formatTime(row.created_at)}</td>
                      <td className="p-3 align-top">
                        {row.user ? (
                          <div>
                            <div className="font-medium text-foreground">{row.user.name}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[10rem]">{row.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium ${actionColor(row.action)}`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="p-3 align-top hidden md:table-cell text-muted-foreground font-mono text-xs">
                        {shortSubject(row.subject_type, row.subject_id)}
                      </td>
                      <td className="p-3 align-top hidden lg:table-cell text-muted-foreground font-mono text-xs">
                        {row.ip ?? '—'}
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={6} className="p-4 pl-12">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Details</p>
                          <pre className="text-xs bg-background border border-border rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto">
                            {JSON.stringify(
                              {
                                subject_type: row.subject_type,
                                subject_id: row.subject_id,
                                properties: row.properties,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {meta && page < meta.last_page && (
          <div className="p-3 border-t border-border flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsSection;
