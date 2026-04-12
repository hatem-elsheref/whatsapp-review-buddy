import { useState, useRef, useEffect } from 'react';
import { api, Conversation, Message } from '@/lib/api';
import ChatBubble from './ChatBubble';
import MessageComposer from './MessageComposer';
import { Loader2 } from 'lucide-react';

interface ChatAreaProps {
  conversation: Conversation;
}

const ChatArea = ({ conversation }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowOpen, setWindowOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    setWindowOpen(!!conversation.window_expires_at && new Date(conversation.window_expires_at) > new Date());
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      const data = await api.get<{ data: Message[] }>(`/conversations/${conversation.id}/messages`);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleNewMessage = (msg: Message) => {
    setMessages(prev => [msg, ...prev]);
  };

  const contact = conversation.contact;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {contact?.name?.charAt(0).toUpperCase() || contact?.phone_number?.slice(-2) || '?'}
        </div>
        <div>
          <p className="font-medium text-sm">{contact?.name || 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{contact?.phone_number}</p>
        </div>
        {windowOpen && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            24h window open
          </span>
        )}
        {!windowOpen && (
          <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
            Template only
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageComposer 
        conversationId={conversation.id} 
        canSendFreeText={windowOpen}
        onMessageSent={handleNewMessage}
      />
    </div>
  );
};

export default ChatArea;