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
}

type MessageHandler = (message: NewMessageEvent) => void;

let pusherInstance: Pusher | null = null;
const handlersRef = new Set<MessageHandler>();

export const getPusher = (): Pusher => {
  if (!pusherInstance && PUSHER_KEY) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }
  return pusherInstance;
};

export const subscribeToChat = (onMessage: MessageHandler): () => void => {
  handlersRef.add(onMessage);

  if (PUSHER_KEY) {
    const pusher = getPusher();
    const channel = pusher.subscribe('chat');
    channel.bind('App\\Events\\NewMessageReceived', (data: NewMessageEvent) => {
      handlersRef.forEach((handler) => handler(data));
    });
  }

  return () => {
    handlersRef.delete(onMessage);
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
  const audio = new Audio('/notification.mp3');
  audio.play().catch(() => {});
};