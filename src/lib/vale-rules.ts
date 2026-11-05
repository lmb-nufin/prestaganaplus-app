// Montos y plazos de los vales a clientes, iguales a la app en producción.
// Sin dependencias de servidor: los usan el formulario y las server actions.
const MIN_AMOUNT = 5000;
const MAX_AMOUNT_NEW = 5500;
const MAX_AMOUNT_RENEWED = 9000;
const AMOUNT_STEP = 500;

export const VALE_INSTALLMENTS = [8, 10, 12];

export const valeAmounts = (isRenewed: boolean) => {
  const max = isRenewed ? MAX_AMOUNT_RENEWED : MAX_AMOUNT_NEW;
  return Array.from({ length: (max - MIN_AMOUNT) / AMOUNT_STEP + 1 }, (_, i) => MIN_AMOUNT + i * AMOUNT_STEP);
};
