import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart3, Send, Inbox, FileText, Truck, CheckCheck, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

type Period = 'today' | 'week' | 'month';
type Direction = '' | 'inbound' | 'outbound';
type MsgType = '' | 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'interactive';
type MsgStatus = '' | 'queued' | 'sent' | 'failed';

type MetricsResponse = {
  period: Period;
  range: { start_utc: string; end_utc: string };
  messages: {
    inbound_total: number;
    outbound_total: number;
    outbound_template_total: number;
    outbound_text_total: number;
    outbound_status: {
      queued: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
    };
  };
  webhooks: {
    incoming_total: number;
    status_updates_total: number;
    received_messages_total: number;
  };
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  subtitle?: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  </div>
);

const DashboardSection = () => {
  const [period, setPeriod] = useState<Period>('today');
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [timeFrom, setTimeFrom] = useState('00:00');
  const [timeTo, setTimeTo] = useState('23:59');
  const [direction, setDirection] = useState<Direction>('');
  const [type, setType] = useState<MsgType>('');
  const [status, setStatus] = useState<MsgStatus>('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('period', period);
        if (range?.from && range?.to) {
          const [fromH, fromM] = timeFrom.split(':').map((x) => parseInt(x, 10));
          const [toH, toM] = timeTo.split(':').map((x) => parseInt(x, 10));
          const startUtc = new Date(Date.UTC(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), fromH || 0, fromM || 0, 0));
          const endUtc = new Date(Date.UTC(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), toH || 0, toM || 0, 0));
          params.set('start', startUtc.toISOString());
          params.set('end', endUtc.toISOString());
        }
        if (direction) params.set('direction', direction);
        if (type) params.set('type', type);
        if (status) params.set('status', status);

        const res = await api.get<MetricsResponse>(`/metrics?${params.toString()}`);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load metrics');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [period, range?.from, range?.to, timeFrom, timeTo, direction, type, status]);

  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Today';
    if (period === 'week') return 'This week';
    return 'This month';
  }, [period]);

  const outbound = data?.messages.outbound_total ?? 0;
  const inbound = data?.messages.inbound_total ?? 0;
  const templates = data?.messages.outbound_template_total ?? 0;
  const delivered = data?.messages.outbound_status.delivered ?? 0;
  const read = data?.messages.outbound_status.read ?? 0;
  const failed = data?.messages.outbound_status.failed ?? 0;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Quick metrics for {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal w-[260px]", !range?.from && "text-muted-foreground")}>
                {range?.from ? (
                  range.to ? (
                    <>
                      {format(range.from, "LLL dd, y")} – {format(range.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(range.from, "LLL dd, y")
                  )
                ) : (
                  "Date range (UTC)"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b border-border flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">From</span>
                  <input value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} type="time" className="bg-muted rounded px-2 py-1 text-xs outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">To</span>
                  <input value={timeTo} onChange={(e) => setTimeTo(e.target.value)} type="time" className="bg-muted rounded px-2 py-1 text-xs outline-none" />
                </div>
              </div>
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                onSelect={setRange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            title="Direction filter"
          >
            <option value="">All directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MsgType)}
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            title="Type filter"
          >
            <option value="">All types</option>
            <option value="text">Text</option>
            <option value="template">Template</option>
            <option value="interactive">Interactive</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Document</option>
            <option value="sticker">Sticker</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MsgStatus)}
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
            title="Status filter (outbound)"
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setRange(undefined);
              setTimeFrom('00:00');
              setTimeTo('23:59');
              setDirection('');
              setType('');
              setStatus('');
            }}
            className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted"
            title="Clear filters"
          >
            Clear
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Outbound messages" value={loading ? '—' : outbound} icon={Send} subtitle="Total sent/queued" />
        <StatCard title="Inbound messages" value={loading ? '—' : inbound} icon={Inbox} subtitle="Customer messages" />
        <StatCard title="Templates" value={loading ? '—' : templates} icon={FileText} subtitle="Outbound template messages" />

        <StatCard title="Delivered" value={loading ? '—' : delivered} icon={Truck} subtitle="Outbound delivered" />
        <StatCard title="Read" value={loading ? '—' : read} icon={CheckCheck} subtitle="Outbound read" />
        <StatCard title="Failed" value={loading ? '—' : failed} icon={XCircle} subtitle="Outbound failed" />
      </div>

      {data ? (
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Webhook activity</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Incoming webhooks</p>
              <p className="text-lg font-semibold mt-1">{data.webhooks.incoming_total}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Message received events</p>
              <p className="text-lg font-semibold mt-1">{data.webhooks.received_messages_total}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Status updates</p>
              <p className="text-lg font-semibold mt-1">{data.webhooks.status_updates_total}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardSection;

