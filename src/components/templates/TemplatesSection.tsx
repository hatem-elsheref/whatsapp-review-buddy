import { useState, useEffect } from 'react';
import Select from 'react-select';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, MessageTemplate, Contact } from '@/lib/api';

const TemplatesSection = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selTemplate, setSelTemplate] = useState<string>('');
  const [selContact, setSelContact] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, contactsRes] = await Promise.all([
        api.get<{ data: MessageTemplate[] }>('/templates'),
        api.get<{ data: Contact[] }>('/contacts'),
      ]);
      setTemplates(templatesRes.data || []);
      setContacts(contactsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      await api.post('/templates/sync');
      await fetchData();
      toast.success('Templates synced successfully');
    } catch (error) {
      toast.error('Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  const template = templates.find(t => t.id.toString() === selTemplate);

  const contactOptions = contacts.map(c => ({
    value: c.id.toString(),
    label: c.name ? `${c.name} (${c.phone_number})` : c.phone_number,
  }));

  const templateOptions = templates
    .filter(t => t.status === 'APPROVED')
    .map(t => ({
      value: t.id.toString(),
      label: t.name,
    }));

  const sendTemplate = async () => {
    if (!selContact || !template) return;
    
    setSending(true);
    try {
      await api.post(`/conversations`, {
        contact_id: parseInt(selContact),
      });

      const conversationsRes = await api.get<{ data: { id: number; contact: { id: number } }[] }>('/conversations');
      const conversation = conversationsRes.data?.find(c => c.contact?.id === parseInt(selContact));
      
      if (conversation) {
        const payload: any = { template_name: template.name };
        
        if (template.parameters && template.parameters.length > 0) {
          const components = template.parameters.map(param => ({
            type: 'body' as const,
            parameters: [
              {
                type: 'text' as const,
                key: param.key.toString(),
                value: templateParams[param.key] || '',
              },
            ],
          }));
          payload.template_components = components;
        }
        
        await api.post(`/conversations/${conversation.id}/send`, payload);
        toast.success('Template sent successfully');
        setSelContact('');
        setSelTemplate('');
        setTemplateParams({});
      } else {
        toast.error('No conversation found for this contact');
      }
    } catch (error) {
      toast.error('Failed to send template');
    } finally {
      setSending(false);
    }
  };

  const categoryColor = (cat: string) => {
    if (cat === 'MARKETING') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (cat === 'AUTHENTICATION') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const statusColor = (s: string) => {
    if (s === 'APPROVED') return { bg: 'bg-green-100', text: 'text-green-700' };
    if (s === 'PENDING') return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-red-100', text: 'text-red-700' };
  };

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--muted))',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '2px',
    }),
    input: (base: any) => ({
      ...base,
      color: 'hsl(var(--foreground))',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '0.5rem',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'hsl(var(--primary))' 
        : state.isFocused 
          ? 'hsl(var(--accent))' 
          : 'transparent',
      color: state.isSelected 
        ? 'hsl(var(--primary-foreground))' 
        : 'hsl(var(--foreground))',
      cursor: 'pointer',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'hsl(var(--foreground))',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
    }),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Templates</h2>
          <button 
            onClick={syncTemplates} 
            disabled={syncing} 
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No templates found. Click Sync to fetch from Meta.
            </div>
          ) : (
            templates.map(t => (
              <div 
                key={t.id} 
                className={`p-3 border-b border-border cursor-pointer transition-colors ${selTemplate === t.id.toString() ? 'bg-accent' : 'hover:bg-muted/50'}`}
                onClick={() => setSelTemplate(t.id.toString())}
              >
                <p className="font-medium text-sm">{t.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor(t.category).bg} ${categoryColor(t.category).text}`}>{t.category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(t.status).bg} ${statusColor(t.status).text}`}>{t.status}</span>
                  <span className="text-[10px] text-muted-foreground">{t.language}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="font-semibold mb-4">Send Template</h2>
        
        {templates.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No templates available.</p>
            <p className="text-sm mt-2">Click "Sync" to fetch templates from Meta.</p>
          </div>
        ) : (
          <div className="max-w-lg space-y-6">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-2">Select Contact</label>
              <Select
                options={contactOptions}
                value={contactOptions.find(o => o.value === selContact)}
                onChange={(option) => setSelContact(option?.value || '')}
                placeholder="Search and select a contact..."
                isSearchable
                styles={selectStyles}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-2">Select Template</label>
              <Select
                options={templateOptions}
                value={templateOptions.find(o => o.value === selTemplate)}
                onChange={(option) => { setSelTemplate(option?.value || ''); setTemplateParams({}); }}
                placeholder="Choose a template..."
                isSearchable
                styles={selectStyles}
                className="text-sm"
              />
            </div>

            {template && template.parameters && template.parameters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Template Parameters</p>
                {template.parameters.map((param) => (
                  <div key={param.key}>
                    <label className="text-xs text-muted-foreground capitalize">{param.label || `Parameter ${param.key}`}</label>
                    <input
                      type="text"
                      value={templateParams[param.key] || ''}
                      onChange={(e) => setTemplateParams({ ...templateParams, [param.key]: e.target.value })}
                      className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1"
                      placeholder={`Enter value for {{${param.key}}}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {template && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2">Preview</p>
                <div className="bg-muted rounded-lg p-4 text-sm space-y-1.5 max-w-md border border-border">
                  {template.header_content && <p className="font-semibold">{template.header_content}</p>}
                  <p>{template.content}</p>
                  {template.footer_content && <p className="text-xs text-muted-foreground">{template.footer_content}</p>}
                </div>
              </div>
            )}

            <button 
              onClick={sendTemplate} 
              disabled={!selContact || !template || sending}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesSection;