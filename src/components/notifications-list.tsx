
import { Bell, Fuel, Gift, Wrench, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconMap = {
  vale: <Fuel className="h-5 w-5" />,
  reminder: <Bell className="h-5 w-5" />,
  reward: <Gift className="h-5 w-5" />,
  maintenance: <Wrench className="h-5 w-5" />,
};

export const NotificationsList = ({ messages, isUnread, onRemove, onNotificationClick }) => {
  return (
    <div className="space-y-1.5 p-2">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className="block transition-transform active:scale-[0.98] cursor-pointer group"
          onClick={() => onNotificationClick(message, isUnread)}
        >
          <Card className="bg-card shadow-sm hover:bg-muted/50">
            <CardContent className="p-2">
                <div className="flex items-start gap-3">
                    {/* Columna 1: Indicador de Estado */}
                    <div className="flex-shrink-0 pt-1">
                        {isUnread ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                        ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                    </div>

                    {/* Columna 2: Contenido Principal */}
                    <div className="flex-grow">
                        <div className="flex items-center gap-3">
                            <div className="text-muted-foreground">{iconMap[message.type] || <Bell className="h-5 w-5" />}</div>
                            <div className="flex-1">
                                <p className={cn("font-medium text-sm", isUnread ? "text-foreground" : "text-muted-foreground")}>
                                {message.title}
                                </p>
                                <p className={cn("text-xs", isUnread ? "text-muted-foreground" : "text-muted-foreground/80")}>
                                {message.message}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-left text-muted-foreground/70 group-hover:text-muted-foreground mt-1">
                            {message.time}
                        </p>
                    </div>

                    {/* Columna 3: Botón de Eliminar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -my-1 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                        onClick={(e) => {
                        e.stopPropagation();
                        onRemove(message.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
