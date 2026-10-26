# Especificación: igualar la app nueva con lo que hoy está en producción

**Rama:** `fix/paridad-produccion`, creada desde `main` (`piloto-v1`). Pedido del dueño: confirmar que lo enviado cuadra con el repositorio de producción.

## Comparación

Se comparó `piloto-v1` contra el repositorio de producción (6 commits, el último del 2026-10-26). La capa de API de nuestro código base (`src/lib/data.ts`, `src/app/actions.ts`) era idéntica a la de producción antes de sus últimos cambios. Producción tiene cuatro cambios posteriores que no estaban en `piloto-v1`, y despliega en Firebase App Hosting.

| Tema | Producción | `piloto-v1` | Cambio aquí |
|---|---|---|---|
| Montos del vale | Cliente nuevo $5,000–$5,500; existente $5,000–$9,000 | $4,500–$5,000 y $4,500–$8,500 | Igual a producción |
| Plazos del vale | 8, 10 y 12 quincenas | 8, 10, 12 y 14 | Igual a producción |
| Soporte (pantalla Soporte) | WhatsApp 5533349279, teléfono 5662302984 | Números anteriores | Igual a producción. "Olvidé mi NIP" y registro conservan los anteriores, igual que en producción |
| Cancelar vale | Muestra el mensaje de la API cuando rechaza (p. ej. vale ya activo); `cache: 'no-store'` | Mensaje genérico | Igual a producción |
| Cierre por inactividad | Activo, 5 minutos | Apagado | Activo, 5 minutos. Además escucha el scroll en captura y `touchstart`: con AppShell el scroll no llega a `window` |
| Despliegue | Firebase App Hosting (`apphosting.*.yaml`, 1 instancia) | Documentado como servidor Node genérico | `apphosting.yaml` con las variables del piloto; `docs/despliegue.md` describe App Hosting |

- **Préstamo Personal** (apagado en el piloto): sus montos siguen la regla "igual que cliente existente", así que pasan a $5,000–$9,000. Los plazos quedan 8–14 como dice su spec; pendiente de confirmar con Producto.
- **Notificaciones**: no existen en producción; en la app nueva hay 4 avisos de ejemplo. Queda como decisión de Producto (ya listada).

## Pruebas

- `06-regresiones`: el vale de cliente existente usa $9,000 y 12 quincenas.
- La suite completa en verde y typecheck sin errores nuevos.
