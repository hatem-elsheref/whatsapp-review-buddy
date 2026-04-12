import { useState } from 'react';
import { Send, List, MousePointerClick, Link, FileText, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import { toast } from 'sonner';
import SendInteractiveListModal from './modals/SendInteractiveListModal';
import SendButtonsModal from './modals/SendButtonsModal';
import SendCTAModal from './modals/SendCTAModal';
import SendTemplateModal from './modals/SendTemplateModal';

const MessageComposer = () => {
  const { selectedCustomerId, addMessage } = useApp();
  const [text, setText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [modal, setModal] = useState<'list' | 'buttons' | 'cta' | 'template' | null>(null);

  const sendText = () => {
    if (!text.trim() || !selectedCustomerId) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      customerId: selectedCustomerId,
      type: 'text',
      direction: 'outgoing',
      content: text.trim(),
      timestamp: new Date(),
      status: 'sent',
    };
    addMessage(msg);
    setText('');
    toast.success('Message sent');
    // Simulate delivery status
    setTimeout(() => {
      msg.status = 'delivered';
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  return (
    <>
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showActions ? 'rotate-180' : ''}`} />
            </button>
            {showActions && (
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-lg py-1 w-48 z-10">
                <button onClick={() => { setModal('list'); setShowActions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <List className="w-4 h-4" /> Send Interactive List
                </button>
                <button onClick={() => { setModal('buttons'); setShowActions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4" /> Send Buttons
                </button>
                <button onClick={() => { setModal('cta'); setShowActions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <Link className="w-4 h-4" /> Send CTA
                </button>
                <button onClick={() => { setModal('template'); setShowActions(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Send Template
                </button>
              </div>
            )}
          </div>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={sendText}
            disabled={!text.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {modal === 'list' && <SendInteractiveListModal onClose={() => setModal(null)} />}
      {modal === 'buttons' && <SendButtonsModal onClose={() => setModal(null)} />}
      {modal === 'cta' && <SendCTAModal onClose={() => setModal(null)} />}
      {modal === 'template' && <SendTemplateModal onClose={() => setModal(null)} />}
    </>
  );
};

export default MessageComposer;
