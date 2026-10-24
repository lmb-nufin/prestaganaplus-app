'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// 1. Definir la forma del contexto
interface NotificationsContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

// 2. Crear el Contexto con un valor por defecto
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// 3. Crear el Proveedor (Provider)
export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0); // Inicia en 0

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

// 4. Crear un Hook personalizado para usar el contexto fácilmente
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
