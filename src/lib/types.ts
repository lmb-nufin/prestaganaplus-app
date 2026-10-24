
export type Vale = {
  folio: string;
  associateNumber: string;
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthDate: string;
  loanAmount: number;
  installments: number; // No. de Quincenas
  phone: string;
  status: 'PENDIENTE' | 'FIRMADO' | 'CANJEADO';
  tipoVale?: 'CLIENTE' | 'PERSONAL';
  createdAt: string;
  signedAt?: string;
  //deviceId?: string;
  //deviceModel?: string;
  //latitude?: string;
  //longitude?: string;
  //mapLink?: string;
};

export type ExistingClient = {
  curp: string;
  firstName: string;
  lastNameP: string;
  lastNameM: string;
  birthDate: string;
  phone: string;
  id_cliente: string;
};

// Respuesta de GET prestamoPersonal/{associateNumber}
export type PersonalLoanInfo = {
  cliente: ExistingClient;
  prestamoActivo: boolean;
  folioActivo: string | null;
};

export type PersonalLoanBlockReason = 'ATRASADA' | 'ANTIGUEDAD' | 'ACTIVO' | 'NO_DISPONIBLE';

export type PersonalLoanEligibility =
  | { eligible: true; cliente: ExistingClient }
  | { eligible: false; reason: PersonalLoanBlockReason; message: string; folioActivo?: string | null };

// Lo que llega al cliente en Vale Nuevo: solo el estado y el nombre para el diálogo de confirmación.
export type PersonalLoanOption =
  | { eligible: true; holderName: string }
  | { eligible: false; reason: PersonalLoanBlockReason; folioActivo: string | null };

// ==================================================================
// --- Teléfono financiado ---
// ==================================================================

export type PhonePlan = { quincenas: number; pagoQuincenal: number; totalPagar: number };

// Respuesta de GET telefono/oferta/{associateNumber}. Precio, enganche y planes siempre vienen de la API.
export type PhoneOffer = {
  elegible: boolean;
  motivo?: string;
  modelo: { nombre: string; almacenamiento: string; imagenUrl: string };
  precio: number;
  engancheMonto: number;
  planes: PhonePlan[];
};

export type PhoneRequestStatus =
  | 'SOLICITADO'
  | 'ENGANCHE_CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_PARA_RECOGER'
  | 'ACTIVO'
  | 'CANCELADO';

export type DeviceStatus = 'ACTIVO' | 'BLOQUEADO' | 'REPORTADO' | 'REVOCADO';

export type PhoneMoraLevel = 'AVISO' | 'GRACIA' | 'BLOQUEO';

// Respuesta de GET telefono/estado/{associateNumber}
export type PhoneState = {
  solicitud?: { folio: string; estatus: PhoneRequestStatus; fecha: string };
  dispositivo?: { estatus: DeviceStatus; modelo: string; ultimos4Imei: string };
  emisionRestringida: boolean;
  cuotas?: { actual: number; total: number; pagoQuincenal: number; saldo: number };
  mora?: { dias: number; monto: number; nivel: PhoneMoraLevel };
};

// dashboardData.telefono
export type PhoneCollection = { pagoQuincenal: number; cuotaActual: number; totalCuotas: number; saldo: number };

export type DeviceOperation = 'CREAR_VALE' | 'FIRMAR_VALE' | 'PRESTAMO_PERSONAL' | 'CANCELAR_VALE';

export type DeviceChallenge = { challengeId: string; challenge: string; expiraEn: string };

export type DeviceReportReason = 'ROBO' | 'PERDIDA' | 'DANO' | 'OTRO';

/**
 * Cómo se emiten vales para la asociada:
 * - LIBRE: sin restricción.
 * - EQUIPO: solo desde la miniapp, con firma del dispositivo.
 * - BLOQUEADA: equipo reportado o revocado, o estado no disponible.
 */
export type IssuanceMode =
  | { mode: 'LIBRE' }
  | { mode: 'EQUIPO' }
  | { mode: 'BLOQUEADA'; message: string };

export type PhoneOfferBlockReason = 'NO_ELEGIBLE' | 'SOLICITUD_ABIERTA' | 'EQUIPO' | 'NO_DISPONIBLE';

// Lo que llega al cliente para la tarjeta y la pantalla de oferta.
export type PhoneOfferOption =
  | { available: true; offer: Omit<PhoneOffer, 'elegible' | 'motivo'> }
  | {
      available: false;
      reason: PhoneOfferBlockReason;
      message: string;
      folio?: string | null;
      offer?: Omit<PhoneOffer, 'elegible' | 'motivo'>;
    };

export type NipResetOtp = {
  otp: string;
  //expiresAt: string; // ISO date string
};


// Extend the default NextAuth Session and User types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      associateNumber: string;
      nip?: string; // Add nip to session user
    } & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

   interface User {
      associateNumber?: string;
      nip?: string;
   }
}

declare module 'next-auth/jwt' {
  interface JWT {
    associateNumber?: string;
    nip?: string; // Add nip to JWT token
  }
}
