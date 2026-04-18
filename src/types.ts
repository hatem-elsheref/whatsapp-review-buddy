export interface Customer {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastSeen: string;
  tags: string[];
}

export type MessageType = 'text' | 'template' | 'interactive_list' | 'interactive_buttons' | 'cta' | 'webhook_event';
export type MessageDirection = 'incoming' | 'outgoing';
export type DeliveryStatus = 'sent' | 'delivered' | 'read';

export interface TemplateButton {
  text: string;
  type?: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  url?: string;
}

export interface InteractiveListSection {
  title: string;
  options: { id: string; title: string; description?: string }[];
}

export interface Message {
  id: string;
  customerId: string;
  type: MessageType;
  direction: MessageDirection;
  content: string;
  timestamp: Date;
  status?: DeliveryStatus;
  // Template fields
  templateName?: string;
  templateHeader?: string;
  templateFooter?: string;
  templateButtons?: TemplateButton[];
  // Interactive list
  listHeader?: string;
  listButtonLabel?: string;
  listSections?: InteractiveListSection[];
  // Interactive buttons
  buttons?: string[];
  // CTA
  ctaLabel?: string;
  ctaUrl?: string;
  // Webhook event
  eventType?: string;
}

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  header?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  parameters: string[];
}

export type WebhookLogType = 'RECEIVED' | 'SENT' | 'STATUS' | 'ERROR';

export interface WebhookLog {
  id: string;
  timestamp: Date;
  type: WebhookLogType;
  eventName: string;
  from: string;
  to: string;
  httpStatus: number;
  payload: object;
}

export type Section = 'dashboard' | 'chat' | 'templates' | 'customers' | 'webhooks' | 'settings' | 'users' | 'flow' | 'audit';
