import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Message } from '../../types';
import ChatBubble from './ChatBubble';
import MessageComposer from './MessageComposer';

const ChatArea = () => {
  const { selectedCustomerId, customers, messages } = useApp();
  const customer = customers.find(c => c.id === selectedCustomerId);
  const chatMessages = messages.filter(m => m.customerId === selectedCustomerId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  if (!customer) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {customer.avatar}
        </div>
        <div>
          <p className="font-medium text-sm">{customer.name}</p>
          <p className="text-xs text-muted-foreground">{customer.phone}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-wa-chat-bg">
        {chatMessages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer />
    </div>
  );
};

export default ChatArea;
