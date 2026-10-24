
'use server';

import { z } from 'zod';
import { addVale, findValeByFolio, getVales as getValesFromDb, updateValeStatus as updateValeStatusInDb, findUserByAssociateNumber, deleteValeByFolio, findClientByCurp, createUser, updateUserNip, storeOtpForReset, getStoredOtpForReset, addPersonalLoanVale, createPhoneRequest, getPhoneState, reportDevice, requestDeviceChallenge as requestDeviceChallengeFromApi } from '@/lib/data';
import { apiFetch } from '@/lib/api';
import { getPersonalLoanEligibility, PERSONAL_LOAN_AMOUNTS, PERSONAL_LOAN_INSTALLMENTS } from '@/lib/personal-loan';
import { getIssuanceMode, getPhoneOfferOption, requireDeviceAuthorization } from '@/lib/phone';
import type { DeviceChallenge, DeviceOperation, DeviceReportReason } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { signIn, signOut, auth } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';


export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciales inválidas.';
        default:
          return 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      }
    }
    throw error;
  }
}

export async function performSignOut() {
    await signOut({ redirectTo: '/login' });
}

export async function createVale(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { message: 'Error de autenticación: No se pudo obtener el número de asociada.' };
    }
    const associateNumber = session.user.associateNumber;

    const rawFormData = Object.fromEntries(formData.entries());
    
    const CreateValeSchema = z.object({
        firstName: z.string().min(1, 'El nombre es requerido.'),
        lastNameP: z.string().min(1, 'El apellido paterno es requerido.'),
        lastNameM: z.string().min(1, 'El apellido materno es requerido.'),
        birthDate: z.string().min(1, 'La fecha de nacimiento es requerida.'),
        loanAmount: z.coerce.number().gt(0, 'El monto debe ser mayor a cero.'),
        installments: z.coerce.number().int().gt(0, 'El número de quincenas debe ser mayor a cero.'),
        isRenewed: z.string(),
        phone: z.string().optional(),
        phone_number: z.string().optional(),
        id_cliente: z.string().optional(),
        deviceId: z.string().optional(),
        deviceModel: z.string().optional(),
        latitude:z.string().optional(),
        longitude:z.string().optional(),
        mapLink: z.string().optional(),
    });

    const validatedFields = CreateValeSchema.safeParse(rawFormData);
    
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }
    
    const deviceError = await requireDeviceAuthorization({
        associateNumber,
        operacion: 'CREAR_VALE',
        formData,
        monto: validatedFields.data.loanAmount,
    });
    if (deviceError) {
        return { message: deviceError };
    }

    const isRenewed = validatedFields.data.isRenewed === 'true';
    let phoneE164;

    if (isRenewed) {
        if (!validatedFields.data.phone) {
            return { message: 'Falta el número de teléfono para el cliente existente.' };
        }
        phoneE164 = validatedFields.data.phone;
    } else {
        const phoneRegex = /^\d{10}$/;
        if (!validatedFields.data.phone_number || !phoneRegex.test(validatedFields.data.phone_number)) {
             return { 
                errors: { phone_number: ['El teléfono debe tener 10 dígitos.'] },
                message: 'El número de teléfono es requerido y debe tener 10 dígitos para nuevos clientes.' 
            };
        }
        phoneE164 = `+52${validatedFields.data.phone_number}`;
    }
    const clienteParaEnviar = validatedFields.data.id_cliente && validatedFields.data.id_cliente.trim() !== "" 
        ? validatedFields.data.id_cliente 
        : "";

    const latRaw = validatedFields.data.latitude;
    const lngRaw = validatedFields.data.longitude;
    
    const latNum = (latRaw && latRaw !== "") ? parseFloat(latRaw as string) : null;
    const lngNum = (lngRaw && lngRaw !== "") ? parseFloat(lngRaw as string) : null;

    const generatedMapLink = (latNum && lngNum) 
    ? `https://www.google.com/maps?q=${latNum},${lngNum}` 
    : null;

    const dataToSave = {
        associateNumber: associateNumber,
        firstName: validatedFields.data.firstName,
        lastNameP: validatedFields.data.lastNameP,
        lastNameM: validatedFields.data.lastNameM,
        birthDate: validatedFields.data.birthDate,
        loanAmount: validatedFields.data.loanAmount,
        installments: validatedFields.data.installments,
        phone: phoneE164,
        id_cliente: clienteParaEnviar,        
        deviceId: validatedFields.data.deviceId || 'unknown',
        deviceModel: validatedFields.data.deviceModel || 'unknown',
        latitude: validatedFields.data.latitude || 'unknown',
        longitude: validatedFields.data.longitude || 'unknown',
        mapLink: generatedMapLink,
        
    };
    
    let newVale;
    try {
        newVale = await addVale(dataToSave);
    } catch (error) {
        return { message: 'Error al crear el vale.' };
    }

  
    if (!newVale || !Array.isArray(newVale) || newVale.length === 0) {
        console.error("Respuesta del backend inesperada, no es un array válido:", newVale);
        return { message: 'No se pudo crear el vale. El servidor no devolvió el folio.' };
    }

    const folioObject = newVale[0];
    let folioValue: string | null = null;

    if (folioObject && folioObject.folio) {
        folioValue = folioObject.folio;
    } else if (folioObject && folioObject.FOLIO) {
        folioValue = folioObject.FOLIO;
    }

    if (!folioValue) {
        console.error("DEBUG: Objeto recibido que no tiene folio en sus propiedades esperadas:", folioObject);
        return { message: 'El servidor devolvió un resultado, pero no se pudo obtener el Folio. (Ver consola para DEBUG)' };
    }
    
    revalidatePath('/vales');
    revalidatePath(`/sign/${folioValue}`);

    return { success: true, message: 'Vale creado', folio: folioValue };
}

export async function createPersonalLoanVale(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'Error de autenticación: No se pudo obtener el número de asociada.' };
    }
    const associateNumber = session.user.associateNumber;

    // Se vuelve a evaluar aquí: la página pudo cargarse antes de que cambiara el estado (p. ej. otra pestaña).
    const eligibility = await getPersonalLoanEligibility(associateNumber);
    if (!eligibility.eligible) {
        return { success: false, message: eligibility.message };
    }

    const PersonalLoanSchema = z.object({
        loanAmount: z.coerce.number().refine(v => PERSONAL_LOAN_AMOUNTS.includes(v), 'Monto no permitido.'),
        installments: z.coerce.number().refine(v => PERSONAL_LOAN_INSTALLMENTS.includes(v), 'Plazo no permitido.'),
        deviceId: z.string().optional(),
        deviceModel: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
    });

    const validatedFields = PersonalLoanSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Monto o plazo no permitido.',
        };
    }

    const { loanAmount, installments, deviceId, deviceModel, latitude, longitude } = validatedFields.data;

    const deviceError = await requireDeviceAuthorization({
        associateNumber,
        operacion: 'PRESTAMO_PERSONAL',
        formData,
        monto: loanAmount,
    });
    if (deviceError) {
        return { success: false, message: deviceError };
    }

    const latNum = latitude ? parseFloat(latitude) : null;
    const lngNum = longitude ? parseFloat(longitude) : null;

    // Los datos personales salen de la API, nunca del formulario.
    const { cliente } = eligibility;
    const result = await addPersonalLoanVale({
        associateNumber,
        firstName: cliente.firstName,
        lastNameP: cliente.lastNameP,
        lastNameM: cliente.lastNameM,
        birthDate: cliente.birthDate,
        phone: cliente.phone,
        id_cliente: cliente.id_cliente,
        loanAmount,
        installments,
        deviceId: deviceId || 'unknown',
        deviceModel: deviceModel || 'unknown',
        latitude: latitude || 'unknown',
        longitude: longitude || 'unknown',
        mapLink: latNum && lngNum ? `https://www.google.com/maps?q=${latNum},${lngNum}` : null,
    });

    if (!result.ok) {
        return { success: false, message: result.message };
    }

    revalidatePath('/');
    revalidatePath('/vales');
    redirect(`/sign/${result.folio}`);
}



export async function getVales() {
  const session = await auth();
  if (!session?.user?.associateNumber) return [];
  const allVales = await getValesFromDb(session.user.associateNumber);
  return allVales;
}

export async function getValeByFolio(folio: string) {
  return await findValeByFolio(folio);
}



export async function sendValeOtp(associateId?: string) {
    /*const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }*/
    const session = await auth();
    const idToSearch = associateId || session?.user?.associateNumber;
    
    if (!idToSearch) {
        return { success: false, message: 'No se pudo identificar a la asociada.' };
    }
    
    /*const associate = await findUserByAssociateNumber(session.user.associateNumber);
    if (!associate?.phone || !associate.associateNumber || !associate.name) {
        return { success: false, message: 'Faltan datos críticos (teléfono, ID de préstamo o ID de usuario) de la asociada.' };
    }*/
    const associate = await findUserByAssociateNumber(idToSearch);

    if (!associate?.phone || !associate.name) {
        return { success: false, message: 'Faltan datos críticos en la base de datos.' };
    }
    
    const requestBody = {
        ID_PRESTAMO: associate.ID_PRESTAMO || idToSearch,
        ID_USUARIO: 1703,
        NO_CELULAR: associate.phone,
        NOMBRE_CLIENTE: associate.name
    };

    console.log(`[API Call] Iniciando envío de OTP: sms/send`);

    try {
        const response = await apiFetch(`sms/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`[API Response] SMS enviado y registrado. Mensaje: ${data.message}`);
            return { success: true, message: `Se ha enviado un código de verificación a tu teléfono registrado.` };
        } else {
            console.error('API C# Error:', data.message || data.error);
            return { success: false, message: data.message || 'Error desconocido al solicitar el código de verificación.' };
        }

    } catch (error) {
        console.error('Failed to call C# API:', error);
        return { success: false, message: 'Ocurrió un error de red al contactar el servicio de verificación.' };
    }
}


export async function signValeWithOtp(prevState: any, formData: FormData) {

    const SignValeSchema = z.object({
        folio: z.string().min(1, 'El folio es requerido.'),
        otp: z.string().length(6, 'El código debe tener 6 dígitos.'),
        nip: z.string().min(4, 'El NIP debe tener al menos 4 dígitos.'),
    });

    const validatedFields = SignValeSchema.safeParse({
        folio: formData.get('folio'),
        otp: formData.get('otp'),
        nip: formData.get('nip'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación. Revisa los campos.',
        };
    }
    
    const { folio, otp, nip } = validatedFields.data;
    
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }
    
    const associate = await findUserByAssociateNumber(session.user.associateNumber);
    if (!associate) {
        return { success: false, message: 'No se encontraron los datos de la asociada.' };
    }

    const vale = await findValeByFolio(folio);
    if (!vale || vale.associateNumber !== session.user.associateNumber) {
        return { success: false, message: 'No se encontró el vale.' };
    }

    // D2: en la miniapp la firma del equipo se suma al OTP + NIP, no los reemplaza.
    const deviceError = await requireDeviceAuthorization({
        associateNumber: session.user.associateNumber,
        operacion: 'FIRMAR_VALE',
        formData,
        folio,
        monto: vale.loanAmount,
    });
    if (deviceError) {
        return { success: false, message: deviceError };
    }

    try {
      const associateNumber = associate.associateNumber;

        const otpResponse = await apiFetch(`validarotp/${associateNumber}`);
        
        if (!otpResponse.ok) {
            const errorData = await otpResponse.json();
            return {
                success: false,
                message: errorData.message || 'Error al obtener el código de la BD. Intente reenviar el SMS.',
            };
        }

        const otpData = await otpResponse.json(); 
        const expectedOtp = otpData.codigo;

        if (otp !== expectedOtp) {
            return {
                success: false,
                message: 'El código de verificación es incorrecto.',
            };
        }

        const nipsMatch = nip === associate.nip;

        if (!nipsMatch) {
            return {
                success: false,
                message: 'El NIP ingresado es incorrecto.',
            };
        }

        const updated = await updateValeStatusInDb(folio, 'FIRMADO');
        if (updated) {
            revalidatePath('/');
            revalidatePath(`/sign/${folio}`);
            revalidatePath('/vales');
            return { success: true, message: '¡Vale firmado exitosamente con doble verificación!' };
        }
        return { success: false, message: 'No se pudo actualizar el estado del vale.' };

    } catch (error) {
        console.error('Error during vale signing:', error);
        return { success: false, message: 'Ocurrió un error inesperado al firmar el vale.' };
    }
}

export async function verifyAssociateIdentity(data: { associateId: string, phoneE164: string }) {
    try {
        const user = await findUserByAssociateNumber(data.associateId);
        
        if (!user) {
            return { success: false, message: 'El número de asociada no fue encontrado.' };
        }
        
        const userPhone = user.phone.replace(/\D/g, '');
        const providedPhone = data.phoneE164.replace(/\D/g, '');

        if (userPhone !== providedPhone) {
            return { success: false, message: 'El número de teléfono no coincide con el registrado para esta asociada.' };
        }

        return { success: true, message: 'Identidad verificada exitosamente.' };

    } catch (error) {
        console.error('Error during identity verification:', error);
        return { success: false, message: 'Ocurrió un error inesperado al verificar la identidad.' };
    }
}


export async function cancelVale(prevState: any, formData: FormData) {
    const CancelValeSchema = z.object({
        folio: z.string().min(1, 'El folio es requerido.'),
        nip: z.string().min(4, 'El NIP debe tener al menos 4 dígitos.'),
    });

    const validatedFields = CancelValeSchema.safeParse({
        folio: formData.get('folio'),
        nip: formData.get('nip'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Datos inválidos.',
        };
    }

    const { folio, nip } = validatedFields.data;

    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }
    
    const associate = await findUserByAssociateNumber(session.user.associateNumber);
    if (!associate) {
        return { success: false, message: 'No se encontraron los datos de la asociada.' };
    }

    const vale = await findValeByFolio(folio);
    if (!vale || vale.associateNumber !== session.user.associateNumber) {
        return { success: false, message: 'No se pudo encontrar el vale para cancelar.' };
    }

    const deviceError = await requireDeviceAuthorization({
        associateNumber: session.user.associateNumber,
        operacion: 'CANCELAR_VALE',
        formData,
        folio,
    });
    if (deviceError) {
        return { success: false, message: deviceError };
    }

    const nipsMatch = nip === associate.nip;

    if (!nipsMatch) {
        return {
            success: false,
            message: 'El NIP ingresado es incorrecto.',
        };
    }

    try {
        const deleted = await deleteValeByFolio(folio);
        if (deleted) {
            revalidatePath('/');
            revalidatePath('/vales');
            revalidatePath(`/vales/${folio}`); 
            revalidatePath(`/sign/${folio}`);
            return { success: true, message: 'Vale cancelado exitosamente.' };
        }
        return { success: false, message: 'No se pudo encontrar el vale para cancelar.' };
    } catch (error) {
        console.error('Error cancelling vale:', error);
        return { success: false, message: 'Ocurrió un error al cancelar el vale.' };
    }
}


// ==================================================================
// --- Teléfono financiado y firma del dispositivo ---
// ==================================================================

const DEVICE_OPERATIONS: DeviceOperation[] = ['CREAR_VALE', 'FIRMAR_VALE', 'PRESTAMO_PERSONAL', 'CANCELAR_VALE'];

/**
 * Pide a la API un desafío de un solo uso para que la miniapp lo firme.
 * La asociada sale de la sesión; operación, folio y monto quedan amarrados al desafío.
 */
export async function requestDeviceChallenge(
    operacion: DeviceOperation,
    datos: { folio?: string; monto?: number } = {}
): Promise<{ ok: true; challenge: DeviceChallenge } | { ok: false; message: string }> {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { ok: false, message: 'No se pudo autenticar a la asociada.' };
    }
    if (!DEVICE_OPERATIONS.includes(operacion)) {
        return { ok: false, message: 'Operación no permitida.' };
    }
    const folio = typeof datos.folio === 'string' && datos.folio ? datos.folio : undefined;
    const monto = typeof datos.monto === 'number' && Number.isFinite(datos.monto) ? datos.monto : undefined;
    // El desafío queda amarrado al vale (firmar, cancelar) o al monto (crear).
    const needsFolio = operacion === 'FIRMAR_VALE' || operacion === 'CANCELAR_VALE';
    if (needsFolio ? !folio : monto === undefined || monto <= 0) {
        return { ok: false, message: 'Faltan datos de la operación para firmar con el equipo.' };
    }

    const issuance = await getIssuanceMode(session.user.associateNumber);
    if (issuance.mode === 'BLOQUEADA') return { ok: false, message: issuance.message };
    if (issuance.mode === 'LIBRE') return { ok: false, message: 'Esta operación no requiere firma del equipo.' };

    const result = await requestDeviceChallengeFromApi({ associateNumber: session.user.associateNumber, operacion, folio, monto });
    return result.ok ? { ok: true, challenge: result.challenge } : { ok: false, message: result.message };
}

export async function requestPhone(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }
    const associateNumber = session.user.associateNumber;

    // Se vuelve a evaluar: la oferta pudo cambiar desde que se cargó la página (p. ej. otra pestaña).
    const option = await getPhoneOfferOption(associateNumber);
    if (!option.available) {
        return { success: false, message: option.message };
    }

    const PhoneRequestSchema = z.object({
        quincenas: z.coerce.number().int().refine(
            (q) => option.offer.planes.some((plan) => plan.quincenas === q),
            'Elige un plan válido.'
        ),
        aceptoTerminos: z.literal('on', { errorMap: () => ({ message: 'Debes aceptar las condiciones.' }) }),
    });
    const validatedFields = PhoneRequestSchema.safeParse({
        quincenas: formData.get('quincenas'),
        aceptoTerminos: formData.get('aceptoTerminos'),
    });
    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Revisa el plan y acepta las condiciones.',
        };
    }

    const result = await createPhoneRequest({
        associateNumber,
        quincenas: validatedFields.data.quincenas,
        aceptoTerminos: true,
    });
    if (!result.ok) {
        return { success: false, message: result.message };
    }

    revalidatePath('/');
    revalidatePath('/vales/nuevo');
    return { success: true, message: 'Solicitud registrada.', folio: result.folio };
}

const REPORT_REASONS: DeviceReportReason[] = ['ROBO', 'PERDIDA', 'DANO', 'OTRO'];

export async function reportMyDevice(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }
    const motivo = formData.get('motivo');
    if (typeof motivo !== 'string' || !REPORT_REASONS.includes(motivo as DeviceReportReason)) {
        return { success: false, message: 'Elige el motivo del reporte.' };
    }

    const state = await getPhoneState(session.user.associateNumber);
    if (!state) {
        return { success: false, message: 'Servicio no disponible. Intenta más tarde o llama a soporte.' };
    }
    if (state.dispositivo?.estatus !== 'ACTIVO' && state.dispositivo?.estatus !== 'BLOQUEADO') {
        return { success: false, message: 'No tienes un equipo activo para reportar.' };
    }

    const result = await reportDevice({ associateNumber: session.user.associateNumber, motivo: motivo as DeviceReportReason });
    if (!result.ok) {
        return { success: false, message: result.message };
    }

    revalidatePath('/');
    revalidatePath('/perfil');
    revalidatePath('/vales/nuevo');
    return { success: true, message: 'Equipo reportado.' };
}

export async function getClientByCurp(curp: string) {
    const result = await findClientByCurp(curp);
    return result;
}

// ==================================================================
// --- Funciones para el flujo de Restablecimiento de NIP ---
// ==================================================================

/**
 * Busca a un usuario por número de asociada y fecha de nacimiento, y devuelve el teléfono ofuscado.
 * @param associateId - El número de asociada a buscar.
 * @param birthDate - La fecha de nacimiento del usuario en formato 'yyyy-MM-dd'.
 * @returns El número de teléfono ofuscado (ej. "+52******1234") o null si no se encuentra.
 */
export async function getMaskedPhoneForReset(associateId: string, birthDate: string): Promise<string | null> {
  console.log(`Buscando teléfono para asociada: ${associateId} con fecha de nacimiento: ${birthDate}`);
  
  // SIMULACIÓN: Devuelve siempre un número para pruebas de UI.
  // En un futuro, aquí se validaría la fecha de nacimiento contra la base de datos.
  //if (!associateId || !birthDate) {
    //  return null;
  //}
 // return '+52******5797';
  
  
  // --- LÓGICA REAL (COMENTADA PARA PRUEBAS) ---
  try {
    const user = await findUserByAssociateNumber(associateId);
    
    // Suponiendo que `user.birthDate` está en un formato comparable a 'yyyy-MM-dd'
    // Puede que necesites ajustar el formato de `user.birthDate` antes de comparar.
    if (user && user.phone && user.birthDate === birthDate) {
      const phoneString = user.phone.toString();

      if (phoneString.startsWith('+52') && phoneString.length === 13) {
          const lastFour = phoneString.slice(-4);
          const masked = `+52******${lastFour}`;
          console.log(`Teléfono encontrado y ofuscado: ${masked}`);
          return masked;
      } else {
          const phoneDigits = phoneString.replace(/\D/g, '');
          if (phoneDigits.length > 4) {
              const lastFour = phoneDigits.slice(-4);
              return `******${lastFour}`;
          }
          return '******';
      }
    }
    console.log(`No se encontró una cuenta para la asociada ${associateId} con esa fecha de nacimiento.`);
    return null;
  } catch (error) {
    console.error('Error en getMaskedPhoneForReset:', error);
    throw new Error('No se pudo verificar la información de la asociada.');
  }
  
}

/**
 * Genera y envía un código OTP para el restablecimiento del NIP.
 * @param associateId - El número de asociada que solicita el OTP.
 */
export async function requestNipResetOtp(associateId: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await findUserByAssociateNumber(associateId);
    if (!user || !user.phone) {
      // SIMULACIÓN: Finge éxito aunque no se encuentre el usuario para permitir pruebas de UI.
      console.log(`(Simulado) No se encontró usuario ${associateId}, pero se continúa para pruebas.`);
    } else {
       console.log(`(Simulado) Enviando OTP a ${user.phone}`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutos

    await sendValeOtp(associateId);
    
    console.log(`(Simulado) OTP para ${associateId} es: ${otp}`);

    return { success: true, message: 'Código OTP enviado.' };
  } catch (error) {
    console.error('Error en requestNipResetOtp:', error);
    return { success: false, message: 'No se pudo enviar el código OTP.' };
  }
}

export async function sendNipOtp(associateId?: string) {
    /*const session = await auth();
    if (!session?.user?.associateNumber) {
        return { success: false, message: 'No se pudo autenticar a la asociada.' };
    }*/
    const session = await auth();
    const idToSearch = associateId || session?.user?.associateNumber;
    
    if (!idToSearch) {
        return { success: false, message: 'No se pudo identificar a la asociada para el envío.' };
     }  
    
    /*const associate = await findUserByAssociateNumber(session.user.associateNumber);
    if (!associate?.phone || !associate.associateNumber || !associate.name) {
        return { success: false, message: 'Faltan datos críticos (teléfono, ID de préstamo o ID de usuario) de la asociada.' };
    }*/
    const associate = await findUserByAssociateNumber(idToSearch);

    if (!associate?.phone || !associate.name) {
        return { success: false, message: 'Faltan datos de contacto (teléfono o nombre) en la base de datos.' };
    }

    const requestBody = {
        ID_PRESTAMO: associate.associateNumber,
        ID_USUARIO: 1703,
        NO_CELULAR: associate.phone,
        NOMBRE_CLIENTE: associate.name
    };

    try {
        const response = await apiFetch(`sms/sendNIP`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`[API Response] SMS enviado y registrado. Mensaje: ${data.message}`);
            return { success: true, message: `Se ha enviado uel nuevo NIP a tu teléfono registrado.` };
        } else {
            console.error('API C# Error:', data.message || data.error);
            return { success: false, message: data.message || 'Error desconocido al solicitar el NIP.' };
        }

    } catch (error) {
        console.error('Failed to call C# API:', error);
        return { success: false, message: 'Ocurrió un error de red al contactar el servicio de verificación.' };
    }
}

/**
 * Verifica el OTP y, si es correcto, restablece el NIP del usuario.
 * @param associateId - El número de asociada.
 * @param otp - El código OTP ingresado por el usuario.
 */
export async function verifyOtpAndResetNip(associateId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    //const storedOtpData = await getStoredOtpForReset(associateId);

        const otpResponse = await apiFetch(`validarotp/${associateId}`);
        
        if (!otpResponse.ok) {
            const errorData = await otpResponse.json();
            return {
                success: false,
                message: errorData.message || 'Error al obtener el código de la BD. Intente reenviar el SMS.',
            };
        }

        const otpData = await otpResponse.json(); 
        const expectedOtp = otpData.codigo;

        if (otp !== expectedOtp) {
            return {
                success: false,
                message: 'El código de verificación es incorrecto.',
            };
        }

    /*if (!storedOtpData || storedOtpData.otp !== otp) {
      return { success: false, message: 'El código OTP es incorrecto.' };
    }*/

    /*if (new Date() > new Date(storedOtpData.expiresAt)) {
      return { success: false, message: 'El código OTP ha expirado.' };
    }*/
    
    //const newNip = Math.floor(1000 + Math.random() * 9000).toString();

    await sendNipOtp(associateId);
    
    /*const user = await findUserByAssociateNumber(associateId);
    if(user && user.phone){
        console.log(`(Simulado) Enviando nuevo NIP a ${user.phone}`);
    }*/

    return { success: true, message: 'NIP restablecido con éxito.' };
  } catch (error) {
    console.error('Error en verifyOtpAndResetNip:', error);
    return { success: false, message: 'Ocurrió un error al verificar el código.' };
  }
}
