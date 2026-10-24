
import type { Vale, ExistingClient } from './types';

// Por defecto la app trabaja con datos simulados en memoria.
// Para conectarse a la API real, definir USE_REAL_API=true y API_BASE_URL.
const USE_REAL_API = process.env.USE_REAL_API === 'true';
const API_BASE_URL = process.env.API_BASE_URL;

export const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const cleanPath = path.replace(/^\/+/, '');
  if (USE_REAL_API) {
    return fetch(`${API_BASE_URL}${cleanPath}`, init);
  }
  return mockFetch(cleanPath, init);
};

// ==================================================================
// --- API simulada ---
// ==================================================================

// Credenciales de prueba: asociada 1000001, NIP 1234. OTP siempre 123456.
const MOCK_OTP = '123456';

const mockUser = {
  id: '1000001',
  associateNumber: '1000001',
  ID_PRESTAMO: '1000001',
  name: 'ASOCIADA DE PRUEBA',
  email: 'asociada.prueba@example.com',
  phone: '+525500000000',
  birthDate: '1990-01-01',
  nip: '1234',
};

const mockDashboard = {
  associateInfo: {
    name: mockUser.name,
    associateNumber: mockUser.associateNumber,
    branch: 'SUCURSAL DEMO',
    activationDate: '2023-06-03T00:00:00.000Z',
    monthlyPlacementAvg: 4834.0,
  },
  associateLevel: { name: 'Nivel Senior', badgeLabel: 'ASOCIADA' },
  creditLine: { limit: 150000.0, placed: 50000.0, available: 100000.0 },
  paymentStatus: { status: 'Al Día', amountDue: 0.0, paymentDeadline: '2026-11-05T00:00:00.000Z' },
  paymentReferences: {
    stpClabe: '000000000000000000',
    cieConvenio: '000000000',
    cieReference: '00000000000',
    payCashReference: '0000000000000',
  },
  reports: { latestCollectionReportUrl: '#' },
};

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
    associateNumber: mockUser.associateNumber,
    firstName: 'JUANA',
    lastNameP: 'PEREZ',
    lastNameM: 'GARCIA',
    birthDate: '1990-01-01',
    loanAmount: 3000,
    installments: 12,
    phone: '+525511111111',
    status: 'FIRMADO',
    createdAt: '2026-10-20T16:00:00.000Z',
    signedAt: '2026-10-20T16:10:00.000Z',
  },
] as Vale[]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const notFound = (message = 'No encontrado.') => json({ message }, 404);

const readBody = (init?: RequestInit) => (init?.body ? JSON.parse(init.body as string) : {});

const mockFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const method = (init?.method ?? 'GET').toUpperCase();
  const [resource, id, sub] = path.split('/');
  console.log(`[MOCK API] ${method} ${path}`);

  switch (resource) {
    case 'dashboard':
      return id === mockUser.associateNumber ? json(mockUser) : notFound();

    case 'dashboardData':
      return id === mockUser.associateNumber ? json(mockDashboard) : notFound();

    case 'valesDashboard':
      return json(store.filter((v: Vale) => v.associateNumber === id));

    case 'vales': {
      if (!id && method === 'POST') {
        const data = readBody(init);
        const now = new Date();
        const folio = `${data.associateNumber}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        store.push({ ...data, folio, status: 'PENDIENTE', createdAt: now.toISOString() });
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
