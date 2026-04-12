import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Trash2, Radio, ChevronDown, ChevronRight } from 'lucide-react';
import { WebhookLog, WebhookLogType, Message } from '../../types';
import { toast } from 'sonner';

const typeColors: Record<WebhookLogType, string> = {
  RECEIVED: 'bg-badge-blue/20 text-badge-blue',
  SENT: 'bg-badge-green/20 text-badge-green',
  STATUS: 'bg-muted text-muted-foreground',
  ERROR: 'bg-badge-red/20 text-badge-red',
};

const httpColor = (code: number) => code >= 200 && code < 300 ? 'bg-badge-green/20 text-badge-green' : 'bg-badge-red/20 text-badge-red';

const WebhookLogsSection = () => {
  const { webhookLogs, setWebhookLogs, addWebhookLog, customers, addMessage } = useApp();
  const [filter, setFilter] = useState<WebhookLogType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = webhookLogs
    .filter(l => filter === 'ALL' || l.type === filter)
    .filter(l => !search || l.from.includes(search) || l.to.includes(search) || l.eventName.includes(search));

  const clearLogs = () => {
    setWebhookLogs([]);
    toast.success('Logs cleared');
  };

  const simulateIncoming = () => {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const texts = ['Hi there!', 'Can you help me?', 'What are your business hours?', 'I have a question about my order', 'Thanks for your help!'];
    const text = texts[Math.floor(Math.random() * texts.length)];

    const log: WebhookLog = {
      id: `w-${Date.now()}`,
      timestamp: new Date(),
      type: 'RECEIVED',
      eventName: 'messages',
      from: customer.phone,
      to: '+14155238886',
      httpStatus: 200,
      payload: {
        object: 'whatsapp_business_account',
        entry: [{ id: 'WABA_ID', changes: [{ value: { messaging_product: 'whatsapp', messages: [{ from: customer.phone.replace('+', ''), type: 'text', text: { body: text } }] }, field: 'messages' }] }],
      },
    };
    addWebhookLog(log);

    const msg: Message = {
      id: `msg-${Date.now()}`,
      customerId: customer.id,
      type: 'text',
      direction: 'incoming',
      content: text,
      timestamp: new Date(),
    };
    addMessage(msg);
    toast.success(`Simulated message from ${customer.name}`);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Webhook Logs</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-badge-green animate-pulse" />
            <span className="text-xs text-badge-green">Listening</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={simulateIncoming} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> Simulate Incoming
          </button>
          <button onClick={clearLogs} className="text-xs bg-destructive/20 text-destructive px-3 py-1.5 rounded-lg hover:bg-destructive/30 transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {(['ALL', 'RECEIVED', 'SENT', 'STATUS', 'ERROR'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-muted rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none" />
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No log entries</div>
        ) : filtered.map(log => (
          <div key={log.id} className="border-b border-border last:border-0">
            <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="w-full text-left p-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
              {expandedId === log.id ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              <span className="text-xs text-muted-foreground w-20 shrink-0">{formatTime(log.timestamp)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded w-20 text-center shrink-0 ${typeColors[log.type]}`}>{log.type}</span>
              <span className="text-sm flex-1 truncate">{log.eventName}</span>
              <span className="text-xs text-muted-foreground truncate w-32">{log.from}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs text-muted-foreground truncate w-32">{log.to}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${httpColor(log.httpStatus)}`}>{log.httpStatus}</span>
            </button>
            {expandedId === log.id && (
              <div className="px-3 pb-3">
                <pre className="bg-background rounded-lg p-3 text-xs overflow-x-auto max-h-64"><code>{JSON.stringify(log.payload, null, 2)}</code></pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebhookLogsSection;
