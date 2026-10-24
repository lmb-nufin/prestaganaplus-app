'use client';

import { useState, useEffect } from 'react';
import { NotificationsList } from '@/components/notifications-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from '@/context/notifications-context';
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";

const initialNotifications = {
  unread: [
    { id: 1, type: 'vale', title: 'Nuevo Vale Disponible', message: 'Tienes un nuevo vale de gasolina de $500.', time: 'Hace 5 minutos' },
    { id: 2, type: 'reminder', title: 'Recordatorio de Mantenimiento', message: 'Tu vehículo necesita revisión de frenos.', time: 'Hace 1 hora' },
  ],
  read: [
    { id: 3, type: 'reward', title: '¡Felicitaciones!', message: 'Has ganado una estrella por tu excelente desempeño.', time: 'Ayer' },
    { id: 4, type: 'maintenance', title: 'Mantenimiento Completado', message: 'El cambio de aceite de tu unidad ha sido realizado.', time: 'Hace 2 días' },
  ]
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setUnreadCount } = useNotifications();

  // Sincronizar el conteo global con el estado local al cargar
  useEffect(() => {
    setUnreadCount(notifications.unread.length);
  }, [notifications.unread, setUnreadCount]);

  const handleRemove = (id) => {
    const newNotifications = JSON.parse(JSON.stringify(notifications));
    newNotifications.unread = newNotifications.unread.filter(n => n.id !== id);
    newNotifications.read = newNotifications.read.filter(n => n.id !== id);
    setNotifications(newNotifications);
  };

  const handleNotificationClick = (notification, isUnread) => {
    setSelectedNotification({ ...notification, isUnread });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    if (selectedNotification && selectedNotification.isUnread) {
      const itemToMove = notifications.unread.find(n => n.id === selectedNotification.id);
      if (itemToMove) {
        setNotifications(prev => ({
          unread: prev.unread.filter(n => n.id !== selectedNotification.id),
          read: [itemToMove, ...prev.read]
        }));
      }
    }
    setIsModalOpen(false);
    setSelectedNotification(null);
  };
  
  const handleTabChange = (value) => {
    if (value === 'read' && notifications.unread.length > 0) {
      const newReadMessages = [...notifications.read, ...notifications.unread];
      setNotifications({
        unread: [],
        read: newReadMessages,
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-base font-bold font-headline">Notificaciones</h1>
          <p className="font-headline text-sm text-muted-foreground">Gestiona tus alertas y mensajes importantes para mantenerte siempre al día.</p>
        </div>

        <Tabs defaultValue="unread" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              No Leídas
              {notifications.unread.length > 0 && 
                <Badge className="ml-2 h-4 min-w-[1rem] justify-center rounded-full px-1.5 text-[10px] font-bold leading-none bg-primary text-primary-foreground">
                  {notifications.unread.length}
                </Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="read">Leídas</TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            <NotificationsList 
              messages={notifications.unread} 
              isUnread={true} 
              onRemove={handleRemove}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>

          <TabsContent value="read">
            <NotificationsList 
              messages={notifications.read} 
              isUnread={false} 
              onRemove={handleRemove}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification?.title}</DialogTitle>
              <DialogDescription className="pt-2">
                {selectedNotification?.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
                <span className="text-sm text-muted-foreground mr-auto">{selectedNotification?.time}</span>
                <Button onClick={handleModalClose}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
