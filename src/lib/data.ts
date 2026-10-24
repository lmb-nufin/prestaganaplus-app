
import type { Vale, ExistingClient, NipResetOtp } from './types';

import { apiFetch } from './api';

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

export const deleteValeByFolio = async (folio: string): Promise<boolean> => {
    try {
        const response = await apiFetch(`vales/${folio}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error(`Network error when deleting vale ${folio}:`, error);
        return false;
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