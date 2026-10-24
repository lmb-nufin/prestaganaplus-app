import 'server-only';

import { getPhoneOffer, getPhoneState, verifyDeviceSignature } from './data';
import type { DeviceOperation, IssuanceMode, PhoneOfferOption, PhoneState } from './types';

export const DEVICE_ONLY_MESSAGE = 'Por seguridad, tus vales se emiten desde tu Samsung PrestaGana.';
export const DEVICE_REPORTED_MESSAGE = 'Tu equipo está reportado. Acude a sucursal para reactivar.';
export const PHONE_SERVICE_DOWN_MESSAGE = 'Servicio no disponible. Intenta más tarde.';

/**
 * Cómo puede emitir vales la asociada, según la API.
 * D1: la restricción aplica solo con el equipo ACTIVO o BLOQUEADO.
 * D3: dura mientras la API diga emisionRestringida; la app no la infiere.
 * Fail-closed: si no se puede leer el estado, no se emite.
 */
export function issuanceModeFor(state: PhoneState | null): IssuanceMode {
  if (!state) return { mode: 'BLOQUEADA', message: PHONE_SERVICE_DOWN_MESSAGE };
  const estatus = state.dispositivo?.estatus;
  if (estatus === 'REPORTADO' || estatus === 'REVOCADO') {
    return { mode: 'BLOQUEADA', message: DEVICE_REPORTED_MESSAGE };
  }
  if (state.emisionRestringida && (estatus === 'ACTIVO' || estatus === 'BLOQUEADO')) {
    return { mode: 'EQUIPO' };
  }
  return { mode: 'LIBRE' };
}

export async function getIssuanceMode(associateNumber: string): Promise<IssuanceMode> {
  return issuanceModeFor(await getPhoneState(associateNumber));
}

const readField = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/**
 * Enforcement en servidor para crear, firmar o cancelar vales y préstamos personales.
 * Regresa null si la operación puede seguir, o el mensaje de rechazo.
 */
export async function requireDeviceAuthorization(params: {
  associateNumber: string;
  operacion: DeviceOperation;
  formData: FormData;
  folio?: string;
  monto?: number;
}): Promise<string | null> {
  const issuance = await getIssuanceMode(params.associateNumber);
  if (issuance.mode === 'LIBRE') return null;
  if (issuance.mode === 'BLOQUEADA') return issuance.message;

  const challengeId = readField(params.formData, 'challengeId');
  const firma = readField(params.formData, 'firma');
  const deviceId = readField(params.formData, 'deviceSignatureId');
  if (!challengeId || !firma || !deviceId) return DEVICE_ONLY_MESSAGE;

  const result = await verifyDeviceSignature({
    challengeId,
    firma,
    deviceId,
    associateNumber: params.associateNumber,
    operacion: params.operacion,
    folio: params.folio,
    monto: params.monto,
  });
  if (!result.valido) {
    console.warn(`[DEVICE] Firma rechazada para ${params.associateNumber} (${params.operacion}): ${result.motivo ?? 'sin motivo'}`);
    return 'No pudimos verificar tu equipo. Intenta de nuevo desde tu Samsung PrestaGana.';
  }
  return null;
}

/** Estado de la oferta del teléfono para la UI. Fail-closed si la API no responde. */
export async function getPhoneOfferOption(associateNumber: string): Promise<PhoneOfferOption> {
  const [offer, state] = await Promise.all([getPhoneOffer(associateNumber), getPhoneState(associateNumber)]);
  if (!offer || !state) {
    return { available: false, reason: 'NO_DISPONIBLE', message: PHONE_SERVICE_DOWN_MESSAGE };
  }
  const { elegible, motivo, ...summary } = offer;

  if (state.dispositivo) {
    return { available: false, reason: 'EQUIPO', message: 'Ya tienes tu equipo PrestaGana.', offer: summary };
  }
  if (state.solicitud && state.solicitud.estatus !== 'CANCELADO') {
    return {
      available: false,
      reason: 'SOLICITUD_ABIERTA',
      message: 'Ya tienes una solicitud de equipo en proceso.',
      folio: state.solicitud.folio,
      offer: summary,
    };
  }
  if (!elegible) {
    return { available: false, reason: 'NO_ELEGIBLE', message: motivo ?? 'Por ahora no tienes esta oferta disponible.', offer: summary };
  }
  return { available: true, offer: summary };
}
