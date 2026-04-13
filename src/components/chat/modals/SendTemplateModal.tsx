import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api, Message, MessageTemplate } from '@/lib/api';
import { toast } from 'sonner';

interface SendTemplateModalProps {
  conversationId: number;
  onClose: () => void;
  onMessageSent?: (message: Message) => void;
}

type TemplateSendPayload = {
  template_name: string;
  template_components?: Array<{
    type: 'body';
    parameters: Array<{ type: 'text'; key: string; text: string }>;
  }>;
  template_language?: string;
};

const SendTemplateModal = ({ conversationId, onClose, onMessageSent }: SendTemplateModalProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get<{ data: MessageTemplate[] }>('/templates');
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const template = templates.find(t => t.id.toString() === selectedTemplateId);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setParams({});
  };

  const renderBody = () => {
    if (!template?.content) return '';
    let body = template.content;
    (template.parameters || []).forEach((p) => {
      const value = params[p.key] || `{{${p.key}}}`;
      body = body.replace(`{{${p.key}}}`, value);
    });
    return body;
  };

  const allParamsFilled = template 
    ? (!template.parameters || template.parameters.length === 0 || template.parameters.every(p => params[p.key]?.trim()))
    : true;

  const send = async () => {
    if (!conversationId || !template) return;
    setSending(true);
    try {
      const payload: TemplateSendPayload = { template_name: template.name };
      
      if (template.parameters && template.parameters.length > 0) {
        const parameters = template.parameters.map((param, index) => ({
          type: 'text' as const,
          key: (index + 1).toString(),
          text: params[param.key] || '',
        }));
        payload.template_components = [{ type: 'body', parameters }];
        payload.template_language = template.language || 'ar';
      }
      
      await api.post(`/conversations/${conversationId}/send`, payload);
      toast.success('Template sent successfully');
      
      if (onMessageSent) {
        onMessageSent({
          id: Date.now(),
          conversation_id: conversationId,
          contact_id: 0,
          direction: 'outbound',
          type: 'template',
          content: null,
          template_name: template.name,
          meta_message_id: null,
          media_url: null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to send template');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            {template && template.parameters && template.parameters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Parameters</p>
                {template.parameters.map((p) => (
                  <div key={p.key}>
                    <label className="text-xs text-muted-foreground capitalize">{p.label || `Parameter ${p.key}`}</label>
                    <input 
                      value={params[p.key] || ''} 
                      onChange={e => setParams({ ...params, [p.key]: e.target.value })} 
                      className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" 
                      placeholder={`Enter {{${p.key}}}`} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={send} disabled={!template || !allParamsFilled || sending} className="mt-4 w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            Send
          </button>
        </div>
        <div className="w-60 border-l border-border bg-muted p-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          {template ? (
            <div className="bg-card rounded-lg p-3 text-sm space-y-1.5 border border-border">
              {template.header_content && <p className="font-semibold">{template.header_content}</p>}
              <p>{renderBody()}</p>
              {template.footer_content && <p className="text-xs text-muted-foreground">{template.footer_content}</p>}
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