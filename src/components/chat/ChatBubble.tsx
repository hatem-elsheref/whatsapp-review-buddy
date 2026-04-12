import { Message } from '@/lib/api';
import { Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';

const ChatBubble = ({ message }: { message: Message }) => {
  const isOutgoing = message.direction === 'outbound';
  const [listExpanded, setListExpanded] = useState(false);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const StatusIcon = () => {
    if (!isOutgoing) return null;
    if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline-block ml-1" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground inline-block ml-1" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground inline-block ml-1" />;
  };

  const bubbleClass = isOutgoing ? 'bg-green-100 ml-auto' : 'bg-white mr-auto';

  return (
    <div className={`max-w-[75%] ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
      <div className={`rounded-lg p-3 shadow-sm ${bubbleClass}`}>
        {message.type === 'template' && (
          <div className="space-y-1.5">
            {message.template_name && <p className="font-semibold text-sm">📋 Template: {message.template_name}</p>}
            <p className="text-sm">{message.content || ''}</p>
          </div>
        )}

        {message.type !== 'template' && (
          <p className="text-sm">{message.content}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-muted-foreground">{formatTime(message.sent_at || message.created_at)}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;