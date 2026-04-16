import { useState } from 'react';
import { X } from 'lucide-react';
import { api, Message } from '@/lib/api';
import { toast } from 'sonner';

interface SendButtonsModalProps {
  conversationId: number;
  onClose: () => void;
  onMessageSent?: (message: Message) => void;
}

const SendButtonsModal = ({ conversationId, onClose, onMessageSent }: SendButtonsModalProps) => {
  const [body, setBody] = useState('');
  const [buttons, setButtons] = useState(['', '', '']);
  const [sending, setSending] = useState(false);

  const validButtons = buttons.filter(b => b.trim());
  const canSend = body.trim() && validButtons.length > 0;

  const send = async () => {
    if (!conversationId || !canSend) return;

    const payloadButtons = validButtons.slice(0, 3).map((title, idx) => ({
      id: `btn-${Date.now()}-${idx}`,
      title: title.trim(),
    }));

    setSending(true);
    try {
      const res = await api.post<{ id?: number; status?: string; meta_message_id?: string | null }>(`/conversations/${conversationId}/send`, {
        type: 'interactive_buttons',
        body: body.trim(),
        buttons: payloadButtons,
      });

      toast.success(res?.status === 'queued' ? 'Buttons message queued' : 'Buttons message sent');

      if (onMessageSent) {
        onMessageSent({
          id: res?.id ?? Date.now(),
          conversation_id: conversationId,
          contact_id: 0,
          direction: 'outbound',
          type: 'interactive',
          content: body.trim(),
          template_name: null,
          media_url: null,
          status: res?.status ?? 'sent',
          meta_message_id: res?.meta_message_id ?? null,
          sent_at: res?.status === 'queued' ? null : new Date().toISOString(),
          created_at: new Date().toISOString(),
          interactive_payload: {
            type: 'button',
            buttons: payloadButtons,
          },
        });
      }

      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send buttons message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-[600px] flex" onClick={e => e.stopPropagation()}>
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Send Buttons</h3>
            <button type="button" onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Body text *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1 h-20 resize-none" />
            </div>
            {buttons.map((btn, i) => (
              <div key={i}>
                <label className="text-xs text-muted-foreground">Button {i + 1} {i === 0 ? '*' : '(optional)'}</label>
                <input value={btn} onChange={e => { const b = [...buttons]; b[i] = e.target.value; setButtons(b); }} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
              </div>
            ))}
          </div>
          <button type="button" onClick={send} disabled={!canSend || sending} className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">Send</button>
        </div>
        <div className="w-56 border-l border-border bg-wa-chat-bg p-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="bg-wa-outgoing rounded-lg p-3 text-sm space-y-1.5">
            <p>{body || 'Message body...'}</p>
            {validButtons.map((b, i) => (
              <button key={i} className="w-full text-center text-xs text-primary border border-primary/30 rounded py-1 mt-1">{b}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendButtonsModal;
