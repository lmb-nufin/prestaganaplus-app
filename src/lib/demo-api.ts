import 'server-only';

import type { Vale, ExistingClient } from './types';

// ==================================================================
// --- API simulada en memoria para DEMO_MODE=true ---
// ==================================================================

// Todas las asociadas de prueba usan el NIP 1234. El OTP siempre es 123456.
//   1000001  Al Día, alta 2023: elegible para préstamo personal
//   1000002  Atrasada
//   1000003  Alta hace menos de 3 meses
//   1000004  GET prestamoPersonal responde 503 (servicio caído)
//   1000005  GET prestamoPersonal responde sin prestamoActivo (respuesta mal formada)
const MOCK_OTP = '123456';

type MockAssociate = {
  user: {
    id: string;
    associateNumber: string;
    ID_PRESTAMO: string;
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    nip: string;
  };
  cliente: ExistingClient;
  paymentStatus: { status: string; amountDue: number };
  activationDate: string;
  personalLoanServiceDown?: boolean;
  personalLoanMalformed?: boolean;
};

const monthsAgo = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
};

const makeAssociate = (
  associateNumber: string,
  firstName: string,
  lastNameP: string,
  lastNameM: string,
  phone: string,
  overrides: Partial<Omit<MockAssociate, 'user' | 'cliente'>> = {}
): MockAssociate => ({
  user: {
    id: associateNumber,
    associateNumber,
    ID_PRESTAMO: associateNumber,
    name: `${firstName} ${lastNameP} ${lastNameM}`,
    email: `asociada.${associateNumber}@example.com`,
    phone,
    birthDate: '1990-01-15',
    nip: '1234',
  },
  cliente: {
    curp: `MOCK${associateNumber}MDFRRN0`,
    firstName,
    lastNameP,
    lastNameM,
    birthDate: '1990-01-15',
    phone,
    id_cliente: `9${associateNumber}`,
  },
  paymentStatus: { status: 'Al Día', amountDue: 0 },
  activationDate: '2023-06-03T00:00:00.000Z',
  ...overrides,
});

const mockAssociates: MockAssociate[] = [
  makeAssociate('1000001', 'ROSA', 'MARTINEZ', 'LOPEZ', '+525500000001'),
  makeAssociate('1000002', 'ANA', 'RUIZ', 'SOTO', '+525500000002', {
    paymentStatus: { status: 'Atrasada', amountDue: 1850 },
  }),
  makeAssociate('1000003', 'LUCIA', 'TORRES', 'VEGA', '+525500000003', {
    activationDate: monthsAgo(1),
  }),
  makeAssociate('1000004', 'CARMEN', 'DIAZ', 'MORA', '+525500000004', {
    personalLoanServiceDown: true,
  }),
  makeAssociate('1000005', 'SOFIA', 'NAVA', 'GIL', '+525500000005', {
    personalLoanMalformed: true,
  }),
];

const findAssociate = (associateNumber?: string) =>
  mockAssociates.find((a) => a.user.associateNumber === associateNumber);

const dashboardFor = (a: MockAssociate) => ({
  associateInfo: {
    name: a.user.name,
    associateNumber: a.user.associateNumber,
    branch: 'SUCURSAL DEMO',
    activationDate: a.activationDate,
    monthlyPlacementAvg: 4834.0,
  },
  associateLevel: { name: 'Nivel Senior', badgeLabel: 'ASOCIADA' },
  // La línea es fija en la simulación: los préstamos personales no la afectan.
  creditLine: { limit: 150000.0, placed: 50000.0, available: 100000.0 },
  paymentStatus: { ...a.paymentStatus, paymentDeadline: '2026-11-05T00:00:00.000Z' },
  paymentReferences: {
    stpClabe: '000000000000000000',
    cieConvenio: '000000000',
    cieReference: '00000000000',
    payCashReference: '0000000000000',
  },
  reports: { latestCollectionReportUrl: '#' },
});

const mockClients: ExistingClient[] = [
  {
    curp: 'PEGJ900101MDFRRN01',
    firstName: 'JUANA',
    lastNameP: 'PEREZ',
    lastNameM: 'GARCIA',
    birthDate: '1990-01-01',
    phone: '+525511111111',
    id_cliente: '5001',
  },
];

// Se guarda en globalThis para que el estado sobreviva recargas en desarrollo.
const store = ((globalThis as any).__prestaganaMockVales ??= [
  {
    folio: '1000001-202610-DEMO01',
    associateNumber: '1000001',
    firstName: 'JUANA',
    lastNameP: 'PEREZ',
    lastNameM: 'GARCIA',
    birthDate: '1990-01-01',
    loanAmount: 3000,
    installments: 12,
    phone: '+525511111111',
    status: 'FIRMADO',
    tipoVale: 'CLIENTE',
    createdAt: '2026-10-20T16:00:00.000Z',
    signedAt: '2026-10-20T16:10:00.000Z',
  },
] as Vale[]);

// Reglas que la API .NET debe validar del lado del servidor para tipoVale PERSONAL.
const PERSONAL_AMOUNTS = Array.from({ length: (8500 - 4500) / 500 + 1 }, (_, i) => 4500 + i * 500);
const PERSONAL_INSTALLMENTS = [8, 10, 12, 14];

const activePersonalVale = (associateNumber: string) =>
  store.find(
    (v: Vale) =>
      v.associateNumber === associateNumber &&
      v.tipoVale === 'PERSONAL' &&
      (v.status === 'PENDIENTE' || v.status === 'FIRMADO')
  );

const validatePersonalLoan = (data: any): string | null => {
  const associate = findAssociate(data.associateNumber);
  if (!associate) return 'Asociada no encontrada.';
  if (associate.paymentStatus.status !== 'Al Día') return 'La asociada no está al día en sus pagos.';
  if (new Date(monthsAgo(3)) < new Date(associate.activationDate)) return 'La asociada tiene menos de 3 meses de antigüedad.';
  if (activePersonalVale(data.associateNumber)) return 'La asociada ya tiene un préstamo personal activo.';
  if (!PERSONAL_AMOUNTS.includes(Number(data.loanAmount))) return 'Monto no permitido para préstamo personal.';
  if (!PERSONAL_INSTALLMENTS.includes(Number(data.installments))) return 'Plazo no permitido para préstamo personal.';
  return null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const notFound = (message = 'No encontrado.') => json({ message }, 404);

const readBody = (init?: RequestInit) => (init?.body ? JSON.parse(init.body as string) : {});

export const demoFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const method = (init?.method ?? 'GET').toUpperCase();
  const [resource, id, sub] = path.split('/');
  console.log(`[DEMO API] ${method} ${path}`);

  switch (resource) {
    case 'dashboard': {
      const associate = findAssociate(id);
      return associate ? json(associate.user) : notFound();
    }

    case 'dashboardData': {
      const associate = findAssociate(id);
      return associate ? json(dashboardFor(associate)) : notFound();
    }

    case 'prestamoPersonal': {
      const associate = findAssociate(id);
      if (!associate) return notFound();
      if (associate.personalLoanServiceDown) return json({ message: 'Servicio no disponible.' }, 503);
      const active = activePersonalVale(id);
      if (associate.personalLoanMalformed) return json({ cliente: associate.cliente, folioActivo: null });
      return json({ cliente: associate.cliente, prestamoActivo: !!active, folioActivo: active?.folio ?? null });
    }

    case 'valesDashboard':
      return json(store.filter((v: Vale) => v.associateNumber === id));

    case 'vales': {
      if (!id && method === 'POST') {
        const data = readBody(init);
        const tipoVale = data.tipoVale === 'PERSONAL' ? 'PERSONAL' : 'CLIENTE';
        if (tipoVale === 'PERSONAL') {
          const error = validatePersonalLoan(data);
          if (error) return json({ message: error }, 422);
        }
        const now = new Date();
        const folio = `${data.associateNumber}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        store.push({ ...data, tipoVale, folio, status: 'PENDIENTE', createdAt: now.toISOString() });
        return json([{ folio }]);
      }
      const vale = store.find((v: Vale) => v.folio === id);
      if (!vale) return notFound('Vale no encontrado.');
      if (sub === 'status' && method === 'PUT') {
        vale.status = readBody(init).status;
        if (vale.status === 'FIRMADO') vale.signedAt = new Date().toISOString();
        return json(vale);
      }
      if (method === 'DELETE') {
        store.splice(store.indexOf(vale), 1);
        return json({ success: true });
      }
      return json(vale);
    }

    case 'clients': {
      const client = mockClients.find((c) => c.curp === id?.toUpperCase());
      return client ? json(client) : notFound('No se encontró ningún cliente con ese CURP.');
    }

    case 'sms':
      return json({ success: true, message: `(Simulado) SMS enviado. Código: ${MOCK_OTP}` });

    case 'validarotp':
      return json({ codigo: MOCK_OTP });

    case 'users':
      return json({ success: true });

    default:
      return notFound(`Ruta simulada no implementada: ${path}`);
  }
};
