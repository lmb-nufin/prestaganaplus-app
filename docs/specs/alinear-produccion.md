# Especificación: alinear `main` con el repositorio de producción

**Rama:** `fix/alinear-produccion`, creada desde `main`. PR a `main`, sin merge.

**Objetivo:** traer lo que producción tiene y nosotros no, sin perder lo nuevo (AppShell, firma del equipo, Préstamo Personal, Teléfono, interruptores).

## Estado de partida

`fix/paridad-produccion` ya había traído parte de esto. Se comparó archivo por archivo contra producción:

| # | Tema | Estado en `main` | Cambio aquí |
|---|---|---|---|
| 1 | Montos y plazos de vales: plazos 8/10/12; nuevo $5,000–$5,500; renovado $5,000–$9,000, saltos de $500 | Ya igual en el formulario. `createVale` solo pedía mayor a cero | Reglas en `src/lib/vale-rules.ts`, usadas por el formulario y validadas en `createVale` (CLAUDE.md: reglas en el servidor) |
| 2 | Préstamo Personal igual que cliente existente | Montos ya iguales; plazos con 14 | Plazos 8/10/12 en `personal-loan.ts`, `demo-api.ts`, texto de la opción, docs y pruebas |
| 3 | Cancelación: `deleteValeByFolio` devuelve `{ success, message }` y `cancelVale` muestra ese mensaje, conservando la firma del equipo | Ya igual | La demo simula el rechazo de un vale activo |
| 4 | `InactivityTimeoutHandler` en `layout.tsx` dentro de `<Suspense fallback={null}>` | Ya montado, 5 minutos | Ninguno. No choca con login ni e2e; no se ajusta el tiempo |
| 5 | Estilos de la lista de vales en móvil | Base compacta anterior | Se toman los de la tarjeta de producción. Se conservan `PersonalBadge`, el aviso de folio y "Crear vale nuevo". **No** se trae `pb-24`: era para la barra fija y AppShell ya resuelve ese espacio |

## Tope de cliente nuevo en el servidor

`isRenewed` viene del formulario, así que por sí solo no protege el tope de $5,500. Arriba de ese monto, `createVale` vuelve a consultar el cliente con el `curp` enviado y exige que `id_cliente` coincida; si no puede verificarlo, rechaza. Nombre, fecha de nacimiento y teléfono del vale salen de esa respuesta, no del formulario, igual que en Préstamo Personal, para que no se use el CURP de otra persona. Si a esa respuesta le falta alguno de esos datos o `id_cliente`, también rechaza. El formulario siempre envía el CURP buscado.

## Vale activo en la demo

El tipo `Vale` no tiene estatus `ACTIVO`: la API rechaza la cancelación de un vale que la app ve como `FIRMADO`. Por eso la demo agrega `1000001-202610-ACTIVO`, en `FIRMADO`, que al recibir `DELETE` responde 400 con `{ "message": "El vale ya está activo y no se puede cancelar." }`. Ese texto es de la simulación: en producción el mensaje lo da la API.

## Cancelación exitosa desde el detalle

Al probar la cancelación normal apareció un error de `main`: `revalidatePath` volvía a pintar `/sign/{folio}`, el vale ya no existía y la asociada caía en `/vales?aviso=folio-no-encontrado` con "No encontramos ese vale", aunque la cancelación había funcionado. `cancelVale` ya no revalida; el diálogo navega a `/vales` y hace `router.refresh()`.

## No se trae

- La carpeta `api/`.
- El `allowedOrigins` del devtunnel.
- El `AUTH_SECRET` en texto de `apphosting.qa.yaml`.
- La captura de auditoría de `vale-creation-form.tsx` de producción (config de Firebase en el componente): ya tenemos `useAuditData`.

## Pruebas

En `11-paridad-produccion`:

- Préstamo Personal ofrece $5,000–$9,000 y 8/10/12 quincenas.
- El servidor rechaza Préstamo Personal a 14 quincenas y vales fuera de monto o plazo, llamando la server action directo.
- El servidor rechaza $9,000 de un cliente nuevo marcado como existente, y de un cliente existente con otro `id_cliente`. Con CURP e id reales y datos de otra persona, el vale queda con los datos de la API. Si la API no trae el teléfono, se rechaza aunque venga en el formulario. Si no trae `id_cliente`, se rechaza aunque el formulario tampoco lo envíe.
- Vale activo: la cancelación muestra el mensaje de la API y el vale sigue ahí.
- Vale no activo: la cancelación funciona, llega a `/vales` sin aviso de error y el vale sale de la lista.
- Estilos: la lista de vales móvil no genera scroll horizontal con un préstamo personal (nombre más dos insignias).

En `04-emision-restringida`: cliente existente a $9,000 con la firma del equipo.

Suite completa en verde, typecheck sin errores nuevos y revisor en PASS.
