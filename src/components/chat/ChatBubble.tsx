import { api, Message } from '@/lib/api';
import { Check, CheckCheck, Clock, Image as ImageIcon, MapPin, Mic, Paperclip, Sticker, Video, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import MediaViewerModal from './MediaViewerModal';

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

/** Backend stores bracket fallbacks for empty captions; hide them when we render rich media. */
function isBracketMediaPlaceholder(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  return /^\[(Image|Video|Audio|Document|Sticker|Interactive|Location|Message|CONTACTS)\]$/i.test(text.trim());
}

function mediaKindLabel(message: Message): string {
  const t = (message.type ?? '').toLowerCase();
  const mt = (message.media_type ?? '').toLowerCase();
  if (t === 'sticker' || mt.includes('webp')) return 'Sticker';
  if (t === 'audio' || mt.startsWith('audio/')) return 'Voice message';
  if (t === 'video' || mt.startsWith('video/')) return 'Video';
  if (t === 'document') return 'Document';
  if (t === 'image' || mt.startsWith('image/')) return 'Photo';
  return 'Attachment';
}

type ContactItem = {
  display_name?: string;
  phone?: string | null;
  wa_id?: string | null;
  name?: { formatted_name?: string; first_name?: string; last_name?: string };
  phones?: unknown;
  emails?: unknown;
};

type ContactsPayloadShape = {
  type?: string;
  items?: ContactItem[];
};

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw) as unknown;
      return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return null;
}

function asPhoneRows(phones: unknown): Array<{ phone?: string; wa_id?: string }> {
  if (!phones) return [];
  const list = Array.isArray(phones) ? phones : typeof phones === 'object' ? Object.values(phones as object) : [];
  return list.filter((p): p is { phone?: string; wa_id?: string } => p !== null && typeof p === 'object');
}

function contactDisplayLine(c: ContactItem): string {
  const dn = typeof c.display_name === 'string' ? c.display_name.trim() : '';
  if (dn) return dn;
  const fn = c.name?.formatted_name?.trim();
  if (fn) return fn;
  const first = c.name?.first_name?.trim() ?? '';
  const last = c.name?.last_name?.trim() ?? '';
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return '';
}

function contactPhoneLine(c: ContactItem): string {
  const p0 = typeof c.phone === 'string' ? c.phone.trim() : '';
  if (p0) return p0;
  const w0 = typeof c.wa_id === 'string' ? c.wa_id.trim() : '';
  if (w0) return w0;
  const rows = asPhoneRows(c.phones);
  const a = rows[0]?.phone?.trim() || rows[0]?.wa_id?.trim() || '';
  return a;
}

function contactEmailLine(c: ContactItem): string | null {
  if (Array.isArray(c.emails) && c.emails.length > 0) {
    const first = c.emails[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object' && 'email' in first) {
      const e = (first as { email?: string }).email;
      if (typeof e === 'string' && e.trim()) return e.trim();
    }
  }
  return null;
}

const ChatBubble = ({ message }: { message: Message }) => {
  const direction = String((message as any).direction ?? '').toLowerCase();
  const isOutgoing =
    direction === 'outbound' ||
    direction === 'outgoing' ||
    (direction === '' && (message as any).status === 'sent');
  const outgoingCaption = isOutgoing ? outgoingSenderCaption(message) : null;

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const msgType = (message.type ?? '').toLowerCase();
  const hasMediaId = Boolean(message.media_id);

  const autoLoadMedia = useMemo(() => {
    if (!hasMediaId) return false;
    const mt = (message.media_type ?? '').toLowerCase();
    if (msgType === 'image' || msgType === 'sticker') return true;
    if (mt.startsWith('image/')) return true;
    return false;
  }, [hasMediaId, message.media_type, msgType]);

  /** Load audio/video in background so native controls work without an extra click. */
  const preloadAudioVideo = useMemo(() => {
    if (!hasMediaId || autoLoadMedia) return false;
    const mt = (message.media_type ?? '').toLowerCase();
    if (msgType === 'audio' || msgType === 'video') return true;
    return mt.startsWith('audio/') || mt.startsWith('video/');
  }, [hasMediaId, autoLoadMedia, message.media_type, msgType]);

  const captionText = useMemo(() => {
    const raw = (message.content ?? '').trim();
    if (!raw) return null;
    if (isBracketMediaPlaceholder(raw)) return null;
    return raw;
  }, [message.content]);

  const locationPayload = useMemo(() => {
    const p = message.interactive_payload as { type?: string; location?: Record<string, unknown> } | null | undefined;
    if (p?.type === 'location' && p.location && typeof p.location === 'object') {
      return p.location as Record<string, unknown>;
    }
    if (msgType === 'location' && p?.location) {
      return p.location as Record<string, unknown>;
    }
    return null;
  }, [message.interactive_payload, msgType]);

  const contactsPayload = useMemo((): ContactItem[] | null => {
    const root = parseJsonObject(message.interactive_payload);
    if (!root) return null;
    const p = root as ContactsPayloadShape;
    if (p.type !== 'contacts') return null;
    if (Array.isArray(p.items) && p.items.length > 0) {
      return p.items;
    }
    return null;
  }, [message.interactive_payload]);

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

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

  useEffect(() => {
    if (!autoLoadMedia) return;
    if (mediaUrl || mediaLoading) return;
    void handleLoadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadMedia]);

  useEffect(() => {
    if (!preloadAudioVideo) return;
    if (mediaUrl || mediaLoading) return;
    void handleLoadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadAudioVideo]);

  const openViewer = async () => {
    if (!message.media_id) return;
    if (!mediaUrl && !mediaLoading) {
      await handleLoadMedia();
    }
    setViewerOpen(true);
  };

  const interactive = (message.interactive_payload ?? null) as
    | null
    | {
        type?: string;
        body?: { text?: string };
        location?: Record<string, unknown>;
        button_reply?: { title?: string };
        list_reply?: { title?: string; description?: string };
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

  const mapsHref = useMemo(() => {
    if (!locationPayload) return null;
    const lat = locationPayload.latitude;
    const lng = locationPayload.longitude;
    if (lat == null || lng == null) return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(String(lat) + ',' + String(lng))}`;
  }, [locationPayload]);

  const showMediaChrome = hasMediaId && !locationPayload && !contactsPayload;
  const subtleMediaLabel =
    showMediaChrome && (captionText === null || captionText === '') ? mediaKindLabel(message) : null;

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

          {subtleMediaLabel ? (
            <div
              className={`flex items-center gap-1.5 text-[11px] mb-1.5 font-medium ${
                isOutgoing ? 'text-white/80' : 'text-muted-foreground'
              }`}
            >
              {msgType === 'image' ? <ImageIcon className="w-3.5 h-3.5 shrink-0 opacity-90" /> : null}
              {msgType === 'sticker' ? <Sticker className="w-3.5 h-3.5 shrink-0" /> : null}
              {msgType === 'audio' ? <Mic className="w-3.5 h-3.5 shrink-0" /> : null}
              {msgType === 'video' ? <Video className="w-3.5 h-3.5 shrink-0" /> : null}
              {msgType === 'document' ? <Paperclip className="w-3.5 h-3.5 shrink-0" /> : null}
              <span>{subtleMediaLabel}</span>
            </div>
          ) : null}

          {locationPayload ? (
            mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isOutgoing ? 'border-white/30 bg-white/10 text-white' : 'border-border bg-background text-primary'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="font-medium block">Location</span>
                  {(locationPayload.name as string) || (locationPayload.address as string) || 'Open in Maps'}
                </span>
              </a>
            ) : (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isOutgoing ? 'border-white/30 bg-white/10 text-white/95' : 'border-border bg-muted/40'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="min-w-0 text-[13px]">
                  <span className="font-medium block">Location</span>
                  {captionText || 'Shared location'}
                </span>
              </div>
            )
          ) : null}

          {contactsPayload ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm space-y-2 ${
                isOutgoing ? 'border-white/30 bg-white/10' : 'border-border bg-background'
              }`}
            >
              <div className={`text-xs font-semibold ${isOutgoing ? 'text-white/90' : 'text-foreground'}`}>
                Shared contacts
              </div>
              <ul className="space-y-1.5">
                {contactsPayload.slice(0, 5).map((c, i) => {
                  const name = contactDisplayLine(c) || 'Contact';
                  const phone = contactPhoneLine(c);
                  const email = contactEmailLine(c);
                  return (
                    <li
                      key={i}
                      className={`text-[13px] ${isOutgoing ? 'text-white/95' : 'text-foreground'}`}
                    >
                      <span className="font-medium">{name}</span>
                      {phone ? (
                        <span className={`block text-[11px] ${isOutgoing ? 'text-white/75' : 'text-muted-foreground'}`}>
                          {phone}
                        </span>
                      ) : null}
                      {email ? (
                        <span className={`block text-[11px] ${isOutgoing ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {email}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {captionText && !(contactsPayload && captionText.toLowerCase().startsWith('shared contact')) ? (
            <p dir="auto" className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {captionText}
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
                <div className="text-[11px] text-muted-foreground">{interactive.list_reply.description}</div>
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

          {showMediaChrome && (
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

              {mediaUrl && (mediaType?.startsWith('audio/') ?? false) ? (
                <audio src={mediaUrl} controls className="w-full max-w-sm h-9" preload="metadata" />
              ) : null}

              {mediaUrl && (mediaType?.startsWith('video/') ?? false) ? (
                <video src={mediaUrl} controls className="max-h-72 rounded-lg border border-black/10 max-w-full" preload="metadata" />
              ) : null}

              {!autoLoadMedia && (
                <button
                  type="button"
                  onClick={openViewer}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${isOutgoing ? 'text-white/90' : 'text-primary'}`}
                  disabled={mediaLoading}
                >
                  {msgType === 'audio' ? <Mic className="w-3.5 h-3.5" /> : null}
                  {msgType === 'video' ? <Video className="w-3.5 h-3.5" /> : null}
                  {msgType === 'document' ? <Paperclip className="w-3.5 h-3.5" /> : null}
                  {msgType === 'sticker' ? <Sticker className="w-3.5 h-3.5" /> : null}
                  {mediaLoading ? 'Loading…' : `${mediaKindLabel(message)} — open`}
                </button>
              )}

              {mediaUrl && !(mediaType?.startsWith('image/') ?? false) && !(mediaType?.startsWith('audio/') ?? false) && !(mediaType?.startsWith('video/') ?? false) ? (
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
