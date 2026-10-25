'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import type { AppNotification } from '@/lib/notifications-data';

export default function NotificationsPage() {
  const { notifications, markAsRead, remove } = useNotifications();
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  // Abrir un aviso lo marca como leído; cambiar de pestaña ya no marca todo.
  const handleNotificationClick = (notification: AppNotification) => {
    setSelected(notification);
    markAsRead(notification.id);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-4">
          <h1 className="text-base font-bold font-headline">Notificaciones</h1>
          <p className="font-headline text-sm text-muted-foreground">Avisos importantes sobre tu línea, tus vales y tus pagos.</p>
        </div>

        <Tabs defaultValue="unread">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              No leídas
              {unread.length > 0 &&
                <Badge className="ml-2 h-4 min-w-[1rem] justify-center rounded-full px-1.5 text-[10px] font-bold leading-none bg-primary text-primary-foreground">
                  {unread.length}
                </Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="read">Leídas</TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            <NotificationsList
              messages={unread}
              isUnread={true}
              emptyText="No tienes notificaciones nuevas."
              onRemove={remove}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>

          <TabsContent value="read">
            <NotificationsList
              messages={read}
              isUnread={false}
              emptyText="Aquí verás las notificaciones que ya abriste."
              onRemove={remove}
              onNotificationClick={handleNotificationClick}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>{selected?.title}</DialogTitle>
              <DialogDescription className="pt-2">
                {selected?.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-2 flex-row items-center gap-2 sm:space-x-0">
                <span className="mr-auto text-xs text-muted-foreground">{selected?.time}</span>
                {selected?.action ? (
                  <Button asChild>
                    <Link href={selected.action.href} onClick={() => setSelected(null)}>{selected.action.label}</Link>
                  </Button>
                ) : (
                  <Button onClick={() => setSelected(null)}>Cerrar</Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
