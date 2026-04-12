import { useApp } from '../../context/AppContext';

const CustomerList = () => {
  const { customers, messages, selectedCustomerId, setSelectedCustomerId } = useApp();

  const getLastMessage = (customerId: string) => {
    const msgs = messages.filter(m => m.customerId === customerId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const getPreview = (msg: any) => {
    if (!msg) return 'No messages yet';
    if (msg.type === 'text') return msg.content;
    if (msg.type === 'template') return `📋 ${msg.templateName}`;
    if (msg.type === 'interactive_list') return '📋 Interactive List';
    if (msg.type === 'interactive_buttons') return '🔘 Buttons';
    if (msg.type === 'cta') return '🔗 CTA';
    return msg.content;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Chat Inbox</h2>
        <p className="text-xs text-muted-foreground mt-1">{customers.length} conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {customers.map(c => {
          const last = getLastMessage(c.id);
          const isActive = selectedCustomerId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCustomerId(c.id)}
              className={`w-full text-left p-3 border-b border-border transition-colors ${
                isActive ? 'bg-accent' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    {last && <span className="text-xs text-muted-foreground">{formatTime(last.timestamp)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{getPreview(last)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerList;
