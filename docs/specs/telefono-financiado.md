# Especificación: Teléfono financiado (Samsung Galaxy A17 4G 128GB) — Fase 1 web app

**Rama:** `feature/telefono-financiado`, creada desde `feature/prestamo-personal`.

## 0. Preparación

1. Revisor de solo lectura en `.claude/agents/revisor-prestagana.md` (diff vs spec, typecheck sin errores nuevos vs main, build, pruebas Playwright en DEMO_MODE con viewport 390x844 y timezone America/Mexico_City, regresiones; salida PASS/FAIL con evidencia e instrucciones) y sección "Forma de trabajo" en `CLAUDE.md`.
2. Esta especificación en `docs/specs/telefono-financiado.md`.
3. `src/lib/api.ts`: si falta `API_BASE_URL` y `DEMO_MODE` no es `true`, en producción (`VERCEL_ENV === 'production'` o `NODE_ENV === 'production'`) lanza un error claro en vez de caer en modo demo. En desarrollo sí cae a demo con un warning, que se registra una sola vez.

## 1. Producto

Oferta voluntaria y alternativa al préstamo personal: un Samsung Galaxy A17 4G 128GB financiado como herramienta de trabajo.

- Enganche obligatorio (5% o lo que diga Riesgo). Plazo de 12 o 18 quincenas.
- Para quien lo tenga activo, los vales solo se emiten desde la miniapp Android de ese equipo. La miniapp es Fase 2; aquí se construye el lado web y el contrato con ella.
- Precio, enganche, pago quincenal y total a pagar vienen de la API, **nunca** hardcodeados (el precio está en revisión por Finanzas).

## 2. Decisiones por default (pendientes de validar)

- **D1.** La restricción de emisión aplica solo a asociadas con dispositivo en estado `ACTIVO` o `BLOQUEADO`.
- **D2.** En la miniapp, la firma del vale = OTP + NIP actuales + firma del equipo. Se agrega, no reemplaza al OTP; quitar el SMS es decisión posterior.
- **D3.** La restricción sigue mientras la API diga `emisionRestringida: true`; la app no la infiere al liquidar.
- **D4.** Los bloqueos Knox quedan fuera de alcance de la web; solo se muestran avisos de mora del teléfono.

## 3. Contrato de API

Se documenta en `docs/api-contracts.md` y se simula en `src/lib/demo-api.ts`.

- `GET telefono/oferta/{asociada}` → `{ elegible, motivo?, modelo: { nombre, almacenamiento, imagenUrl }, precio, engancheMonto, planes: [{ quincenas, pagoQuincenal, totalPagar }] }`
- `POST telefono/solicitudes`, body `{ associateNumber, quincenas, aceptoTerminos: true }` → `{ folio, estatus }`. Valida en servidor: elegible, plan permitido, sin otra solicitud abierta ni equipo activo.
- `GET telefono/estado/{asociada}` → `{ solicitud?: { folio, estatus: SOLICITADO | ENGANCHE_CONFIRMADO | EN_PREPARACION | LISTO_PARA_RECOGER | ACTIVO | CANCELADO, fecha }, dispositivo?: { estatus: ACTIVO | BLOQUEADO | REPORTADO | REVOCADO, modelo, ultimos4Imei }, emisionRestringida, cuotas?: { actual, total, pagoQuincenal, saldo }, mora?: { dias, monto, nivel: AVISO | GRACIA | BLOQUEO } }`
- `POST dispositivo/desafio`, body `{ associateNumber, operacion: CREAR_VALE | FIRMAR_VALE | PRESTAMO_PERSONAL, folio?, monto? }` → `{ challengeId, challenge, expiraEn }`. Un solo uso, ligado a sesión, operación y monto.
- `POST dispositivo/verificar`, body `{ challengeId, firma, deviceId }` → `{ valido, motivo? }`
- `POST dispositivo/reporte`, body `{ associateNumber, motivo: ROBO | PERDIDA | DANO | OTRO }` → bloquea la emisión.
- `dashboardData` agrega `telefono?: { pagoQuincenal, cuotaActual, totalCuotas, saldo }` para el desglose.

**Datos demo** (OTP 123456, NIP 1234): elegible sin solicitud · con solicitud en cada estatus · con dispositivo ACTIVO · con dispositivo REPORTADO · con mora nivel AVISO y GRACIA · no elegible · servicio caído (fail-closed). Se documentan en `.env.example`.

## 4. Experiencia (web)

1. **Oferta dentro de Préstamo Personal.** En Vale Nuevo → "Préstamo Personal" se muestran dos opciones: **Efectivo** (el flujo actual) y **Samsung Galaxy A17** (tarjeta con imagen, precio y enganche). Si no es elegible o ya tiene solicitud o equipo, la opción se deshabilita con el motivo.
2. **Pantalla de oferta:** una sola tarjeta de producto; comparativo de 2 columnas (12 vs 18 quincenas: pago quincenal y total a pagar); enganche destacado; recuadro: "Con este equipo tus vales solo se emiten desde él. Consultar saldo, pagar y soporte funcionan desde cualquier dispositivo."; reglas de mora en lenguaje simple; checkbox de aceptación y botón "Solicitar". La server action valida todo de nuevo y llama `POST telefono/solicitudes`. Confirmación: "Acude a tu sucursal a pagar el enganche y firmar".
3. **Tracker en el dashboard** (tarjeta solo si hay solicitud o equipo): Solicitado → Enganche confirmado → En preparación → Listo para recoger → Activo, con el paso actual resaltado y qué hacer.
4. **Desglose de cobranza:** en "Situación Actual", el Monto a Pagar se desglosa en Vales y Teléfono (cuota X de Y, saldo). Con mora del teléfono, aviso escalonado (AVISO/GRACIA) con monto y botón Pagar. Pagar y soporte nunca se bloquean.
5. **Emisión restringida** (cuando `emisionRestringida`):
   - Fuera de la miniapp, el botón Vale Nuevo sigue visible pero abre un aviso "Por seguridad, tus vales se emiten desde tu Samsung PrestaGana", sin formulario. Lo mismo al intentar firmar un vale.
   - Dentro de la miniapp, flujo normal: antes de crear, firmar o crear un préstamo personal se pide un desafío, se firma vía bridge y se verifica.
   - **Enforcement en servidor:** `createVale`, `createPersonalLoanVale`, `signValeWithOtp` y `cancelVale` consultan `getPhoneState` y, si hay restricción, exigen `challengeId` + `firma` + `deviceId` válidos vía `dispositivo/verificar`. Sin eso, rechazo. Ocultar botones no cuenta.
   - Dispositivo REPORTADO o REVOCADO: emisión bloqueada con el mensaje "Acude a sucursal para reactivar".
6. **Reportar mi equipo:** en Perfil, botón "Reportar mi equipo" (robo, pérdida, daño) con confirmación; llama `POST dispositivo/reporte` y muestra los siguientes pasos.

## 5. Contrato con la miniapp (Fase 2)

- Bridge JS inyectado por la miniapp: `window.PrestaGanaDevice = { getDeviceId(): Promise<string>, signChallenge(challenge: string): Promise<string> }`. Detección solo por el bridge, nunca por user agent.
- Hook `useDeviceBridge()` y helper `withDeviceSignature(operacion, datos)`.
- En DEMO_MODE, con `?demoDevice=1` se instala un bridge simulado (firma = `"demo-" + challenge`) y la verificación demo la acepta; sin el parámetro se comporta como Chrome normal. El bridge simulado nunca debe existir fuera de DEMO_MODE.
- El contrato se documenta en `docs/specs/miniapp-bridge.md` para el equipo Android.

## 6. Pruebas obligatorias (Playwright, DEMO_MODE)

Oferta visible o deshabilitada según elegibilidad · comparativo con datos de la API · la solicitud crea folio y aparece el tracker · no permite una segunda solicitud (incluye 2 pestañas) · cada estatus del tracker · desglose de cobranza y avisos de mora · emisión restringida: desde "Chrome" no crea ni firma vale ni préstamo personal (en la UI y llamando la server action directo) · con `?demoDevice=1` sí puede · dispositivo REPORTADO bloqueado · el reporte de equipo funciona · pagos y soporte siempre disponibles · servicio caído = fail-closed · regresiones: vale de cliente nuevo y existente, préstamo personal en efectivo, firma OTP + NIP, fechas correctas.

## 7. Entrega

- Ciclo con `revisor-prestagana` hasta PASS (máximo 4 rondas; si no llega, detenerse y reportar).
- Push de la rama y PR hacia `main`, sin merge. Descripción: resumen, capturas de las pantallas nuevas, reporte final del revisor, decisiones D1–D4, contrato de API y lo que falta para Fase 2 (miniapp Android, Keystore/atestación, Play Integrity, endpoints .NET).
- Recordatorio en el PR: el merge requiere `DEMO_MODE=true` y `AUTH_SECRET` en Vercel.

## Decisiones de implementación (agregadas al implementar)

- **Estado del teléfono no disponible = emisión bloqueada.** Si `GET telefono/estado` falla, las server actions de emisión rechazan con "Servicio no disponible" en lugar de suponer que no hay restricción. Pendiente de validar: afecta a todas las asociadas cuando el servicio cae.
- **Cancelar un vale también exige firma del equipo** con la operación `CANCELAR_VALE` (extensión del enum de `dispositivo/desafio`).
- **Amarre del desafío.** Al verificar, la app manda además `associateNumber`, `operacion`, `folio` y `monto` para que la API confirme que el desafío es de esa operación (extensión del body de `dispositivo/verificar`).
- **Desglose:** Vales = `paymentStatus.amountDue − telefono.pagoQuincenal` (se asume que `amountDue` ya incluye la cuota del teléfono).
- **Propiedad del vale:** firmar y cancelar validan que el folio sea de la asociada en sesión.
