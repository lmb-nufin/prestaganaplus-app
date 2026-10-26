import 'server-only';

import { addMonths } from 'date-fns';
import { getAssociateDashboard, getPersonalLoanInfo, getVales } from './data';
import type { PersonalLoanEligibility } from './types';

// Mismos montos que cliente existente: de $5,000 a $9,000 en saltos de $500.
export const PERSONAL_LOAN_AMOUNTS = Array.from({ length: (9000 - 5000) / 500 + 1 }, (_, i) => 5000 + i * 500);
export const PERSONAL_LOAN_INSTALLMENTS = [8, 10, 12, 14];
export const PERSONAL_LOAN_MIN_MONTHS = 3;

// "Al Día", "Al día" y "AL DIA" cuentan igual; cualquier otro valor bloquea.
const normalizeStatus = (status: unknown) =>
  typeof status === 'string'
    ? status.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
    : '';

/**
 * Evalúa si la asociada puede sacar un préstamo personal.
 * Es solo para la UX: la API debe volver a validar todo al crear el vale.
 * Fail-closed: si algún servicio no responde, la asociada no es elegible.
 */
export async function getPersonalLoanEligibility(associateNumber: string): Promise<PersonalLoanEligibility> {
  const [dashboard, info, vales] = await Promise.all([
    getAssociateDashboard(associateNumber),
    getPersonalLoanInfo(associateNumber),
    getVales(associateNumber),
  ]);

  if (!dashboard?.paymentStatus || !dashboard?.associateInfo || !info?.cliente) {
    return {
      eligible: false,
      reason: 'NO_DISPONIBLE',
      message: 'Servicio no disponible. Intenta más tarde.',
    };
  }

  if (normalizeStatus(dashboard.paymentStatus.status) !== 'al dia') {
    return {
      eligible: false,
      reason: 'ATRASADA',
      message: 'Para solicitar un préstamo personal necesitas estar al día en tus pagos.',
    };
  }

  const activationDate = new Date(dashboard.associateInfo.activationDate);
  if (isNaN(activationDate.getTime()) || addMonths(activationDate, PERSONAL_LOAN_MIN_MONTHS) > new Date()) {
    return {
      eligible: false,
      reason: 'ANTIGUEDAD',
      message: `Podrás solicitar un préstamo personal al cumplir ${PERSONAL_LOAN_MIN_MONTHS} meses como asociada.`,
    };
  }

  const activeVale = vales.find(
    (v) => v.tipoVale === 'PERSONAL' && (v.status === 'PENDIENTE' || v.status === 'FIRMADO')
  );
  if (info.prestamoActivo || activeVale) {
    return {
      eligible: false,
      reason: 'ACTIVO',
      message: 'Ya tienes un préstamo personal activo.',
      folioActivo: info.folioActivo ?? activeVale?.folio ?? null,
    };
  }

  return { eligible: true, cliente: info.cliente };
}
