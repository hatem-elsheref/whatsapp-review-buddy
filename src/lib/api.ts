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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    const errorMessage = errorData.message || errorData.error || 'API Error';
    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApi<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
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

export interface Contact {
  id: number;
  phone_number: string;
  name: string | null;
  profile_name: string | null;
  wa_id: string | null;
  opt_in: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  contact_id: number;
  wa_conversation_id: string | null;
  last_message_at: string | null;
  window_expires_at: string | null;
  status: 'open' | 'closed';
  contact?: Contact;
}

export interface Message {
  id: number;
  conversation_id: number;
  contact_id: number;
  meta_message_id: string | null;
  direction: 'inbound' | 'outbound';
  type: string;
  content: string | null;
  template_name: string | null;
  interactive_payload?: unknown[] | Record<string, unknown> | null;
  media_id?: string | null;
  media_url: string | null;
  media_type?: string | null;
  status: string | null;
  sent_at: string | null;
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