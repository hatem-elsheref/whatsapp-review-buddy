import { Message } from '../../types';
import { Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';

const ChatBubble = ({ message }: { message: Message }) => {
  const isOutgoing = message.direction === 'outgoing';
  const [listExpanded, setListExpanded] = useState(false);

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const StatusIcon = () => {
    if (!isOutgoing) return null;
    if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-primary inline-block ml-1" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground inline-block ml-1" />;
    return <Check className="w-3.5 h-3.5 text-muted-foreground inline-block ml-1" />;
  };

  if (message.type === 'webhook_event') {
    return (
      <div className="flex justify-center">
        <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
          📡 {message.eventType || 'Webhook Event'}: {message.content}
        </span>
      </div>
    );
  }

  const bubbleClass = isOutgoing ? 'bg-wa-outgoing ml-auto' : 'bg-wa-incoming mr-auto';

  return (
    <div className={`max-w-[75%] ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
      <div className={`rounded-lg p-3 ${bubbleClass}`}>
        {/* Template */}
        {message.type === 'template' && (
          <div className="space-y-1.5">
            {message.templateHeader && <p className="font-semibold text-sm">{message.templateHeader}</p>}
            <p className="text-sm">{message.content}</p>
            {message.templateFooter && <p className="text-xs text-muted-foreground">{message.templateFooter}</p>}
            {message.templateButtons?.map((btn, i) => (
              <button key={i} className="w-full text-center text-sm text-primary border border-primary/30 rounded py-1.5 mt-1 hover:bg-primary/10 transition-colors">
                {btn.type === 'URL' ? '🔗 ' : ''}{btn.text}
              </button>
            ))}
          </div>
        )}

        {/* Interactive List */}
        {message.type === 'interactive_list' && (
          <div className="space-y-1.5">
            {message.listHeader && <p className="font-semibold text-sm">{message.listHeader}</p>}
            <p className="text-sm">{message.content}</p>
            <button
              onClick={() => setListExpanded(!listExpanded)}
              className="w-full text-center text-sm text-primary border border-primary/30 rounded py-1.5 mt-1 hover:bg-primary/10 transition-colors"
            >
              {message.listButtonLabel || 'View Options'} {listExpanded ? '▲' : '▼'}
            </button>
            {listExpanded && message.listSections?.map((section, i) => (
              <div key={i} className="mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">{section.title}</p>
                {section.options.map(opt => (
                  <div key={opt.id} className="py-1.5 px-2 rounded bg-background/20 mt-1 text-sm">
                    <p className="font-medium">{opt.title}</p>
                    {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Interactive Buttons */}
        {message.type === 'interactive_buttons' && (
          <div className="space-y-1.5">
            <p className="text-sm">{message.content}</p>
            {message.buttons?.map((btn, i) => (
              <button key={i} className="w-full text-center text-sm text-primary border border-primary/30 rounded py-1.5 mt-1 hover:bg-primary/10 transition-colors">
                {btn}
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        {message.type === 'cta' && (
          <div className="space-y-1.5">
            <p className="text-sm">{message.content}</p>
            <button className="w-full text-center text-sm text-primary border border-primary/30 rounded py-1.5 mt-1 hover:bg-primary/10 transition-colors">
              🔗 {message.ctaLabel}
            </button>
          </div>
        )}

        {/* Plain text */}
        {message.type === 'text' && (
          <p className="text-sm">{message.content}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
