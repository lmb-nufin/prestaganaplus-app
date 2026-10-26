# Especificación: Préstamo Personal para asociadas (PrestaGana+)

**Objetivo:** que la asociada pueda generar un vale de préstamo personal a su nombre. El flujo es igual al de cliente existente, pero en una sección visualmente distinta.

## Reglas de negocio

1. **Montos:** de $5,000 a $9,000 en saltos de $500, igual que cliente existente (actualizado a los montos de producción). **Plazos:** 8, 10, 12 y 14 quincenas.
2. **No sale de su línea de crédito.** No descuenta `available` ni suma a `placed`.
3. **Solo un préstamo personal activo a la vez.** Un vale personal en proceso (`PENDIENTE` o `FIRMADO`) o con saldo bloquea uno nuevo.
4. **Elegibilidad:** `paymentStatus.status === "Al Día"` y al menos 3 meses desde `activationDate`.
5. **Cobranza:** se cobra igual que los demás, en su relación de cobro y a su nombre.
6. **Firma:** la misma que hoy, con OTP + NIP. El vale digital y el WhatsApp se mandan a su propio teléfono.

## Cambios en la API .NET (backend)

- Nuevo `GET prestamoPersonal/{associateNumber}`, que responde:

  ```json
  { "cliente": { "curp": "...", "firstName": "...", "lastNameP": "...", "lastNameM": "...",
                 "birthDate": "1990-01-15", "phone": "+52...", "id_cliente": "..." },
    "prestamoActivo": false, "folioActivo": null }
  ```

- `POST vales` acepta `tipoVale: "PERSONAL" | "CLIENTE"` (default `CLIENTE`). Con `PERSONAL`, la API debe validar en el servidor la regla 3, la regla 4 y el monto y plazo permitidos, y responder 4xx con mensaje si alguno falla. Tampoco descuenta la línea.
- `GET valesDashboard/{n}` y `GET vales/{folio}` regresan `tipoVale`.
- `dashboardData` no cuenta los vales personales en `creditLine.placed`.

## Cambios en la app (Next.js)

- `src/lib/types.ts`: agregar `tipoVale?: 'CLIENTE' | 'PERSONAL'` a `Vale`, y los tipos de la respuesta de `prestamoPersonal`.
- `src/lib/data.ts`: agregar `getPersonalLoanInfo(associateNumber)` contra `GET prestamoPersonal/{n}`, con `cache: 'no-store'`. Si la API falla, regresa `null`.
- Nuevo `src/lib/personal-loan.ts`, que solo corre en el servidor:
  - Constantes de montos y plazos.
  - `getPersonalLoanEligibility(associateNumber)`, que combina `getAssociateDashboard` (estatus y antigüedad), `getPersonalLoanInfo` (`prestamoActivo`) y `getVales` (cualquier vale `PERSONAL` en `PENDIENTE` o `FIRMADO`).
  - Fail-closed: si la API no responde, no es elegible y muestra el mensaje "Servicio no disponible".
- `src/app/actions.ts`, nueva acción `createPersonalLoanVale`:
  - Valida la sesión y vuelve a evaluar la elegibilidad.
  - Valida que monto y plazo estén en las listas permitidas.
  - Toma nombre, fecha de nacimiento, teléfono e `id_cliente` de la API, nunca del formulario.
  - Hace `POST vales` con `tipoVale: "PERSONAL"` y los mismos datos de auditoría (dispositivo y GPS), y regresa el folio.
- **Ubicación: dentro de Vale Nuevo** (`/vales/nuevo`), no en el dashboard ni en el menú:
  - `src/app/vales/nuevo/page.tsx` es un server component que obtiene la sesión y llama a `getPersonalLoanEligibility`. El flujo de pasos (`choice`, `curp_input`, `form`, `personal`) vive en el client component `new-vale-flow.tsx`, que recibe solo el estado de elegibilidad y el nombre de la asociada.
  - `new-or-renewed-choice.tsx` tiene una tercera opción "Préstamo Personal" (índigo, ícono HandCoins, "Préstamo a tu nombre, no usa tu línea").
  - Si es elegible, el paso `personal` muestra el encabezado índigo "Préstamo Personal" ("Un préstamo a tu nombre que no usa tu línea de crédito."), los selects de monto y plazo, el botón Confirmar y un botón "Volver" a la elección. No muestra nombre, fecha de nacimiento ni teléfono.
  - El diálogo de confirmación dice: "Préstamo personal de $X a N quincenas a nombre de NOMBRE. Se cobrará en tu relación de cobro y no usa tu línea de crédito."
  - Si no es elegible, la opción aparece deshabilitada con el motivo: "Necesitas estar al día", "Disponible al cumplir 3 meses", "Ya tienes un préstamo activo" (con liga al folio) o "Servicio no disponible".
  - Al confirmar, `createPersonalLoanVale` vuelve a validar en el servidor y redirige a `/sign/{folio}`.
  - Los botones "Vale Nuevo" de la barra inferior y de la tarjeta "Línea PrestaGana" siguen llevando a `/vales/nuevo`.
- **Validación de la respuesta:** `getPersonalLoanInfo` acepta un wrapper `data` opcional y exige el cliente completo y `typeof prestamoActivo === 'boolean'`; si no, regresa `null` (servicio no disponible).
- **Estatus normalizado:** "Al Día", "Al día" y "AL DIA" cuentan igual (minúsculas, sin acentos); cualquier otro valor bloquea.
- **Lista de vales y detalle:** badge "Personal" en `vales-dashboard.tsx` y `sign-page-content.tsx`. En `digital-vale.tsx`, para el tipo `PERSONAL`, cambiar el texto del WhatsApp ("Tu préstamo personal PrestaGana+…"); el teléfono ya es el de ella.
- **Corregir de paso el corrimiento de fechas:** crear un helper `parseDateOnly()` que arme la fecha local a partir de `YYYY-MM-DD`. Usarlo en lugar de `new Date(birthDate)` en `sign-page-content.tsx` y `vale-creation-form.tsx`. Sin esto, en México las fechas se muestran y se envían con un día menos.

## Pruebas mínimas

- Asociada elegible: crea el préstamo, firma con OTP + NIP y el préstamo aparece en la lista con badge "Personal". Su línea disponible no cambia.
- Con uno `PENDIENTE` o `FIRMADO`, el segundo queda bloqueado en la UI y en la acción del servidor (prueba con dos pestañas).
- Asociada "Atrasada" o con menos de 3 meses: bloqueada, con el motivo visible.
- Un monto fuera de rango enviado a mano al server action se rechaza.
- API caída: la sección dice "no disponible" y no truena.
- Sin regresiones en los vales de cliente nuevo y existente.

## Riesgos

1. La regla de uno activo y la elegibilidad tienen que vivir en la API .NET. Lo que haga la app es solo UX; sin la validación en el backend, se pueden sacar dos préstamos.
2. Hasta que exista `GET prestamoPersonal`, la sección debe quedar bloqueada (fail-closed), no abierta.
3. Hay que revisar con legal el contrato o pagaré del préstamo a la asociada antes de salir a producción.
