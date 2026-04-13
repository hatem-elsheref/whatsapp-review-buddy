import { Message } from '@/lib/api';
import { Check, CheckCheck } from 'lucide-react';

const ChatBubble = ({ message }: { message: Message }) => {
  const isOutgoing = message.direction === 'outbound';

  const interactive = (message.interactive_payload ?? null) as
    | null
    | {
        type?: string;
        body?: { text?: string };
        header?: { type?: string; text?: string };
        footer?: { text?: string };
        action?: {
          button?: string;
          sections?: Array<{
            title: string;
            rows: Array<{ id: string; title: string; description?: string }>;
          }>;
          buttons?: Array<{ type: string; reply?: { id: string; title: string } }>;
        };
        // legacy/local shape
        button?: string;
        buttons?: Array<{ id: string; title: string }>;
        sections?: Array<{
          title: string;
          rows: Array<{ id: string; title: string; description?: string }>;
        }>;
      };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const StatusIcon = () => {
    if (!isOutgoing) return null;
    if (message.status === 'read') return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (message.status === 'delivered') return <CheckCheck className="w-4 h-4 text-green-600" />;
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
      <div className={`max-w-[80%] ${isOutgoing ? 'items-end' : 'items-start'} flex flex-col`}>
        {message.type === 'template' && message.template_name && (
          <span className="text-[11px] text-muted-foreground mb-1 px-1">
            📋 {message.template_name}
          </span>
        )}

        {message.interactive_payload && (
          <span className="text-[11px] text-muted-foreground mb-1 px-1">
            🧩 Interactive message
          </span>
        )}
        
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
          isOutgoing 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-sm' 
            : 'bg-white text-foreground rounded-bl-sm border border-gray-100'
        }`}>
          <p className="text-[15px] leading-relaxed">{message.content}</p>

          {!isOutgoing && interactive?.type === 'button_reply' && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-[11px] font-medium">
                Selected: {interactive.button_reply?.title || 'Button'}
              </span>
            </div>
          )}

          {!isOutgoing && interactive?.type === 'list_reply' && (
            <div className="mt-2 space-y-1">
              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 text-[11px] font-medium">
                Selected: {interactive.list_reply?.title || 'Option'}
              </span>
              {interactive.list_reply?.description ? (
                <div className="text-[11px] text-muted-foreground">
                  {interactive.list_reply.description}
                </div>
              ) : null}
            </div>
          )}

          {interactive?.type === 'list' && (
            <div className={`mt-2 rounded-lg border ${isOutgoing ? 'border-white/30 bg-white/10' : 'border-border bg-muted/50'} p-2`}>
              <div className={`text-xs font-medium ${isOutgoing ? 'text-white/90' : 'text-foreground'}`}>
                {interactive.action?.button || interactive.button || 'View options'}
              </div>
              <div className={`mt-1 space-y-2 ${isOutgoing ? 'text-white/90' : 'text-muted-foreground'}`}>
                {(interactive.action?.sections || interactive.sections || []).slice(0, 2).map((s, idx) => (
                  <div key={`${s.title}-${idx}`}>
                    <div className="text-[11px] font-semibold opacity-90">{s.title}</div>
                    <ul className="mt-1 space-y-1">
                      {s.rows.slice(0, 3).map((r) => (
                        <li key={r.id} className="text-[11px]">
                          <span className="font-medium">{r.title}</span>
                          {r.description ? <span className="opacity-80"> — {r.description}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {interactive?.type === 'button' && (
            <div className={`mt-2 rounded-lg border ${isOutgoing ? 'border-white/30 bg-white/10' : 'border-border bg-muted/50'} p-2`}>
              <div className="space-y-1">
                {(interactive.action?.buttons || []).length > 0
                  ? interactive.action?.buttons?.slice(0, 3).map((b, idx) => (
                      <div
                        key={`${b.reply?.id || idx}`}
                        className={`text-[11px] rounded-md px-2 py-1 text-center ${
                          isOutgoing ? 'bg-white/15 text-white/90' : 'bg-background text-primary border border-border'
                        }`}
                      >
                        {b.reply?.title || 'Button'}
                      </div>
                    ))
                  : (interactive.buttons || []).slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className={`text-[11px] rounded-md px-2 py-1 text-center ${
                          isOutgoing ? 'bg-white/15 text-white/90' : 'bg-background text-primary border border-border'
                        }`}
                      >
                        {b.title}
                      </div>
                    ))}
              </div>
            </div>
          )}

          {message.media_id && (
            <a
              href={`${import.meta.env.VITE_API_URL || ''}/messages/${message.id}/media`}
              target="_blank"
              rel="noreferrer"
              className={`mt-2 inline-flex text-xs underline ${isOutgoing ? 'text-white/90' : 'text-primary'}`}
            >
              Download media
            </a>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1 px-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] text-gray-400">{formatTime(message.sent_at || message.created_at)}</span>
          {isOutgoing && <StatusIcon />}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;