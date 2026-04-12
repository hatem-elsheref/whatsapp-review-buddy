import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Message } from '../../../types';
import { toast } from 'sonner';

const SendTemplateModal = ({ onClose }: { onClose: () => void }) => {
  const { selectedCustomerId, templates, addMessage } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});

  const template = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setParams({});
  };

  const renderBody = () => {
    if (!template) return '';
    let body = template.body;
    template.parameters.forEach((p, i) => {
      body = body.replace(`{{${i + 1}}}`, params[p] || `{{${p}}}`);
    });
    return body;
  };

  const allParamsFilled = template ? template.parameters.every(p => params[p]?.trim()) : true;

  const send = () => {
    if (!selectedCustomerId || !template) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      customerId: selectedCustomerId,
      type: 'template',
      direction: 'outgoing',
      content: renderBody(),
      timestamp: new Date(),
      status: 'sent',
      templateName: template.name,
      templateHeader: template.header,
      templateFooter: template.footer,
      templateButtons: template.buttons,
    };
    addMessage(msg);
    toast.success('Template message sent');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-[650px] max-h-[80vh] flex" onClick={e => e.stopPropagation()}>
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Send Template</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Select Template</label>
              <select value={selectedTemplateId} onChange={e => handleTemplateChange(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1">
                <option value="">Choose a template...</option>
                {templates.filter(t => t.status === 'APPROVED').map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
            {template && template.parameters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Parameters</p>
                {template.parameters.map(p => (
                  <div key={p}>
                    <label className="text-xs text-muted-foreground capitalize">{p.replace('_', ' ')}</label>
                    <input value={params[p] || ''} onChange={e => setParams({ ...params, [p]: e.target.value })} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" placeholder={`Enter ${p}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={send} disabled={!template || !allParamsFilled} className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">Send</button>
        </div>
        <div className="w-60 border-l border-border bg-wa-chat-bg p-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          {template ? (
            <div className="bg-wa-outgoing rounded-lg p-3 text-sm space-y-1.5">
              {template.header && <p className="font-semibold">{template.header}</p>}
              <p>{renderBody()}</p>
              {template.footer && <p className="text-xs text-muted-foreground">{template.footer}</p>}
              {template.buttons?.map((btn, i) => (
                <button key={i} className="w-full text-center text-xs text-primary border border-primary/30 rounded py-1 mt-1">{btn.text}</button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select a template to preview</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendTemplateModal;
