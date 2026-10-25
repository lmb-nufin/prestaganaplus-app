'use client';

import { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { exampleNotifications, type AppNotification } from '@/lib/notifications-data';

// Todavía no hay endpoint de notificaciones: se muestran avisos de ejemplo y lo leído o
// borrado se recuerda en este navegador para que no regrese en cada visita.
const STORAGE_KEY = 'pg-notificaciones';

type StoredState = { read: string[]; removed: string[] };

interface NotificationsContextType {
  notifications: (AppNotification & { read: boolean })[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  remove: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function loadState(): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { read: parsed.read ?? [], removed: parsed.removed ?? [] };
    }
  } catch {}
  return { read: [], removed: [] };
}

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoredState>({ read: [], removed: [] });

  useEffect(() => {
    setState(loadState());
  }, []);

  const update = useCallback((fn: (prev: StoredState) => StoredState) => {
    setState(prev => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const markAsRead = useCallback(
    (id: string) => update(prev => (prev.read.includes(id) ? prev : { ...prev, read: [...prev.read, id] })),
    [update]
  );
  const remove = useCallback(
    (id: string) => update(prev => (prev.removed.includes(id) ? prev : { ...prev, removed: [...prev.removed, id] })),
    [update]
  );

  const notifications = exampleNotifications
    .filter(n => !state.removed.includes(n.id))
    .map(n => ({ ...n, read: n.initiallyRead || state.read.includes(n.id) }));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, remove }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
