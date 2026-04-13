import { useState } from 'react';
import { Send, FileText, Loader2, List, SquareMousePointer } from 'lucide-react';
import { toast } from 'sonner';
import { api, Message } from '@/lib/api';
import SendTemplateModal from './modals/SendTemplateModal';
import SendInteractiveListModal from './modals/SendInteractiveListModal';
import SendButtonsModal from './modals/SendButtonsModal';

interface MessageComposerProps {
  conversationId: number;
  canSendFreeText: boolean;
  onMessageSent: (message: Message) => void;
}

const MessageComposer = ({ conversationId, canSendFreeText, onMessageSent }: MessageComposerProps) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showButtonsModal, setShowButtonsModal] = useState(false);

  const sendText = async () => {
    if (!text.trim() || !conversationId) return;
    if (!canSendFreeText) {
      toast.error('24h window closed. Please send a template.');
      return;
    }

    setSending(true);
    try {
      await api.post(`/conversations/${conversationId}/send`, { message: text.trim() });
      
      const msg: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        contact_id: 0,
        direction: 'outbound',
        type: 'text',
        content: text.trim(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      onMessageSent(msg);
      setText('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
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
          <button
            onClick={() => setShowTemplateModal(true)}
            className={`rounded-lg transition-colors flex items-center gap-2 ${
              canSendFreeText
                ? 'p-2 hover:bg-muted text-muted-foreground'
                : 'px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
            title="Send Template"
          >
            <FileText className="w-5 h-5" />
            {!canSendFreeText && <span className="text-sm font-medium">Send template</span>}
          </button>

          {canSendFreeText && (
            <>
              <button
                onClick={() => setShowListModal(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Send interactive list"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowButtonsModal(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Send interactive buttons"
              >
                <SquareMousePointer className="w-5 h-5" />
              </button>
            </>
          )}

          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canSendFreeText ? "Type a message..." : "Window closed — send a template to message this user"}
            disabled={!canSendFreeText}
            className={`flex-1 bg-muted rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary ${
              !canSendFreeText ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          />

          <button
            onClick={sendText}
            disabled={!text.trim() || sending || !canSendFreeText}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            title={canSendFreeText ? 'Send message' : 'Window closed'}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {!canSendFreeText && (
          <p className="text-xs text-yellow-600 mt-2">
            24h window expired. You can only send templates until the customer replies.
          </p>
        )}
      </div>

      {showTemplateModal && (
        <SendTemplateModal 
          conversationId={conversationId} 
          onClose={() => setShowTemplateModal(false)}
          onMessageSent={onMessageSent}
        />
      )}

      {showListModal && (
        <SendInteractiveListModal
          conversationId={conversationId}
          onClose={() => setShowListModal(false)}
          onMessageSent={onMessageSent}
        />
      )}

      {showButtonsModal && (
        <SendButtonsModal
          conversationId={conversationId}
          onClose={() => setShowButtonsModal(false)}
          onMessageSent={onMessageSent}
        />
      )}
    </>
  );
};

export default MessageComposer;