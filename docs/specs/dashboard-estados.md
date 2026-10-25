# Dashboard — correcciones + colapsar "Datos de la Asociada"

Base: `feature/telefono-financiado` (fdc2171). Rama: `fix/dashboard-estados`. PR hacia `feature/telefono-financiado`, sin merge.

**No se cambia el diseño actual** (colores, tarjetas, orden, textos, tamaños). Solo lo que se lista abajo.

## 1. Bug: después del login la URL se queda en `/login`
- Hoy: tras iniciar sesión se ve el dashboard, pero la URL sigue en `/login`. El header lo toma como subpágina y muestra la flecha de regreso en lugar de la campana de notificaciones.
- Esperado: al iniciar sesión la URL termina en `callbackUrl` (si es una ruta interna válida) o en `/`. La campana con su contador aparece en el dashboard desde el primer render.
- Revisar `authenticate` en `src/app/actions.ts`, el `LoginForm` e `isSubPage` en `header.tsx`.
- Prueba e2e: login → URL `/` → la campana es visible y no hay flecha de regreso.

## 2. Teléfono reportado o revocado: el dashboard no avisa nada
Asociada demo 1000012. Cuando el dispositivo esté en REPORTADO o REVOCADO (o el modo de emisión sea BLOQUEADA):
- Aviso arriba de la tarjeta "Línea PrestaGana", con el estilo de alertas de la app: **"Emisión de vales en pausa.** Reportaste tu Teléfono PrestaGana. Acude a tu sucursal para reactivarlo." Para REVOCADO, el texto equivalente.
- El botón "Vale Nuevo" de la tarjeta Línea y el botón central de la barra inferior se ven deshabilitados (gris, `aria-disabled`). Al tocarlos se muestra el mismo mensaje y no se navega.
- En "Mi Teléfono PrestaGana", el "Qué sigue" cambia a: "Equipo reportado. No puedes emitir vales desde este equipo hasta reactivarlo en sucursal."
- El bloqueo real en el servidor ya existe: no se cambia, solo se verifica que siga funcionando.

## 3. Pago vencido con teléfono: el estatus se contradice
Asociada demo 1000013.
- Hoy: el estatus dice "Al Día" (verde) mientras el aviso dice "Pago del equipo pendiente · Debes $320 del equipo".
- Esperado:
  - El estatus refleja la mora: "Pago vencido" (o "Atrasada" según el nivel), nunca "Al Día" si hay `mora`. Estatus y monto en ámbar o rojo, no en verde.
  - El aviso no presenta el teléfono como deuda aparte (la cuota va dentro de la línea): "Tienes un pago vencido de {mora.monto} ({mora.dias} días). Págalo para evitar el bloqueo de tu Teléfono PrestaGana."
  - Un solo botón "Pagar Ahora" y el desglose Vales / Teléfono / Saldo del equipo se mantienen.
- Los montos salen de la API, nada hardcodeado.

## 4. Colapsar la tarjeta "Datos de la Asociada"
- Por default **colapsada**: una fila con el título "Datos de la Asociada", el nombre debajo y un chevron a la derecha.
- Al tocarla se expande y muestra lo de hoy: No. Asociada, Sucursal, Fecha de Alta y Colocación Promedio.
- `Collapsible` de shadcn existente. Botón accesible (`aria-expanded`), área táctil ≥44px, animación suave.
- Mismo estilo de tarjeta. "Relación de Cobro" y el resto no se tocan.
- **Cambio de alcance (pedido del dueño):** la tarjeta "Nivel" se quita. El nivel pasa a un badge junto al título de la tarjeta colapsada, solo con "Senior" o "Junior" (se quita el prefijo "Nivel " que manda la API). Si la API no manda nivel, no hay badge.

## 5. Pruebas (DEMO_MODE=true, Playwright, 390x844)
- Login → `/` con campana (todas las asociadas demo).
- 1000012: aviso visible, Vale Nuevo deshabilitado en la tarjeta y en la barra, mensaje al tocar. Llamar la server action directo sigue siendo rechazado.
- 1000013: estatus distinto de "Al Día", texto nuevo del aviso, un solo botón de pago.
- 1000001, 1000002, 1000009 y 1000011: el dashboard se ve igual que hoy, salvo "Datos de la Asociada" colapsada. Comparar contra capturas de la base.
- Datos de la Asociada: colapsada por default, se expande y muestra los 4 datos.
- Regresiones: vale cliente nuevo/existente, préstamo personal, firma OTP+NIP, flujo del teléfono.

## 6. Entrega
- Ciclo con `revisor-prestagana` hasta PASS (máx. 4 rondas).
- Push y PR hacia `feature/telefono-financiado` (no a main, no merge), con capturas antes/después de 1000001, 1000002, 1000009, 1000011, 1000012 y 1000013 y el reporte del revisor.
