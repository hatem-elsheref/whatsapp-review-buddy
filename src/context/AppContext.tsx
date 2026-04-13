import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Customer, Message, Template, WebhookLog, Section } from '../types';
import { mockCustomers, mockMessages, mockTemplates, mockWebhookLogs } from '../data/mockData';
import { subscribeToChat, playNotificationSound, NewMessageEvent } from '../lib/pusher';

interface AppState {
  activeSection: Section;
  setActiveSection: (s: Section) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  customers: Customer[];
  messages: Message[];
  addMessage: (msg: Message) => void;
  templates: Template[];
  setTemplates: (t: Template[]) => void;
  webhookLogs: WebhookLog[];
  setWebhookLogs: (logs: WebhookLog[]) => void;
  addWebhookLog: (log: WebhookLog) => void;
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  preSelectedCustomerId: string | null;
  setPreSelectedCustomerId: (id: string | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<Section>('chat');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(mockWebhookLogs);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<string | null>(null);

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const addWebhookLog = useCallback((log: WebhookLog) => {
    setWebhookLogs(prev => [log, ...prev]);
  }, []);

  useEffect(() => {
    const handleNewMessage = (msg: NewMessageEvent) => {
      const message: Message = {
        id: msg.id.toString(),
        customerId: msg.contact_id.toString(),
        content: msg.content || '',
        type: msg.type,
        direction: msg.direction,
        timestamp: new Date(msg.created_at),
        status: 'received',
      };
      setMessages(prev => [message, ...prev]);
      playNotificationSound();
    };

    return subscribeToChat(handleNewMessage);
  }, []);

  return (
    <AppContext.Provider value={{
      activeSection, setActiveSection,
      selectedCustomerId, setSelectedCustomerId,
      customers: mockCustomers,
      messages, addMessage,
      templates, setTemplates,
      webhookLogs, setWebhookLogs,
      addWebhookLog,
      selectedTemplateId, setSelectedTemplateId,
      preSelectedCustomerId, setPreSelectedCustomerId,
    }}>
      {children}
    </AppContext.Provider>
  );
};
