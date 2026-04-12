import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const TemplatesSection = () => {
  const { templates, setTemplates, customers, addMessage, selectedTemplateId, setSelectedTemplateId, preSelectedCustomerId, setPreSelectedCustomerId } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [selTemplate, setSelTemplate] = useState<string>(selectedTemplateId || '');
  const [selCustomer, setSelCustomer] = useState<string>(preSelectedCustomerId || '');
  const [params, setParams] = useState<Record<string, string>>({});
  const [customerSearch, setCustomerSearch] = useState('');

  const template = templates.find(t => t.id === selTemplate);

  const syncTemplates = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); toast.success('Templates synced'); }, 1500);
  };

  const handleSelectTemplate = (id: string) => {
    setSelTemplate(id);
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
    if (!selCustomer || !template) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      customerId: selCustomer,
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
    toast.success('Template sent successfully');
    setSelectedTemplateId(null);
    setPreSelectedCustomerId(null);
  };

  const categoryColor = (cat: string) => {
    if (cat === 'MARKETING') return 'bg-badge-blue/20 text-badge-blue';
    if (cat === 'AUTHENTICATION') return 'bg-badge-yellow/20 text-badge-yellow';
    return 'bg-muted text-muted-foreground';
  };

  const statusColor = (s: string) => {
    if (s === 'APPROVED') return 'bg-badge-green/20 text-badge-green';
    if (s === 'PENDING') return 'bg-badge-yellow/20 text-badge-yellow';
    return 'bg-badge-red/20 text-badge-red';
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  return (
    <div className="flex h-full">
      {/* Left - Template list */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Templates</h2>
          <button onClick={syncTemplates} disabled={syncing} className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {templates.map(t => (
            <div key={t.id} className={`p-3 border-b border-border cursor-pointer transition-colors ${selTemplate === t.id ? 'bg-accent' : 'hover:bg-muted/50'}`} onClick={() => handleSelectTemplate(t.id)}>
              <p className="font-medium text-sm">{t.name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor(t.category)}`}>{t.category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(t.status)}`}>{t.status}</span>
                <span className="text-[10px] text-muted-foreground">{t.language}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); handleSelectTemplate(t.id); }} className="mt-2 text-xs text-primary hover:underline">Use →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Send form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="font-semibold mb-4">Send Template</h2>
        <div className="max-w-lg space-y-4">
          {/* Step 1: Customer */}
          <div>
            <label className="text-xs text-muted-foreground font-medium">Step 1: Select Customer</label>
            <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Search customers..." className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1 mb-1" />
            <select value={selCustomer} onChange={e => setSelCustomer(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Choose customer...</option>
              {filteredCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
          </div>

          {/* Step 2: Template */}
          <div>
            <label className="text-xs text-muted-foreground font-medium">Step 2: Select Template</label>
            <select value={selTemplate} onChange={e => handleSelectTemplate(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1">
              <option value="">Choose template...</option>
              {templates.filter(t => t.status === 'APPROVED').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Params */}
          {template && template.parameters.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground font-medium">Step 3: Fill Parameters</label>
              <div className="space-y-2 mt-1">
                {template.parameters.map(p => (
                  <div key={p}>
                    <label className="text-xs text-muted-foreground capitalize">{`{{${template.parameters.indexOf(p) + 1}}} — ${p.replace('_', ' ')}`}</label>
                    <input value={params[p] || ''} onChange={e => setParams({ ...params, [p]: e.target.value })} className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {template && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-2">Preview</p>
              <div className="bg-wa-outgoing rounded-lg p-4 text-sm space-y-1.5 max-w-xs">
                {template.header && <p className="font-semibold">{template.header}</p>}
                <p>{renderBody()}</p>
                {template.footer && <p className="text-xs text-muted-foreground">{template.footer}</p>}
                {template.buttons?.map((btn, i) => (
                  <button key={i} className="w-full text-center text-xs text-primary border border-primary/30 rounded py-1 mt-1">{btn.text}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={send} disabled={!selCustomer || !template || !allParamsFilled} className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
            Send Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesSection;
