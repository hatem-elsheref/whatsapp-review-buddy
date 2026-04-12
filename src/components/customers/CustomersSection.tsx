import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, MessageSquare, FileText } from 'lucide-react';

const CustomersSection = () => {
  const { customers, messages, setActiveSection, setSelectedCustomerId, setPreSelectedCustomerId } = useApp();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const getLastMessage = (id: string) => {
    const msgs = messages.filter(m => m.customerId === id);
    return msgs.length ? msgs[msgs.length - 1].content.slice(0, 40) : '—';
  };

  const viewChat = (id: string) => {
    setSelectedCustomerId(id);
    setActiveSection('chat');
  };

  const sendTemplate = (id: string) => {
    setPreSelectedCustomerId(id);
    setActiveSection('templates');
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Customers</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none w-72" />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Last Message</th>
              <th className="text-left p-3">Last Seen</th>
              <th className="text-left p-3">Tags</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No customers found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{c.avatar}</div>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{c.phone}</td>
                <td className="p-3 text-sm text-muted-foreground truncate max-w-[200px]">{getLastMessage(c.id)}</td>
                <td className="p-3 text-sm text-muted-foreground">{c.lastSeen}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {c.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => viewChat(c.id)} className="text-xs text-primary hover:underline flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Chat</button>
                    <button onClick={() => sendTemplate(c.id)} className="text-xs text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3" /> Template</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersSection;
