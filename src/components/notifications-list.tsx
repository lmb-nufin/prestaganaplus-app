import { Bell, Wallet, FileText, Smartphone, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/notifications-data";

const iconMap: Record<NotificationType, React.ElementType> = {
  pago: Wallet,
  vale: FileText,
  telefono: Smartphone,
  aviso: Bell,
};

type Props = {
  messages: AppNotification[];
  isUnread: boolean;
  emptyText: string;
  onRemove: (id: string) => void;
  onNotificationClick: (message: AppNotification) => void;
};

export const NotificationsList = ({ messages, isUnread, emptyText, onRemove, onNotificationClick }: Props) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
        <Inbox className="h-8 w-8 text-muted-foreground/60" />
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {messages.map((message) => {
        const Icon = iconMap[message.type] ?? Bell;
        return (
          <Card key={message.id} className="flex items-center gap-1 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => onNotificationClick(message)}
              className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
            >
              <span className="relative mt-0.5 flex-shrink-0 text-muted-foreground">
                <Icon className="h-5 w-5" />
                {isUnread && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", isUnread ? "text-foreground" : "text-muted-foreground")}>
                  {message.title}
                </span>
                <span className="block text-xs text-muted-foreground">{message.message}</span>
                <span className="mt-1 block text-xs text-muted-foreground/70">{message.time}</span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 h-10 w-10 flex-shrink-0"
              onClick={() => onRemove(message.id)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Eliminar</span>
            </Button>
          </Card>
        );
      })}
    </div>
  );
};
