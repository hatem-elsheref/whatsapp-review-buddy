import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

export interface NewMessageEvent {
  id: number;
  conversation_id: number;
  contact_id: number;
  content: string | null;
  type: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  window_open?: boolean;
  window_expires_at?: string | null;
  window_remaining_seconds?: number | null;
}

type MessageHandler = (message: NewMessageEvent) => void;
export interface MessageStatusUpdatedEvent {
  id: number;
  conversation_id: number;
  status: string | null;
  meta_message_id: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
}
type StatusHandler = (evt: MessageStatusUpdatedEvent) => void;

let pusherInstance: Pusher | null = null;
let channelInstance: ReturnType<Pusher['subscribe']> | null = null;
let bound = false;
const handlersRef = new Set<MessageHandler>();
const statusHandlersRef = new Set<StatusHandler>();

export const getPusher = (): Pusher => {
  if (!pusherInstance && PUSHER_KEY) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }
  return pusherInstance;
};

export const subscribeToChat = (onMessage: MessageHandler, onStatus?: StatusHandler): () => void => {
  handlersRef.add(onMessage);
  if (onStatus) statusHandlersRef.add(onStatus);

  if (PUSHER_KEY) {
    const pusher = getPusher();
    if (!channelInstance) {
      channelInstance = pusher.subscribe('chat');
    }
    if (!bound && channelInstance) {
      bound = true;
      channelInstance.bind('App\\Events\\NewMessageReceived', (data: NewMessageEvent) => {
        handlersRef.forEach((handler) => handler(data));
      });
      channelInstance.bind('App\\Events\\MessageStatusUpdated', (data: MessageStatusUpdatedEvent) => {
        statusHandlersRef.forEach((handler) => handler(data));
      });
    }
  }

  return () => {
    handlersRef.delete(onMessage);
    if (onStatus) statusHandlersRef.delete(onStatus);
    if (handlersRef.size === 0 && statusHandlersRef.size === 0 && channelInstance && pusherInstance) {
      channelInstance.unbind('App\\Events\\NewMessageReceived');
      channelInstance.unbind('App\\Events\\MessageStatusUpdated');
      pusherInstance.unsubscribe('chat');
      channelInstance = null;
      bound = false;
    }
  };
};

export const usePusherRealtime = (onMessage?: MessageHandler) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (onMessage) {
      unsubscribeRef.current = subscribeToChat(onMessage);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [onMessage]);
};

export const playNotificationSound = (): void => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close().catch(() => {});
    }, 120);
  } catch {
    // ignore
  }
};