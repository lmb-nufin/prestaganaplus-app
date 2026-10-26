import 'server-only';

import type {
  Vale,
  ExistingClient,
  DeviceOperation,
  DeviceStatus,
  PhoneMoraLevel,
  PhoneRequestStatus,
  PhoneState,
} from './types';

// ==================================================================
// --- API simulada en memoria para DEMO_MODE=true ---
// ==================================================================

// Todas las asociadas de prueba usan el NIP 1234. El OTP siempre es 123456.
//   1000001  Al Día, alta 2023: elegible para préstamo personal y para el teléfono
//   1000002  Atrasada
//   1000003  Alta hace menos de 3 meses
//   1000004  GET prestamoPersonal responde 503 (servicio caído)
//   1000005  GET prestamoPersonal responde sin prestamoActivo (respuesta mal formada)
// Teléfono financiado:
//   1000006  elegible, sin solicitud
//   1000007  solicitud SOLICITADO          1000008  ENGANCHE_CONFIRMADO
//   1000009  EN_PREPARACION                1000010  LISTO_PARA_RECOGER
//   1000011  equipo ACTIVO, emisión restringida (usar ?demoDevice=1 para el bridge simulado)
//   1000012  equipo REPORTADO: emisión bloqueada
//   1000013  equipo ACTIVO con mora AVISO  1000014  equipo ACTIVO con mora GRACIA
//   1000015  no elegible para el teléfono
//   1000016  servicio de teléfono caído (todas las rutas telefono/ y dispositivo/ responden 503)
//   1000017  solicitud CANCELADO (puede volver a solicitar)
const MOCK_OTP = '123456';

type PhoneProfile = {
  solicitud?: PhoneRequestStatus;
  dispositivo?: DeviceStatus;
  mora?: PhoneMoraLevel;
  noElegible?: boolean;
  serviceDown?: boolean;
};

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
  phone?: PhoneProfile;
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
  makeAssociate('1000006', 'PAOLA', 'REYES', 'CRUZ', '+525500000006'),
  makeAssociate('1000007', 'MARTHA', 'LUNA', 'RIOS', '+525500000007', { phone: { solicitud: 'SOLICITADO' } }),
  makeAssociate('1000008', 'ELENA', 'CAMPOS', 'PAZ', '+525500000008', { phone: { solicitud: 'ENGANCHE_CONFIRMADO' } }),
  makeAssociate('1000009', 'DIANA', 'SOLIS', 'LARA', '+525500000009', { phone: { solicitud: 'EN_PREPARACION' } }),
  makeAssociate('1000010', 'GLORIA', 'VEGA', 'MENA', '+525500000010', { phone: { solicitud: 'LISTO_PARA_RECOGER' } }),
  makeAssociate('1000011', 'NORMA', 'IBARRA', 'LEON', '+525500000011', {
    paymentStatus: { status: 'Al Día', amountDue: 1520 },
    phone: { solicitud: 'ACTIVO', dispositivo: 'ACTIVO' },
  }),
  makeAssociate('1000012', 'SILVIA', 'OCHOA', 'RUIZ', '+525500000012', {
    paymentStatus: { status: 'Al Día', amountDue: 1520 },
    phone: { solicitud: 'ACTIVO', dispositivo: 'REPORTADO' },
  }),
  makeAssociate('1000013', 'TERESA', 'MOLINA', 'SANZ', '+525500000013', {
    paymentStatus: { status: 'Al Día', amountDue: 1840 },
    phone: { solicitud: 'ACTIVO', dispositivo: 'ACTIVO', mora: 'AVISO' },
  }),
  makeAssociate('1000014', 'IRMA', 'PONCE', 'GALVAN', '+525500000014', {
    paymentStatus: { status: 'Atrasada', amountDue: 2480 },
    phone: { solicitud: 'ACTIVO', dispositivo: 'ACTIVO', mora: 'GRACIA' },
  }),
  makeAssociate('1000015', 'LAURA', 'MEJIA', 'ROJO', '+525500000015', { phone: { noElegible: true } }),
  makeAssociate('1000016', 'BEATRIZ', 'ARIAS', 'NUÑEZ', '+525500000016', { phone: { serviceDown: true } }),
  makeAssociate('1000017', 'CLAUDIA', 'FUENTES', 'ORTA', '+525500000017', { phone: { solicitud: 'CANCELADO' } }),
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
  // Desglose de la cuota del teléfono; amountDue ya la incluye (más la mora, si hay).
  ...phoneCollectionFor(a),
});

const phoneCollectionFor = (a: MockAssociate) => {
  const cuotas = phoneRecordFor(a).cuotas;
  return cuotas
    ? { telefono: { pagoQuincenal: cuotas.pagoQuincenal, cuotaActual: cuotas.actual, totalCuotas: cuotas.total, saldo: cuotas.saldo } }
    : {};
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
  // Vales pendientes de asociadas con equipo, para probar la firma restringida.
  ...['1000011', '1000012'].map((associateNumber) => ({
    folio: `${associateNumber}-202610-DEMO02`,
    associateNumber,
    firstName: 'JUANA',
    lastNameP: 'PEREZ',
    lastNameM: 'GARCIA',
    birthDate: '1990-01-01',
    loanAmount: 4500,
    installments: 12,
    phone: '+525511111111',
    status: 'PENDIENTE',
    tipoVale: 'CLIENTE',
    createdAt: '2026-10-22T16:00:00.000Z',
  })),
] as Vale[]);

// Reglas que la API .NET debe validar del lado del servidor para tipoVale PERSONAL.
const PERSONAL_AMOUNTS = Array.from({ length: (9000 - 5000) / 500 + 1 }, (_, i) => 5000 + i * 500);
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

// ==================================================================
// --- Teléfono financiado (simulación de la API .NET) ---
// ==================================================================

// Valores de ejemplo: en la API real los define Finanzas y Riesgo. La app nunca los tiene fijos.
const PHONE_PRICE = 4499;
const PHONE_DOWN_PAYMENT = 225; // 5%
const PHONE_PLANS = [
  { quincenas: 12, pagoQuincenal: 445, totalPagar: 5340 },
  { quincenas: 18, pagoQuincenal: 320, totalPagar: 5760 },
];
const PHONE_MODEL = { nombre: 'Samsung Galaxy A17 4G', almacenamiento: '128GB', imagenUrl: '/demo/galaxy-a17.svg' };
// El bridge simulado reporta siempre este deviceId (src/components/demo-device-bridge.tsx).
export const DEMO_DEVICE_ID = 'DEMO-DEVICE-0001';

type PhoneRecord = Omit<PhoneState, 'emisionRestringida'>;

const phoneStore: Map<string, PhoneRecord> = ((globalThis as any).__prestaganaMockPhone ??= new Map());

const MORA = {
  AVISO: { dias: 3, monto: 320 },
  GRACIA: { dias: 12, monto: 960 },
  BLOQUEO: { dias: 25, monto: 1600 },
} as const;

const phoneRecordFor = (a: MockAssociate): PhoneRecord => {
  const n = a.user.associateNumber;
  if (!phoneStore.has(n)) {
    const profile = a.phone ?? {};
    const record: PhoneRecord = {};
    if (profile.solicitud) {
      record.solicitud = { folio: `TEL-${n}-DEMO`, estatus: profile.solicitud, fecha: '2026-10-01T16:00:00.000Z' };
    }
    if (profile.dispositivo) {
      record.dispositivo = { estatus: profile.dispositivo, modelo: `${PHONE_MODEL.nombre} ${PHONE_MODEL.almacenamiento}`, ultimos4Imei: n.slice(-4) };
      record.cuotas = { actual: 3, total: 18, pagoQuincenal: 320, saldo: 4800 };
    }
    if (profile.mora) record.mora = { ...MORA[profile.mora], nivel: profile.mora };
    phoneStore.set(n, record);
  }
  return phoneStore.get(n)!;
};

// D3: la restricción la decide la API; aquí dura mientras exista el equipo.
const phoneStateFor = (a: MockAssociate): PhoneState => {
  const record = phoneRecordFor(a);
  return { ...record, emisionRestringida: !!record.dispositivo };
};

const phoneEligibility = (a: MockAssociate): { elegible: boolean; motivo?: string } => {
  const record = phoneRecordFor(a);
  if (a.phone?.noElegible) return { elegible: false, motivo: 'Por ahora no tienes una oferta de equipo disponible.' };
  if (a.paymentStatus.status !== 'Al Día') return { elegible: false, motivo: 'Necesitas estar al día en tus pagos.' };
  if (new Date(monthsAgo(3)) < new Date(a.activationDate)) return { elegible: false, motivo: 'Disponible al cumplir 3 meses como asociada.' };
  if (record.dispositivo) return { elegible: false, motivo: 'Ya tienes un equipo PrestaGana.' };
  if (record.solicitud && record.solicitud.estatus !== 'CANCELADO') {
    return { elegible: false, motivo: 'Ya tienes una solicitud de equipo en proceso.' };
  }
  return { elegible: true };
};

type DemoChallenge = {
  associateNumber: string;
  operacion: DeviceOperation;
  folio?: string;
  monto?: number;
  challenge: string;
  expiresAt: number;
  used: boolean;
};

const challengeStore: Map<string, DemoChallenge> = ((globalThis as any).__prestaganaMockChallenges ??= new Map());
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const DEVICE_OPERATIONS: DeviceOperation[] = ['CREAR_VALE', 'FIRMAR_VALE', 'PRESTAMO_PERSONAL', 'CANCELAR_VALE'];
const REPORT_REASONS = ['ROBO', 'PERDIDA', 'DANO', 'OTRO'];

const verifyChallenge = (data: any): { valido: boolean; motivo?: string } => {
  const entry = challengeStore.get(data.challengeId);
  if (!entry) return { valido: false, motivo: 'Desafío inexistente.' };
  if (entry.used) return { valido: false, motivo: 'El desafío ya se usó.' };
  // Un solo uso: se consume en el primer intento, sea válido o no.
  entry.used = true;
  if (Date.now() > entry.expiresAt) return { valido: false, motivo: 'El desafío expiró.' };
  if (entry.associateNumber !== data.associateNumber || entry.operacion !== data.operacion) {
    return { valido: false, motivo: 'El desafío no corresponde a esta operación.' };
  }
  if ((entry.folio ?? null) !== (data.folio ?? null)) return { valido: false, motivo: 'El desafío no corresponde a este folio.' };
  if ((entry.monto ?? null) !== (data.monto ?? null) && Number(entry.monto) !== Number(data.monto)) {
    return { valido: false, motivo: 'El desafío no corresponde a este monto.' };
  }
  if (data.deviceId !== DEMO_DEVICE_ID) return { valido: false, motivo: 'Equipo no registrado.' };
  if (data.firma !== `demo-${entry.challenge}`) return { valido: false, motivo: 'Firma inválida.' };
  return { valido: true };
};

const phoneRoutes = (resource: string, id: string | undefined, sub: string | undefined, method: string, init?: RequestInit) => {
  if (resource === 'telefono') {
    if (id === 'oferta' && method === 'GET') {
      const associate = findAssociate(sub);
      if (!associate) return notFound();
      if (associate.phone?.serviceDown) return json({ message: 'Servicio no disponible.' }, 503);
      return json({ ...phoneEligibility(associate), modelo: PHONE_MODEL, precio: PHONE_PRICE, engancheMonto: PHONE_DOWN_PAYMENT, planes: PHONE_PLANS });
    }
    if (id === 'estado' && method === 'GET') {
      const associate = findAssociate(sub);
      if (!associate) return notFound();
      if (associate.phone?.serviceDown) return json({ message: 'Servicio no disponible.' }, 503);
      return json(phoneStateFor(associate));
    }
    if (id === 'solicitudes' && method === 'POST') {
      const data = readBody(init);
      const associate = findAssociate(data.associateNumber);
      if (!associate) return notFound('Asociada no encontrada.');
      if (associate.phone?.serviceDown) return json({ message: 'Servicio no disponible.' }, 503);
      if (data.aceptoTerminos !== true) return json({ message: 'Debes aceptar los términos.' }, 422);
      if (!PHONE_PLANS.some((p) => p.quincenas === Number(data.quincenas))) return json({ message: 'Plan no permitido.' }, 422);
      const { elegible, motivo } = phoneEligibility(associate);
      if (!elegible) return json({ message: motivo }, 422);
      const folio = `TEL-${associate.user.associateNumber}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      phoneRecordFor(associate).solicitud = { folio, estatus: 'SOLICITADO', fecha: new Date().toISOString() };
      return json({ folio, estatus: 'SOLICITADO' });
    }
  }

  if (resource === 'dispositivo' && method === 'POST') {
    const data = readBody(init);
    if (id === 'verificar') {
      const entry = challengeStore.get(data.challengeId);
      if (entry && findAssociate(entry.associateNumber)?.phone?.serviceDown) return json({ message: 'Servicio no disponible.' }, 503);
      return json(verifyChallenge(data));
    }
    const associate = findAssociate(data.associateNumber);
    if (!associate) return notFound('Asociada no encontrada.');
    if (associate.phone?.serviceDown) return json({ message: 'Servicio no disponible.' }, 503);
    const record = phoneRecordFor(associate);
    if (id === 'desafio') {
      if (!DEVICE_OPERATIONS.includes(data.operacion)) return json({ message: 'Operación no permitida.' }, 422);
      if (record.dispositivo?.estatus !== 'ACTIVO' && record.dispositivo?.estatus !== 'BLOQUEADO') {
        return json({ message: 'No hay un equipo activo para firmar.' }, 422);
      }
      const challengeId = crypto.randomUUID();
      const challenge = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = Date.now() + CHALLENGE_TTL_MS;
      challengeStore.set(challengeId, {
        associateNumber: data.associateNumber,
        operacion: data.operacion,
        folio: data.folio ?? undefined,
        monto: data.monto ?? undefined,
        challenge,
        expiresAt,
        used: false,
      });
      return json({ challengeId, challenge, expiraEn: new Date(expiresAt).toISOString() });
    }
    if (id === 'reporte') {
      if (!REPORT_REASONS.includes(data.motivo)) return json({ message: 'Motivo no válido.' }, 422);
      if (!record.dispositivo) return json({ message: 'No tienes un equipo registrado.' }, 422);
      record.dispositivo.estatus = 'REPORTADO';
      return json({ success: true });
    }
  }

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

    case 'telefono':
    case 'dispositivo':
      return phoneRoutes(resource, id, sub, method, init) ?? notFound(`Ruta simulada no implementada: ${path}`);

    default:
      return notFound(`Ruta simulada no implementada: ${path}`);
  }
};
