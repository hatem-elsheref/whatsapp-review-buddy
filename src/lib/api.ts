import { QueryClient } from '@tanstack/react-query';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const API_HOST = import.meta.env.VITE_API_URL || '';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function resolveUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_BASE_URL}${endpoint}`;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = async (overrideToken?: string | null) => {
    const h: Record<string, string> = { ...headers };
    const t = overrideToken ?? token;
    if (t) h['Authorization'] = `Bearer ${t}`;
    return fetch(resolveUrl(endpoint), {
      headers: h,
      ...options,
    });
  };

  let response = await doFetch();

  // If token expired, try refresh once then retry.
  if (response.status === 401 && token) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.token as string | undefined;
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          if (refreshData.user) localStorage.setItem('user', JSON.stringify(refreshData.user));
          if (refreshData.expires_at) localStorage.setItem('auth_expires_at', String(refreshData.expires_at));
          response = await doFetch(newToken);
        }
      }
    } catch {
      // ignore
    }
  }

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires_at');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    const errorMessage = errorData.message || errorData.error || 'API Error';
    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchBlob(endpoint: string, options?: RequestInit): Promise<Blob> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Accept': '*/*',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(resolveUrl(endpoint), {
    headers,
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error('API Error');
  }

  return await response.blob();
}

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApi<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  getBlob: (endpoint: string) => fetchBlob(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
};

export interface MetaSettings {
  id: number;
  phone_number_id: string;
  waba_id: string;
  app_id: string;
  app_secret: string | null;
  access_token: string | null;
  webhook_url: string | null;
  verify_token: string | null;
  webhook_verified: boolean;
  webhook_subscriptions: string[] | null;
}

export interface AiSettings {
  id: number;
  provider: 'openai' | 'anthropic' | 'groq' | 'gemini' | 'custom';
  model: string;
  api_key: string | null;
  base_url: string | null;
  default_language: string;
  default_tone: string;
  system_prompt: string | null;
}

export interface MessageTemplate {
  id: number;
  meta_template_id: string;
  name: string;
  language: string;
  category: string;
  content: string | null;
  header_content: string | null;
  footer_content: string | null;
  status: string;
  quality_score: string | null;
  parameters?: { key: number; label: string; type: string }[];
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export type ContactCreatedVia =
  | 'manual'
  | 'whatsapp_inbound'
  | 'integration'
  | 'flow'
  | string
  | null;

export interface Contact {
  id: number;
  phone_number: string;
  name: string | null;
  profile_name: string | null;
  wa_id: string | null;
  opt_in: boolean;
  created_via?: ContactCreatedVia;
  created_at: string;
}

export interface Conversation {
  id: number;
  wa_conversation_id?: string | null;
  last_message_at: string | null;
  last_message_at_local?: string | null;
  window_expires_at: string | null;
  window_expires_at_local?: string | null;
  window_open?: boolean;
  window_remaining_seconds?: number | null;
  status: 'open' | 'closed';
  contact?: Contact;
  unread_inbound_count?: number;
  last_read_at?: string | null;
  last_read_at_local?: string | null;
}

export function contactDisplayName(contact: Contact | null | undefined): string {
  if (!contact) return 'Unknown Contact';
  const name = contact.name?.trim();
  if (name) return name;
  const profile = contact.profile_name?.trim();
  if (profile) return profile;
  if (contact.phone_number) return contact.phone_number;
  return 'Unknown Contact';
}

export function contactCreatedViaLabel(v: ContactCreatedVia): string {
  switch (v) {
    case 'manual':
      return 'Manual';
    case 'whatsapp_inbound':
      return 'WhatsApp';
    case 'integration':
      return 'Integration';
    case 'flow':
      return 'Flow';
    case null:
    case undefined:
    case '':
      return '—';
    default:
      return String(v);
  }
}

export function contactAvatarLabel(contact: Contact | null | undefined): string {
  if (!contact) return '?';
  const name = contact.name?.trim();
  const profile = contact.profile_name?.trim();
  if (name) return name.charAt(0).toUpperCase();
  if (profile) return profile.charAt(0).toUpperCase();
  const phone = contact.phone_number;
  if (phone && phone.length >= 2) return phone.slice(-2);
  return '?';
}

export type MessageSenderKind = 'contact' | 'agent' | 'system' | 'integration' | string;

export interface Message {
  id: number;
  conversation_id: number;
  contact_id: number;
  meta_message_id: string | null;
  direction: 'inbound' | 'outbound';
  sender_kind?: MessageSenderKind;
  sent_by_user_id?: number | null;
  sent_by_user?: { id: number; name: string; email: string } | null;
  type: string;
  content: string | null;
  template_name: string | null;
  template_components?: unknown[] | Record<string, unknown> | null;
  interactive_payload?: unknown[] | Record<string, unknown> | null;
  media_id?: string | null;
  media_type?: string | null;
  media_download_url?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  status: string | null;
  sent_at: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}