# Especificación: rediseño visual del Dashboard ("dirección medidor")

**Rama:** `feature/dashboard-medidor`, creada desde `feature/telefono-financiado`. PR hacia `feature/telefono-financiado`, sin merge.

Solo presentación: misma funcionalidad, mismos datos, mismas reglas.

## Alcance

- Archivos: `src/components/distributor-dashboard.tsx` y `src/components/phone-tracker.tsx`, más un componente pequeño para el medidor si conviene.
- **No tocar:** `header.tsx`, `bottom-nav-bar.tsx`, `globals.css`/tokens, server actions, `demo-api`, tipos, textos de negocio, reglas de mora/pausa, `PaymentOptionsDialog` (solo su trigger si hace falta para el estilo, sin cambiar comportamiento).
- Se conservan todos los `data-testid`: `payment-status`, `collection-breakdown`, `phone-mora-*`, `line-new-vale-paused`, `phone-tracker`, `phone-tracker-toggle`, `phone-tracker-summary`, `phone-tracker-step`, `phone-tracker-todo`, `phone-tracker-current`, `phone-tracker-details`, `phone-reported`, `phone-tracker-cancelled`, `associate-info-toggle`, `associate-info-details`, `associate-level`, `issuance-paused`. Si uno cambia de elemento, va al elemento equivalente. Una prueba solo se ajusta si cambió el selector y el comportamiento es el mismo.

## Estilo general (solo dentro del dashboard)

- Tarjetas: `bg-white`, `rounded-[20px]`, `border border-[#EEEEF2]`, sin sombra, `p-[18px]`. Separación `gap-3.5`.
- Títulos de tarjeta: `font-headline text-[15px] font-semibold`, sin íconos (salvo Mi Teléfono, que conserva el Smartphone indigo).
- Botones principales: 50px de alto, `rounded-[14px]`, ancho completo, `font-headline font-semibold text-[15px]`.
- Montos con `tabular-nums`.

## Orden

1. Saludo · 2. Alerta de emisión en pausa (si aplica) · 3. Línea PrestaGana · 4. Situación Actual · 5. Mi Teléfono PrestaGana (si aplica) · 6. Lista: Relación de Cobro + Datos de la Asociada.

## 1. Saludo

- Fila `justify-between items-end`.
- Izquierda: "Qué bueno verte de nuevo," (`text-sm text-muted-foreground`) y abajo el primer nombre en `font-headline text-2xl font-semibold tracking-tight`.
- Derecha: pastilla de nivel (Star 13px + "Nivel {Senior|Junior}", `text-xs font-bold text-[#8E2A43] bg-[#FCEFF2] rounded-full px-3 py-1.5`) con `data-testid="associate-level"`. Sin nivel, no se muestra. Se quita el badge de Datos de la Asociada.

## 2. Alerta de pausa

Igual (Alert destructive con `issuancePause`).

## 3. Línea PrestaGana

- Título "Línea PrestaGana". Debajo, fila `gap-[18px]`: medidor circular SVG 128x128 a la izquierda, montos a la derecha.
- Medidor: círculo r=52, stroke 12; pista `#F6E3E8`; avance en `hsl(var(--primary))`, `stroke-linecap round`, arranca arriba (rotate -90). Porcentaje = placed/limit·100, acotado a 0–100 y redondeado (limit 0 → 0%). Al centro el porcentaje (`font-headline text-2xl font-bold text-[#9E2F4B]`) y "colocado" (`text-[11px] text-muted-foreground`). `role="img"`, `aria-label="{n}% de la línea colocada"`. Reemplaza el Progress.
- Derecha, columna `gap-2.5`: "Disponible" con monto `font-headline text-xl font-bold` (`text-destructive` si available < 3000); fila punto primary + "Colocado" + monto `font-bold text-[#9E2F4B]`; fila punto `#F6E3E8` con anillo `#E8C9D1` + "Límite" + monto `font-bold`.
- Vale Nuevo abajo, ancho completo (`mt-4`, 50px, `rounded-[14px]`, `bg-primary text-primary-foreground`, ícono Plus).
- En pausa: `bg-muted text-muted-foreground`, ícono Lock, "Vale Nuevo en pausa", `aria-disabled`, mismo toast, `data-testid="line-new-vale-paused"`.

## 4. Situación Actual

- Fondo blanco; el tono se ve en la pastilla y el monto.
- Grid 2 columnas `gap-2.5`; celdas `bg-[#F7F7F9] rounded-2xl px-3.5 py-3`, alineadas a la izquierda:
  - "Estatus" y pastilla `rounded-full px-2.5 py-1 text-xs font-bold` con punto de 6px: ok → `bg-green-50 text-green-800` · warning → `bg-amber-50 text-amber-800` · late → `bg-red-50 text-red-700`. `statusLabel`/tono sin cambios. `payment-status` en el texto de la pastilla.
  - "Monto a Pagar" con monto `font-headline text-xl font-bold`; `text-red-800` solo si tono = late.
- Desglose (`collection-breakdown`) sin caja: filas `text-[13px] justify-between`, `mt-3 gap-1.5`.
- Aviso de mora igual en contenido y colores, `rounded-[14px] mt-3`.
- Pagar Ahora: con mora dentro del aviso; sin mora abajo. Trigger de ancho completo, 50px, `rounded-[14px]`, `bg-[#2F8F3E] hover:bg-[#287A35] text-white`, ícono CreditCard. Sin CardFooter con border-t.

## 5. Mi Teléfono PrestaGana

- Misma lógica de qué se muestra.
- Encabezado: Smartphone indigo + título; a la derecha (`text-xs muted`) "Folio {folio}" si existe, si no "Paso X de 5" (`phone-tracker-step` donde aparezca el paso).
- Siempre visible un stepper horizontal de 5 pasos que reemplaza el StepBar: línea gris `#E5E7EB` de 2px entre centros del paso 1 y 5, tramo completado en indigo-600; círculos de 24px (completado indigo-600 con Check · actual blanco con anillo indigo-600 de 2px y número indigo · pendiente blanco con anillo gris y número gris); etiquetas `text-[11px]` centradas: Solicitado · Enganche · Preparación · Recoger · Activo; la actual en `font-bold text-indigo-900`, `aria-current="step"`, `data-testid="phone-tracker-current"`. Reportado/revocado: completado en `destructive/60`. Cancelado: sin stepper.
- Pastilla de etapa (`phone-tracker-summary`) arriba del stepper, igual.
- "Qué sigue" igual en texto y colores, `rounded-[14px] mt-3.5`.
- Colapsable solo con lo secundario: modelo, IMEI terminación y folio si no está arriba. Se elimina la lista vertical de pasos. `phone-tracker-toggle` (chevron a la derecha del encabezado) y `phone-tracker-details`.

## 6. Lista: Relación de Cobro + Datos de la Asociada

- Una tarjeta (`overflow-hidden`, sin padding), dos filas `min-h-[60px] px-4` separadas por línea 1px `#F0F0F3` con `ml-16`.
- Fila 1: FileText en cuadro 36px `rounded-[10px] bg-[#F2F2F5]`; "Relación de Cobro" (`text-[15px] font-bold`), "Descarga el resumen de tus movimientos" (`text-xs muted`); a la derecha "Descargar" + Download (`text-[13px] font-bold text-[#9E2F4B]`). Toda la fila es el `<a>` a `latestCollectionReportUrl` (`target _blank`, `rel noopener`).
- Fila 2: User en cuadro 36px `bg-[#FCEFF2] text-[#8E2A43]`; "Datos de la Asociada" y el nombre completo; ChevronDown que gira. Es el CollapsibleTrigger (`associate-info-toggle`), colapsado por default. Abre el mismo grid de 4 datos (`associate-info-details`), `px-4 pb-4 pl-16`.

## Skeleton

`DistributorDashboardSkeleton` con el nuevo orden: saludo, línea ~250px, situación ~170px, lista ~120px.

## Accesibilidad

Áreas táctiles ≥ 44px, foco visible en trigger y botones, medidor con `aria-label`.

## Entrega

- Capturas a 390px en `docs/img/dashboard-medidor/` de 1000001, 1000002, 1000009, 1000011, 1000012, 1000013 y 1000017, más 1000001 con Datos abierto y 1000011 con el teléfono expandido.
- Resumen: archivos tocados, pruebas ajustadas, typecheck, Playwright y veredicto del revisor.

## Decisiones de implementación

- **`phone-tracker-step` con folio en el encabezado:** cuando el encabezado muestra el folio, el texto "Paso X de 5" queda como texto solo para lector de pantalla junto al stepper (los círculos son visuales), con el mismo `data-testid`.
- **`phone-tracker-toggle`** es la fila del encabezado; la pastilla y el stepper quedan fuera del botón porque siempre están visibles.
- **Pagar Ahora:** `PaymentOptionsDialog` recibe una prop opcional `prominent` que solo cambia el estilo y el ícono del trigger; el diálogo no cambia.
- **Mi Teléfono sin equipo:** antes de recoger el equipo no hay modelo ni IMEI, y el folio ya está en el encabezado, así que no hay nada que desplegar: el encabezado se muestra sin chevron y sin `phone-tracker-toggle`. El helper de pruebas `openPhoneTracker` no hace nada en ese caso.
