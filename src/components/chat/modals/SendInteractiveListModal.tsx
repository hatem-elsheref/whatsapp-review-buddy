import { useState } from 'react';
import { X } from 'lucide-react';
import { api, Message } from '@/lib/api';
import { InteractiveListSection } from '../../../types';
import { toast } from 'sonner';

interface SendInteractiveListModalProps {
  conversationId: number;
  onClose: () => void;
  onMessageSent?: (message: Message) => void;
}

const SendInteractiveListModal = ({ conversationId, onClose, onMessageSent }: SendInteractiveListModalProps) => {
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [buttonLabel, setButtonLabel] = useState('View Options');
  const [sections, setSections] = useState<InteractiveListSection[]>([
    { title: 'Section 1', options: [{ id: 'opt-1', title: '', description: '' }] },
  ]);
  const [sending, setSending] = useState(false);

  const addSection = () => {
    setSections([...sections, { title: `Section ${sections.length + 1}`, options: [{ id: `opt-${Date.now()}`, title: '' }] }]);
  };

  const addOption = (sIdx: number) => {
    const s = [...sections];
    if (s[sIdx].options.length >= 5) return;
    s[sIdx].options.push({ id: `opt-${Date.now()}`, title: '' });
    setSections(s);
  };

  const updateSection = (sIdx: number, title: string) => {
    const s = [...sections];
    s[sIdx].title = title;
    setSections(s);
  };

  const updateOption = (sIdx: number, oIdx: number, field: 'title' | 'description', val: string) => {
    const s = [...sections];
    s[sIdx].options[oIdx] = { ...s[sIdx].options[oIdx], [field]: val };
    setSections(s);
  };

  const hasValidSection = sections.some(s => s.options.some(o => o.title.trim()));

  const send = async () => {
    if (!conversationId || !body.trim() || !hasValidSection) return;

    const mappedSections = sections
      .filter(s => s.options.some(o => o.title.trim()))
      .map(s => ({
        title: s.title,
        rows: s.options
          .filter(o => o.title.trim())
          .map(o => ({ id: o.id, title: o.title, description: o.description || undefined })),
      }));

    setSending(true);
    try {
      await api.post(`/conversations/${conversationId}/send`, {
        type: 'interactive_list',
        body: body.trim(),
        button_label: buttonLabel.trim() || 'View options',
        sections: mappedSections,
      });

      toast.success('Interactive list sent');

      if (onMessageSent) {
        onMessageSent({
          id: Date.now(),
          conversation_id: conversationId,
          contact_id: 0,
          direction: 'outbound',
          type: 'text',
          content: body.trim(),
          template_name: null,
          media_url: null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          interactive_payload: {
            type: 'list',
            header: header || undefined,
            button: buttonLabel.trim() || 'View options',
            sections: mappedSections,
          },
        });
      }

      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send interactive list');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-[700px] max-h-[80vh] overflow-hidden flex" onClick={e => e.stopPropagation()}>
        {/* Form */}
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Send Interactive List</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Header text</label>
              <input value={header} onChange={e => setHeader(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Body text *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1 h-20 resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Button label</label>
              <input value={buttonLabel} onChange={e => setButtonLabel(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
            </div>
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="border border-border rounded-lg p-3 space-y-2">
                <input value={section.title} onChange={e => updateSection(sIdx, e.target.value)} placeholder="Section title" className="bg-muted rounded px-2 py-1 text-sm w-full outline-none" />
                {section.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex gap-2">
                    <input value={opt.title} onChange={e => updateOption(sIdx, oIdx, 'title', e.target.value)} placeholder="Option title" className="flex-1 bg-muted rounded px-2 py-1 text-sm outline-none" />
                    <input value={opt.description || ''} onChange={e => updateOption(sIdx, oIdx, 'description', e.target.value)} placeholder="Description" className="flex-1 bg-muted rounded px-2 py-1 text-sm outline-none" />
                  </div>
                ))}
                {section.options.length < 5 && (
                  <button onClick={() => addOption(sIdx)} className="text-xs text-primary hover:underline">+ Add option</button>
                )}
              </div>
            ))}
            <button onClick={addSection} className="text-xs text-primary hover:underline">+ Add section</button>
          </div>
          <button onClick={send} disabled={!body.trim() || !hasValidSection || sending} className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
            Send
          </button>
        </div>
        {/* Preview */}
        <div className="w-64 border-l border-border bg-wa-chat-bg p-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="bg-wa-outgoing rounded-lg p-3 text-sm space-y-1.5">
            {header && <p className="font-semibold">{header}</p>}
            <p>{body || 'Message body...'}</p>
            <button className="w-full text-center text-xs text-primary border border-primary/30 rounded py-1 mt-1">{buttonLabel || 'View Options'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendInteractiveListModal;
