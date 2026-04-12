import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Message } from '../../../types';
import { toast } from 'sonner';

const SendCTAModal = ({ onClose }: { onClose: () => void }) => {
  const { selectedCustomerId, addMessage } = useApp();
  const [body, setBody] = useState('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const canSend = body.trim() && label.trim() && url.trim();
  const urlError = url.trim() && !url.startsWith('http') ? 'URL must start with http:// or https://' : '';

  const send = () => {
    if (!selectedCustomerId || !canSend || urlError) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      customerId: selectedCustomerId,
      type: 'cta',
      direction: 'outgoing',
      content: body,
      timestamp: new Date(),
      status: 'sent',
      ctaLabel: label,
      ctaUrl: url,
    };
    addMessage(msg);
    toast.success('CTA message sent');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-[600px] flex" onClick={e => e.stopPropagation()}>
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Send CTA</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Body text *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1 h-20 resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Button label *</label>
              <input value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL *</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
              {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
            </div>
          </div>
          <button onClick={send} disabled={!canSend || !!urlError} className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">Send</button>
        </div>
        <div className="w-56 border-l border-border bg-wa-chat-bg p-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="bg-wa-outgoing rounded-lg p-3 text-sm space-y-1.5">
            <p>{body || 'Message body...'}</p>
            <button className="w-full text-center text-xs text-primary border border-primary/30 rounded py-1 mt-1">🔗 {label || 'Button'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCTAModal;
