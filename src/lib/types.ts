
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
