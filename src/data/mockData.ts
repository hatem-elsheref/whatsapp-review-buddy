import { Customer, Message, Template, WebhookLog } from '../types';

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Ahmed Hassan', phone: '+966501234567', avatar: 'AH', lastSeen: '2 min ago', tags: ['VIP', 'Active'] },
  { id: 'c2', name: 'Sara Al-Rashid', phone: '+966509876543', avatar: 'SA', lastSeen: '15 min ago', tags: ['New'] },
  { id: 'c3', name: 'Mohammed Khalid', phone: '+966551112233', avatar: 'MK', lastSeen: '1 hour ago', tags: ['Active'] },
  { id: 'c4', name: 'Fatima Noor', phone: '+966544556677', avatar: 'FN', lastSeen: '3 hours ago', tags: ['Support'] },
  { id: 'c5', name: 'Omar Ziad', phone: '+966533221100', avatar: 'OZ', lastSeen: '1 day ago', tags: ['Inactive'] },
];

const now = new Date();
const mins = (m: number) => new Date(now.getTime() - m * 60000);

export const mockMessages: Message[] = [
  // Ahmed Hassan
  { id: 'm1', customerId: 'c1', type: 'text', direction: 'incoming', content: 'Hi, I want to check my order status', timestamp: mins(30), status: 'read' },
  { id: 'm2', customerId: 'c1', type: 'template', direction: 'outgoing', content: 'Your order #ORD-4821 has been confirmed. Total: SAR 299.00', timestamp: mins(28), status: 'read', templateName: 'order_confirmed', templateHeader: 'Order Confirmation', templateFooter: 'Thank you for shopping with us!', templateButtons: [{ text: 'Track Order', type: 'URL', url: 'https://example.com/track' }] },
  { id: 'm3', customerId: 'c1', type: 'text', direction: 'incoming', content: 'Great, thanks! When will it arrive?', timestamp: mins(25), status: 'read' },
  { id: 'm4', customerId: 'c1', type: 'template', direction: 'outgoing', content: 'Your package TRK-98712 is on its way! ETA: Tomorrow by 5 PM', timestamp: mins(20), status: 'delivered', templateName: 'delivery_update', templateHeader: 'Delivery Update 📦', templateFooter: 'Contact support for any issues', templateButtons: [{ text: 'Track Package', type: 'URL', url: 'https://example.com/track' }] },
  { id: 'm5', customerId: 'c1', type: 'text', direction: 'incoming', content: 'Perfect, I\'ll be home', timestamp: mins(18), status: 'read' },

  // Sara Al-Rashid
  { id: 'm6', customerId: 'c2', type: 'text', direction: 'incoming', content: 'Hello! I saw your new collection', timestamp: mins(60) },
  { id: 'm7', customerId: 'c2', type: 'template', direction: 'outgoing', content: 'Welcome Sara! Check out our latest arrivals at StyleBrand', timestamp: mins(55), status: 'read', templateName: 'welcome_message', templateHeader: 'Welcome! 🎉', templateFooter: 'Unsubscribe: reply STOP', templateButtons: [{ text: 'Shop Now', type: 'URL', url: 'https://example.com/shop' }, { text: 'View Catalog', type: 'QUICK_REPLY' }] },
  { id: 'm8', customerId: 'c2', type: 'interactive_buttons', direction: 'outgoing', content: 'Which category are you interested in?', timestamp: mins(50), status: 'delivered', buttons: ['Women\'s Fashion', 'Accessories', 'Sale Items'] },
  { id: 'm9', customerId: 'c2', type: 'text', direction: 'incoming', content: 'I\'d love to see the sale items!', timestamp: mins(45) },

  // Mohammed Khalid
  { id: 'm10', customerId: 'c3', type: 'text', direction: 'incoming', content: 'I need help with my subscription', timestamp: mins(120) },
  { id: 'm11', customerId: 'c3', type: 'interactive_list', direction: 'outgoing', content: 'How can we help you today? Please select an option:', timestamp: mins(115), status: 'read', listHeader: 'Support Options', listButtonLabel: 'View Options', listSections: [{ title: 'Account', options: [{ id: 'o1', title: 'Change Plan', description: 'Upgrade or downgrade' }, { id: 'o2', title: 'Billing Issue', description: 'Payment problems' }] }, { title: 'Technical', options: [{ id: 'o3', title: 'Bug Report', description: 'Report an issue' }, { id: 'o4', title: 'Feature Request', description: 'Suggest improvements' }] }] },
  { id: 'm12', customerId: 'c3', type: 'text', direction: 'incoming', content: 'I want to change my plan', timestamp: mins(110) },
  { id: 'm13', customerId: 'c3', type: 'text', direction: 'outgoing', content: 'Sure! Let me pull up your account details.', timestamp: mins(108), status: 'delivered' },

  // Fatima Noor
  { id: 'm14', customerId: 'c4', type: 'text', direction: 'incoming', content: 'My payment of SAR 150 is overdue', timestamp: mins(200) },
  { id: 'm15', customerId: 'c4', type: 'template', direction: 'outgoing', content: 'Reminder: Your payment of SAR 150.00 is due by April 15, 2026', timestamp: mins(195), status: 'read', templateName: 'payment_reminder', templateHeader: 'Payment Reminder 💳', templateFooter: 'Ignore if already paid', templateButtons: [{ text: 'Pay Now', type: 'URL', url: 'https://example.com/pay' }] },
  { id: 'm16', customerId: 'c4', type: 'cta', direction: 'outgoing', content: 'Complete your payment securely online:', timestamp: mins(190), status: 'delivered', ctaLabel: 'Pay Now - SAR 150', ctaUrl: 'https://example.com/pay/inv-4421' },
  { id: 'm17', customerId: 'c4', type: 'text', direction: 'incoming', content: 'Done! Just paid it', timestamp: mins(180) },

  // Omar Ziad
  { id: 'm18', customerId: 'c5', type: 'text', direction: 'incoming', content: 'Is my support ticket still open?', timestamp: mins(1440) },
  { id: 'm19', customerId: 'c5', type: 'template', direction: 'outgoing', content: 'Your ticket TKT-3312 is being reviewed by our team', timestamp: mins(1430), status: 'read', templateName: 'support_followup', templateHeader: 'Support Update', templateFooter: 'Reply for more info', templateButtons: [{ text: 'View Ticket', type: 'QUICK_REPLY' }] },
  { id: 'm20', customerId: 'c5', type: 'text', direction: 'outgoing', content: 'We\'ll get back to you within 24 hours.', timestamp: mins(1425), status: 'sent' },
];

export const mockTemplates: Template[] = [
  { id: 't1', name: 'order_confirmed', category: 'UTILITY', language: 'en', status: 'APPROVED', header: 'Order Confirmation', body: 'Your order #{{1}} has been confirmed, {{2}}. Total: SAR {{3}}', footer: 'Thank you for shopping with us!', buttons: [{ text: 'Track Order', type: 'URL', url: 'https://example.com/track' }], parameters: ['order_id', 'customer_name', 'amount'] },
  { id: 't2', name: 'delivery_update', category: 'UTILITY', language: 'en', status: 'APPROVED', header: 'Delivery Update 📦', body: 'Your package {{1}} is on its way! ETA: {{2}}', footer: 'Contact support for any issues', buttons: [{ text: 'Track Package', type: 'URL', url: 'https://example.com/track' }], parameters: ['tracking_number', 'eta'] },
  { id: 't3', name: 'welcome_message', category: 'MARKETING', language: 'en', status: 'APPROVED', header: 'Welcome! 🎉', body: 'Welcome {{1}}! Check out our latest arrivals at {{2}}', footer: 'Unsubscribe: reply STOP', buttons: [{ text: 'Shop Now', type: 'URL', url: 'https://example.com' }, { text: 'View Catalog', type: 'QUICK_REPLY' }], parameters: ['name', 'brand'] },
  { id: 't4', name: 'payment_reminder', category: 'UTILITY', language: 'en', status: 'APPROVED', header: 'Payment Reminder 💳', body: 'Reminder: Your payment of SAR {{1}} is due by {{2}}', footer: 'Ignore if already paid', buttons: [{ text: 'Pay Now', type: 'URL', url: 'https://example.com/pay' }], parameters: ['amount', 'due_date'] },
  { id: 't5', name: 'support_followup', category: 'UTILITY', language: 'en', status: 'PENDING', header: 'Support Update', body: 'Your ticket {{1}} is being reviewed by our team', footer: 'Reply for more info', buttons: [{ text: 'View Ticket', type: 'QUICK_REPLY' }], parameters: ['ticket_id'] },
];

export const mockWebhookLogs: WebhookLog[] = [
  { id: 'w1', timestamp: mins(5), type: 'RECEIVED', eventName: 'messages', from: '+966501234567', to: '+14155238886', httpStatus: 200, payload: { object: 'whatsapp_business_account', entry: [{ id: 'WABA_ID', changes: [{ value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '14155238886', phone_number_id: 'PHONE_ID' }, messages: [{ from: '966501234567', id: 'wamid.abc123', timestamp: '1712000000', type: 'text', text: { body: 'Perfect, I\'ll be home' } }] }, field: 'messages' }] }] } },
  { id: 'w2', timestamp: mins(8), type: 'SENT', eventName: 'messages', from: '+14155238886', to: '+966501234567', httpStatus: 200, payload: { messaging_product: 'whatsapp', recipient_type: 'individual', to: '966501234567', type: 'template', template: { name: 'delivery_update', language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: 'TRK-98712' }, { type: 'text', text: 'Tomorrow by 5 PM' }] }] } } },
  { id: 'w3', timestamp: mins(10), type: 'STATUS', eventName: 'message_status', from: '+14155238886', to: '+966501234567', httpStatus: 200, payload: { object: 'whatsapp_business_account', entry: [{ id: 'WABA_ID', changes: [{ value: { messaging_product: 'whatsapp', statuses: [{ id: 'wamid.xyz789', status: 'delivered', timestamp: '1712000100', recipient_id: '966501234567' }] }, field: 'messages' }] }] } },
  { id: 'w4', timestamp: mins(15), type: 'RECEIVED', eventName: 'messages', from: '+966509876543', to: '+14155238886', httpStatus: 200, payload: { object: 'whatsapp_business_account', entry: [{ id: 'WABA_ID', changes: [{ value: { messaging_product: 'whatsapp', messages: [{ from: '966509876543', id: 'wamid.def456', type: 'text', text: { body: 'I\'d love to see the sale items!' } }] }, field: 'messages' }] }] } },
  { id: 'w5', timestamp: mins(20), type: 'SENT', eventName: 'messages', from: '+14155238886', to: '+966551112233', httpStatus: 200, payload: { messaging_product: 'whatsapp', to: '966551112233', type: 'interactive', interactive: { type: 'list', header: { type: 'text', text: 'Support Options' }, body: { text: 'How can we help you today?' }, action: { button: 'View Options', sections: [{ title: 'Account', rows: [{ id: 'o1', title: 'Change Plan' }] }] } } } },
  { id: 'w6', timestamp: mins(25), type: 'STATUS', eventName: 'message_status', from: '+14155238886', to: '+966509876543', httpStatus: 200, payload: { object: 'whatsapp_business_account', entry: [{ id: 'WABA_ID', changes: [{ value: { statuses: [{ id: 'wamid.ghi012', status: 'read', timestamp: '1712000200', recipient_id: '966509876543' }] }, field: 'messages' }] }] } },
  { id: 'w7', timestamp: mins(30), type: 'SENT', eventName: 'messages', from: '+14155238886', to: '+966544556677', httpStatus: 200, payload: { messaging_product: 'whatsapp', to: '966544556677', type: 'template', template: { name: 'payment_reminder', language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: 'SAR 150.00' }, { type: 'text', text: 'April 15, 2026' }] }] } } },
  { id: 'w8', timestamp: mins(35), type: 'ERROR', eventName: 'messages', from: '+14155238886', to: '+966500000000', httpStatus: 400, payload: { error: { message: '(#131030) Recipient phone number not in allowed list', type: 'OAuthException', code: 131030, error_subcode: 2494010, fbtrace_id: 'A1B2C3D4E5' } } },
];
