export type NotificationType = 'pago' | 'vale' | 'telefono' | 'aviso';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  initiallyRead?: boolean;
  action?: { label: string; href: string };
}

// Avisos de ejemplo mientras no exista el endpoint de notificaciones. Son genéricos a
// propósito: no dependen de los datos de la asociada.
export const exampleNotifications: AppNotification[] = [
  {
    id: 'pago-quincenal',
    type: 'pago',
    title: 'Recuerda tu pago quincenal',
    message: 'Consulta tu monto a pagar y tus opciones de pago en el inicio.',
    time: 'Hoy',
    action: { label: 'Ver mi monto', href: '/' },
  },
  {
    id: 'vales-whatsapp',
    type: 'vale',
    title: 'Comparte tus vales por WhatsApp',
    message: 'Después de firmar un vale, envíalo a tu cliente por WhatsApp o muéstrale el QR.',
    time: 'Esta semana',
    action: { label: 'Ir a Vales', href: '/vales' },
  },
  {
    id: 'telefono-prestagana',
    type: 'telefono',
    title: 'Conoce el Teléfono PrestaGana',
    message: 'Un equipo de trabajo a tu nombre que no usa tu línea. Revísalo en Vale Nuevo → Préstamo Personal.',
    time: 'Esta semana',
    action: { label: 'Ver la oferta', href: '/vales/nuevo?paso=personal' },
  },
  {
    id: 'bienvenida',
    type: 'aviso',
    title: 'Bienvenida a PrestaGana+',
    message: 'Desde aquí creas y firmas vales, consultas tu línea y pagas.',
    time: 'Hace un mes',
    initiallyRead: true,
  },
];
