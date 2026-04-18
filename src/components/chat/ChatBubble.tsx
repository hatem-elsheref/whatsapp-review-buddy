import { api, Message } from '@/lib/api';

function outgoingSenderCaption(message: Message): string | null {
  const k = (message.sender_kind ?? '').toLowerCase();
  if (k === 'agent') {
    const n = message.sent_by_user?.name?.trim();
    return n ? n : 'Agent';
  }
  if (k === 'system') return 'Automation';
  if (k === 'integration') return 'API / integration';
  if (k === 'contact') return null;
  return null;
}
import { Check, CheckCheck, Clock, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import MediaViewerModal from './MediaViewerModal';

const ChatBubble = ({ message }: { message: Message }) => {
  const direction = String((message as any).direction ?? '').toLowerCase();
  const isOutgoing =
    direction === 'outbound' ||
    direction === 'outgoing' ||
    // fallback for legacy rows
    (direction === '' && (message as any).status === 'sent');
  const outgoingCaption = isOutgoing ? outgoingSenderCaption(message) : null;
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const autoLoadMedia = useMemo(() => {
    const mt = (message.media_type ?? '').toLowerCase();
    const t = (message.type ?? '').toLowerCase();
    return Boolean(message.media_id) && (mt.startsWith('image/') || t === 'image');
  }, [message.media_id, message.media_type, message.type]);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  useEffect(() => {
    if (!autoLoadMedia) return;
    if (mediaUrl || mediaLoading) return;
    void (async () => {
      await handleLoadMedia();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadMedia]);

  const displayText = useMemo(() => {
    const raw = (message.content ?? '').trim();
    if (raw) return raw;
    if (message.media_id) {
      const t = (message.type || '').toLowerCase();
      if (t) return `[${t}]`;
      return '[media]';
    }
    if (message.interactive_payload) return '[interactive]';
    const t = (message.type || '').toLowerCase();
    return t ? `[${t}]` : '';
  }, [message.content, message.interactive_payload, message.media_id, message.type]);

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
    if (message.status === 'queued') return <Clock className="w-4 h-4 text-gray-400" />;
    if (message.status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    if (message.status === 'read') return <CheckCheck className="w-4 h-4 text-blue-500" />;
    if (message.status === 'delivered') return <CheckCheck className="w-4 h-4 text-green-600" />;
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  const handleLoadMedia = async () => {
    if (!message.media_id || mediaLoading || mediaUrl) return;
    setMediaLoading(true);
    try {
      const blob = await api.getBlob(message.media_download_url || `/messages/${message.id}/media`);
      setMediaType(blob.type || null);
      setMediaUrl(URL.createObjectURL(blob));
    } finally {
      setMediaLoading(false);
    }
  };

  const openViewer = async () => {
    if (!message.media_id) return;
    if (!mediaUrl && !mediaLoading) {
      await handleLoadMedia();
    }
    setViewerOpen(true);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[60%] ${
          isOutgoing ? 'ml-auto items-end pr-2 self-end' : 'mr-auto items-start pl-2 self-start'
        }`}
      >
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOutgoing
              ? 'bg-emerald-600 text-white rounded-br-md'
              : 'bg-gray-100 text-foreground rounded-bl-md border border-gray-200'
          }`}
        >
          {message.type === 'template' && message.template_name ? (
            <div className={`text-[11px] mb-1 ${isOutgoing ? 'text-white/80' : 'text-muted-foreground'}`}>
              Template: {message.template_name}
            </div>
          ) : null}

          {outgoingCaption ? (
            <div className={`text-[10px] mb-1 font-medium ${isOutgoing ? 'text-white/75' : 'text-muted-foreground'}`}>
              {outgoingCaption}
            </div>
          ) : null}

          {displayText ? (
            <p dir="auto" className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {displayText}
            </p>
          ) : null}

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
            <div className="mt-2 space-y-2">
              {mediaUrl && (mediaType?.startsWith('image/') ?? false) ? (
                <button type="button" onClick={openViewer} className="block">
                  <img
                    src={mediaUrl}
                    alt="attachment"
                    className="max-h-72 rounded-lg border border-black/10 cursor-zoom-in"
                  />
                </button>
              ) : null}

              {!autoLoadMedia && (
                <button
                  type="button"
                  onClick={openViewer}
                  className={`inline-flex text-xs font-medium ${isOutgoing ? 'text-white/90' : 'text-primary'}`}
                  disabled={mediaLoading}
                >
                  {mediaLoading ? 'Loading…' : 'Open media'}
                </button>
              )}

              {mediaUrl && !(mediaType?.startsWith('image/') ?? false) ? (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className={`block text-xs font-medium ${isOutgoing ? 'text-white/90' : 'text-primary'}`}
                >
                  View / download
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1 px-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] text-gray-400">{formatTime(message.sent_at || message.created_at)}</span>
          {isOutgoing && <StatusIcon />}
        </div>
      </div>

      <MediaViewerModal
        open={viewerOpen}
        title={`Message #${message.id}`}
        url={mediaUrl}
        mimeType={mediaType || message.media_type || null}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
};

export default ChatBubble;