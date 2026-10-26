
import type {
  Vale,
  ExistingClient,
  NipResetOtp,
  PersonalLoanInfo,
  PhoneOffer,
  PhonePlan,
  PhoneState,
  PhoneRequestStatus,
  DeviceOperation,
  DeviceChallenge,
  DeviceReportReason,
} from './types';

import { apiFetch } from './api';
import { isPersonalLoanEnabled, isPhoneEnabled } from './features';

// Con un interruptor apagado no se llama ningún endpoint de esa función (ver src/lib/features.ts).
const PERSONAL_LOAN_OFF = 'El préstamo personal no está disponible por ahora.';
const PHONE_OFF = 'El Teléfono PrestaGana no está disponible por ahora.';

export const findUserByAssociateNumber = async (associateNumber: string) => {
  try {
    const response = await apiFetch(`dashboard/${associateNumber}`);
    if (!response.ok) {
        console.error(`API Error: Failed to find user ${associateNumber}`, response.status, await response.text());
        return null;
    }
    const user = await response.json(); 
    // La API debe devolver el usuario con el NIP sin encriptar.
    return user;
  } catch (error) {
    console.error(`Network error when finding user ${associateNumber}:`, error);
    return null;
  }
};

export const getVales = async (associateNumber: string): Promise<Vale[]> => {
  try {
    const response = await apiFetch(`valesDashboard/${associateNumber}`);
    if (!response.ok) {
        console.error(`API Error: Failed to get vales for ${associateNumber}`, response.status, await response.text());
        return [];
    }
    const vales = await response.json();
    return vales.sort((a: Vale, b: Vale) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error(`Network error when getting vales for ${associateNumber}:`, error);
    return [];
  }
};

export const addVale = async (valeData: Omit<Vale, 'folio' | 'status' | 'createdAt'>): Promise<Vale | null> => {
    try {
        const response = await apiFetch(`vales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(valeData)
        });
        if (!response.ok) {
            //console.error(`API Error: Failed to create vale`, response.status, await response.text());
            //return null;
            const errorText = await response.text(); // Esto leerá el error de .NET (ej. un 500 o error de SQL)
    console.error(`API Error:`, response.status, errorText);
    return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network error when creating vale:`, error);
        return null;
    }
};

export const findValeByFolio = async (folio: string): Promise<Vale | undefined> => {
    try {
      const response = await apiFetch(`vales/${folio}`);
      if (!response.ok) {
        console.error(`API Error: Failed to find vale ${folio}`, response.status, await response.text());
        return undefined;
      }
      return await response.json();
    } catch (error) {
      console.error(`Network error when finding vale ${folio}:`, error);
      return undefined;
    }
};

export const updateValeStatus = async (folio: string, status: 'PENDIENTE' | 'FIRMADO' | 'CANJEADO'): Promise<Vale | null> => {
    try {
        const response = await apiFetch(`vales/${folio}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            console.error(`API Error: Failed to update vale ${folio}`, response.status, await response.text());
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network error when updating vale ${folio}:`, error);
        return null;
    }
};

export type DeleteValeResponse = { success: boolean; message: string };

/** Cancela un vale. Si la API lo rechaza (p. ej. un vale ya activo), regresa su mensaje. */
export const deleteValeByFolio = async (folio: string): Promise<DeleteValeResponse> => {
    try {
        const response = await apiFetch(`vales/${folio}`, {
            method: 'DELETE',
            headers: { Accept: '*/*', 'Content-Type': 'application/json' },
            cache: 'no-store',
        });
        // Se lee como texto: la API no siempre responde JSON.
        const responseText = await response.text();
        let data: any = {};
        try {
            data = JSON.parse(responseText);
        } catch {
            console.warn('[DELETE VALE] La respuesta no es un JSON válido:', responseText);
        }
        if (response.ok) {
            return { success: true, message: data?.message || data?.Message || `Vale con folio ${folio} eliminado correctamente.` };
        }
        const message =
            data?.message ||
            data?.Message ||
            (responseText && responseText.length < 200 ? responseText : null) ||
            `No se pudo eliminar el vale con folio ${folio}.`;
        return { success: false, message };
    } catch (error) {
        console.error(`Network error when deleting vale ${folio}:`, error);
        return { success: false, message: 'Ocurrió un error de conexión al intentar cancelar el vale.' };
    }
};

export const getAssociateDashboard = async (associateNumber: string) => {
    try {
        const response = await apiFetch(`dashboardData/${associateNumber}`);
        if (!response.ok) {
            console.error(`API Error: Failed to get dashboard for ${associateNumber}`, response.status, await response.text());
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Network error when getting dashboard for ${associateNumber}:`, error);
        return null;
    }
};

export const findClientByCurp = async (curp: string): Promise<{ success: boolean; data: ExistingClient | null; message: string }> => {
    try {
            // Aseguramos que la URL sea correcta (e.g., .../AppPG/clients/{curp})
     const response = await apiFetch(`clients/${curp}`, {
                cache: 'no-store' // Aseguramos que la búsqueda es en tiempo real
            });
    
     // Caso 1: La API devuelve un código de estado de éxito (200-299)
     if (response.ok) {
     const apiResponse = await response.json();
                
                // CORRECCIÓN CLAVE: Simplificamos la lógica de extracción para ser más robustos
                let clientData: ExistingClient | null = null;
    
                // 1. Intentamos obtener el cliente de la propiedad 'data' (si existe y no es null/undefined)
                const responseData = apiResponse.data || apiResponse;
                
                if (responseData) {
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        // 2. Si es un array (como se vio en el paso anterior), tomamos el primer elemento
                        clientData = responseData[0];
                    } else if (!Array.isArray(responseData) && responseData.curp) {
                        // 3. Si es un objeto simple y contiene el curp, lo tomamos (formato Postman original)
                        clientData = responseData;
                    }
                }
                
                if (clientData) {
     // Éxito: cliente encontrado
     return { success: true, data: clientData, message: 'Cliente encontrado exitosamente.' };
    } else {
                    // Si response.ok es true pero el cuerpo es vacío/null
     console.warn(`API Warning: 200 OK returned, but client data is empty/invalid for CURP ${curp}.`, apiResponse);
     return { success: false, data: null, message: 'Respuesta de API inesperada. No se pudo validar el cliente.' };
     }
     }
    
     // Caso 2: La API devuelve un código de estado de error (400, 404, 500, etc.)
    if (response.status === 404) {
                // Cliente no encontrado (404)
     return { success: false, data: null, message: 'No se encontró ningún cliente con ese CURP.' };
     } else {
     // Otros errores como 401, 500
     const errorText = await response.text();
     console.error(`API Error: Falló la búsqueda del cliente con CURP ${curp}. Estado: ${response.status}. Mensaje: ${errorText}`);
     return { success: false, data: null, message: `Error en la comunicación con la API. Código: ${response.status}.` };
     }
    } catch (error) {
    // Error de red (CORS, servidor caído, etc.)
     console.error(`Network error when finding client with CURP ${curp}:`, error);
     return { success: false, data: null, message: 'Error de red. Asegúrate de tener conexión a Internet.' };
    }
};
    

export const createUser = async (userData: any) => {
    try {
        const response = await apiFetch(`/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            console.error(`API Error: Failed to create user`, response.status, await response.text());
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network error when creating user:`, error);
        return null;
    }
}

// ==================================================================
// --- Funciones de Ayuda para el Restablecimiento de NIP ---
// ==================================================================

/**
 * Almacena un OTP para el restablecimiento de NIP en la base de datos.
 * (Endpoint simulado: se necesita crear en el backend)
 */
export const storeOtpForReset = async (associateId: string, otp: string, expiresAt: Date): Promise<void> => {
  console.log(`(Simulado) Almacenando OTP ${otp} para ${associateId} con expiración ${expiresAt.toISOString()}`);
  // En una implementación real, esto sería una llamada a la API:
  /*
  try {
    const response = await apiFetch(`/users/nip-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ associateId, otp, expiresAt: expiresAt.toISOString() })
    });
    if (!response.ok) {
      throw new Error('Failed to store OTP');
    }
  } catch (error) {
    console.error('API error storing OTP:', error);
    throw error;
  }
  */
  // Por ahora, no hacemos nada, la simulación ocurre en el siguiente método.
};

/**
 * Recupera el OTP almacenado para un asociado.
 * (Endpoint simulado: se necesita crear en el backend)
 */
/*export const getStoredOtpForReset = async (associateId: string): Promise<NipResetOtp | null> => {
    console.log(`(Simulado) Obteniendo OTP para ${associateId}`);
  // En una implementación real, esto sería una llamada a la API:
  
  try {
    const response = await apiFetch(`/validarotp/${associateId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to get stored OTP');
    }
    const otpData = await response.json(); 
    const expectedOtp = otpData.codigo;
    return await response.json() as NipResetOtp;
  } catch (error) {
    console.error('API error getting stored OTP:', error);
    throw error;
  }
  
  // Simulación: Devolvemos un OTP fijo para pruebas.
  // En un caso real, el OTP se guardaría y leería de la DB.
  return {
      otp: '123456', // OTP de prueba
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Expira en 5 mins para pasar la validación
  };
};
*/
export const getStoredOtpForReset = async (associateId: string): Promise<NipResetOtp | null> => {
  try {
    const response = await apiFetch(`/validarotp/${associateId}`);
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to get stored OTP');

    // LEER UNA SOLA VEZ
    const otpData = await response.json(); 

    // Mapear los campos de la API (codigo) a tu interfaz (otp)
    return {
      otp: otpData.codigo, // Usamos el campo 'codigo' que viene de tu API
      //expiresAt: otpData.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('API error getting stored OTP:', error);
    // Si quieres que la UI no se rompa mientras pruebas la API, 
    // podrías retornar el objeto simulado aquí, pero lo ideal es manejar el error.
    return null; 
  }
};
/**
 * Actualiza el NIP de un usuario en la base de datos.
 * (Endpoint simulado: se necesita crear en el backend)
 */
export const updateUserNip = async (associateId: string, newNip: string): Promise<void> => {
  console.log(`(Simulado) Actualizando NIP para ${associateId} a ${newNip}`);
  // En una implementación real, esto sería una llamada a la API:
  /*
  try {
    const response = await apiFetch(`/users/nip`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ associateId, newNip })
    });
    if (!response.ok) {
      throw new Error('Failed to update NIP');
    }
  } catch (error) {
    console.error('API error updating NIP:', error);
    throw error;
  }
  */
};
export const getPersonalLoanInfo = async (associateNumber: string): Promise<PersonalLoanInfo | null> => {
  if (!isPersonalLoanEnabled()) return null;
  try {
    const response = await apiFetch(`prestamoPersonal/${associateNumber}`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`API Error: Failed to get personal loan info for ${associateNumber}`, response.status, await response.text());
      return null;
    }
    const body = await response.json();
    const info = parsePersonalLoanInfo(body?.data ?? body);
    if (!info) {
      console.error(`API Error: Unexpected personal loan info shape for ${associateNumber}`, body);
    }
    return info;
  } catch (error) {
    console.error(`Network error when getting personal loan info for ${associateNumber}:`, error);
    return null;
  }
};

/**
 * Crea un vale de préstamo personal. A diferencia de addVale, regresa el mensaje
 * de error de la API, que es la que valida elegibilidad, monto y plazo.
 */
export const addPersonalLoanVale = async (
  valeData: Record<string, unknown>
): Promise<{ ok: true; folio: string } | { ok: false; message: string }> => {
  if (!isPersonalLoanEnabled()) return { ok: false, message: PERSONAL_LOAN_OFF };
  try {
    const response = await apiFetch(`vales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...valeData, tipoVale: 'PERSONAL' }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      console.error(`API Error: Failed to create personal loan vale`, response.status, body);
      return { ok: false, message: body?.message || 'No se pudo crear el préstamo personal.' };
    }
    const folioObject = Array.isArray(body) ? body[0] : body;
    const folio = folioObject?.folio ?? folioObject?.FOLIO;
    if (!folio) {
      return { ok: false, message: 'El servidor no devolvió el folio del préstamo.' };
    }
    return { ok: true, folio };
  } catch (error) {
    console.error(`Network error when creating personal loan vale:`, error);
    return { ok: false, message: 'Servicio no disponible. Intenta más tarde.' };
  }
};

const CLIENTE_FIELDS = ['curp', 'firstName', 'lastNameP', 'lastNameM', 'birthDate', 'phone', 'id_cliente'] as const;

/** Valida la respuesta de prestamoPersonal. Si falta algo, regresa null y la sección queda bloqueada. */
function parsePersonalLoanInfo(raw: any): PersonalLoanInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const { cliente, prestamoActivo, folioActivo } = raw;
  if (typeof prestamoActivo !== 'boolean') return null;
  if (!cliente || typeof cliente !== 'object') return null;
  const clienteCompleto = CLIENTE_FIELDS.every(
    (field) => cliente[field] !== undefined && cliente[field] !== null && String(cliente[field]).trim() !== ''
  );
  if (!clienteCompleto) return null;
  return {
    cliente: Object.fromEntries(CLIENTE_FIELDS.map((field) => [field, String(cliente[field])])) as ExistingClient,
    prestamoActivo,
    folioActivo: typeof folioActivo === 'string' && folioActivo ? folioActivo : null,
  };
}

// ==================================================================
// --- Teléfono financiado y firma del dispositivo ---
// ==================================================================

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const oneOf = <T extends string>(value: unknown, options: readonly T[]): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value);

const REQUEST_STATUSES = ['SOLICITADO', 'ENGANCHE_CONFIRMADO', 'EN_PREPARACION', 'LISTO_PARA_RECOGER', 'ACTIVO', 'CANCELADO'] as const;
const DEVICE_STATUSES = ['ACTIVO', 'BLOQUEADO', 'REPORTADO', 'REVOCADO'] as const;
const MORA_LEVELS = ['AVISO', 'GRACIA', 'BLOQUEO'] as const;

/** Valida la oferta. Sin precio, enganche o planes completos, regresa null (servicio no disponible). */
function parsePhoneOffer(raw: any): PhoneOffer | null {
  if (!raw || typeof raw !== 'object' || typeof raw.elegible !== 'boolean') return null;
  const { modelo, precio, engancheMonto, planes } = raw;
  if (!modelo || !isText(modelo.nombre) || !isText(modelo.almacenamiento) || typeof modelo.imagenUrl !== 'string') return null;
  if (!isNumber(precio) || !isNumber(engancheMonto) || !Array.isArray(planes) || planes.length === 0) return null;
  const planesValidos = planes.every(
    (p: any) => p && Number.isInteger(p.quincenas) && isNumber(p.pagoQuincenal) && isNumber(p.totalPagar)
  );
  if (!planesValidos) return null;
  return {
    elegible: raw.elegible,
    motivo: isText(raw.motivo) ? raw.motivo : undefined,
    modelo: { nombre: modelo.nombre, almacenamiento: modelo.almacenamiento, imagenUrl: modelo.imagenUrl },
    precio,
    engancheMonto,
    planes: planes
      .map((p: any): PhonePlan => ({ quincenas: p.quincenas, pagoQuincenal: p.pagoQuincenal, totalPagar: p.totalPagar }))
      .sort((a: PhonePlan, b: PhonePlan) => a.quincenas - b.quincenas),
  };
}

/** Valida el estado. Cualquier campo presente con forma inesperada invalida toda la respuesta. */
function parsePhoneState(raw: any): PhoneState | null {
  if (!raw || typeof raw !== 'object' || typeof raw.emisionRestringida !== 'boolean') return null;
  const state: PhoneState = { emisionRestringida: raw.emisionRestringida };
  const { solicitud, dispositivo, cuotas, mora } = raw;
  if (solicitud != null) {
    if (!isText(solicitud.folio) || !oneOf(solicitud.estatus, REQUEST_STATUSES) || typeof solicitud.fecha !== 'string') return null;
    state.solicitud = { folio: solicitud.folio, estatus: solicitud.estatus, fecha: solicitud.fecha };
  }
  if (dispositivo != null) {
    if (!oneOf(dispositivo.estatus, DEVICE_STATUSES) || typeof dispositivo.modelo !== 'string') return null;
    state.dispositivo = {
      estatus: dispositivo.estatus,
      modelo: dispositivo.modelo,
      ultimos4Imei: String(dispositivo.ultimos4Imei ?? '').slice(-4),
    };
  }
  if (cuotas != null) {
    if (![cuotas.actual, cuotas.total, cuotas.pagoQuincenal, cuotas.saldo].every(isNumber)) return null;
    state.cuotas = { actual: cuotas.actual, total: cuotas.total, pagoQuincenal: cuotas.pagoQuincenal, saldo: cuotas.saldo };
  }
  if (mora != null) {
    if (!isNumber(mora.dias) || !isNumber(mora.monto) || !oneOf(mora.nivel, MORA_LEVELS)) return null;
    state.mora = { dias: mora.dias, monto: mora.monto, nivel: mora.nivel };
  }
  return state;
}

const readJson = async (response: Response) => {
  const body = await response.json().catch(() => null);
  return body?.data ?? body;
};

export const getPhoneOffer = async (associateNumber: string): Promise<PhoneOffer | null> => {
  if (!isPhoneEnabled()) return null;
  try {
    const response = await apiFetch(`telefono/oferta/${associateNumber}`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`API Error: Failed to get phone offer for ${associateNumber}`, response.status);
      return null;
    }
    const offer = parsePhoneOffer(await readJson(response));
    if (!offer) console.error(`API Error: Unexpected phone offer shape for ${associateNumber}`);
    return offer;
  } catch (error) {
    console.error(`Network error when getting phone offer for ${associateNumber}:`, error);
    return null;
  }
};

/**
 * Estado del teléfono. null = no se pudo saber (las acciones de emisión lo tratan como bloqueo).
 * Con el Teléfono apagado: sin equipo y sin restricción, sin llamar a la API.
 */
export const getPhoneState = async (associateNumber: string): Promise<PhoneState | null> => {
  if (!isPhoneEnabled()) return { emisionRestringida: false };
  try {
    const response = await apiFetch(`telefono/estado/${associateNumber}`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`API Error: Failed to get phone state for ${associateNumber}`, response.status);
      return null;
    }
    const state = parsePhoneState(await readJson(response));
    if (!state) console.error(`API Error: Unexpected phone state shape for ${associateNumber}`);
    return state;
  } catch (error) {
    console.error(`Network error when getting phone state for ${associateNumber}:`, error);
    return null;
  }
};

type ApiResult<T> = ({ ok: true } & T) | { ok: false; message: string };

const postJson = async (path: string, payload: unknown, fallbackMessage: string): Promise<ApiResult<{ body: any }>> => {
  try {
    const response = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = await readJson(response);
    if (!response.ok) {
      console.error(`API Error: POST ${path}`, response.status, body?.message);
      return { ok: false, message: isText(body?.message) ? body.message : fallbackMessage };
    }
    return { ok: true, body };
  } catch (error) {
    console.error(`Network error on POST ${path}:`, error);
    return { ok: false, message: 'Servicio no disponible. Intenta más tarde.' };
  }
};

export const createPhoneRequest = async (payload: {
  associateNumber: string;
  quincenas: number;
  aceptoTerminos: true;
}): Promise<ApiResult<{ folio: string; estatus: PhoneRequestStatus }>> => {
  if (!isPhoneEnabled()) return { ok: false, message: PHONE_OFF };
  const result = await postJson('telefono/solicitudes', payload, 'No se pudo registrar la solicitud.');
  if (!result.ok) return result;
  const { folio, estatus } = result.body ?? {};
  if (!isText(folio) || !oneOf(estatus, REQUEST_STATUSES)) {
    return { ok: false, message: 'El servidor no devolvió el folio de la solicitud.' };
  }
  return { ok: true, folio, estatus };
};

export const requestDeviceChallenge = async (payload: {
  associateNumber: string;
  operacion: DeviceOperation;
  folio?: string;
  monto?: number;
}): Promise<ApiResult<{ challenge: DeviceChallenge }>> => {
  if (!isPhoneEnabled()) return { ok: false, message: PHONE_OFF };
  const result = await postJson('dispositivo/desafio', payload, 'No se pudo generar el desafío del equipo.');
  if (!result.ok) return result;
  const { challengeId, challenge, expiraEn } = result.body ?? {};
  if (!isText(challengeId) || !isText(challenge)) {
    return { ok: false, message: 'Respuesta inválida del servicio de dispositivo.' };
  }
  return { ok: true, challenge: { challengeId, challenge, expiraEn: String(expiraEn ?? '') } };
};

/**
 * Verifica la firma del equipo. Además del body del contrato, manda la operación esperada
 * para que la API confirme que el desafío se emitió para esta asociada, operación, folio y monto.
 */
export const verifyDeviceSignature = async (payload: {
  challengeId: string;
  firma: string;
  deviceId: string;
  associateNumber: string;
  operacion: DeviceOperation;
  folio?: string;
  monto?: number;
}): Promise<{ valido: boolean; motivo?: string }> => {
  if (!isPhoneEnabled()) return { valido: false, motivo: PHONE_OFF };
  const result = await postJson('dispositivo/verificar', payload, 'No se pudo verificar el equipo.');
  if (!result.ok) return { valido: false, motivo: result.message };
  return result.body?.valido === true
    ? { valido: true }
    : { valido: false, motivo: isText(result.body?.motivo) ? result.body.motivo : undefined };
};

export const reportDevice = async (payload: {
  associateNumber: string;
  motivo: DeviceReportReason;
}): Promise<ApiResult<{}>> => {
  if (!isPhoneEnabled()) return { ok: false, message: PHONE_OFF };
  const result = await postJson('dispositivo/reporte', payload, 'No se pudo reportar el equipo.');
  return result.ok ? { ok: true } : result;
};
