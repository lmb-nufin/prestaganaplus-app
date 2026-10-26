# Especificación: interruptores por función para la prueba piloto

**Rama:** `feature/interruptores-piloto`, creada desde `main` (que ya incluye el rediseño del dashboard y el fix de barras en iPhone). Merge a `main` pedido por el dueño para dejar la versión del piloto.

## Problema

Contra la API real que ya funciona en producción, Préstamo Personal y Teléfono PrestaGana necesitan endpoints que el backend todavía no tiene (`prestamoPersonal/{n}`, `telefono/*`, `dispositivo/*`). Hoy, si `telefono/estado` no existe, la app bloquea la emisión de vales para todas (fail-closed). El piloto tiene que poder salir con la API actual.

## Solución

Dos variables de entorno, leídas solo en el servidor (`src/lib/features.ts`):

| Variable | Apagada (`false`) |
|---|---|
| `FEATURE_PRESTAMO_PERSONAL` | No se llama `prestamoPersonal/{n}`. Vale Nuevo no muestra Efectivo. `createPersonalLoanVale` rechaza. |
| `FEATURE_TELEFONO` | No se llama ningún endpoint `telefono/*` ni `dispositivo/*`. El estado del teléfono es "sin equipo y sin restricción": emisión libre, sin tarjeta Mi Teléfono, sin avisos de mora del teléfono, sin pausa. Vale Nuevo no muestra la oferta del equipo; `/telefono` regresa a Vale Nuevo; `requestPhone` rechaza; Perfil no muestra "Reportar mi equipo". |

- Valores: `true`/`1` enciende, `false`/`0` apaga. **Sin definir:** encendida solo si `DEMO_MODE=true` (demo y pruebas); en cualquier otro caso, apagada. Así, un servidor de producción que no las define arranca con las dos apagadas.
- Si las dos están apagadas, Vale Nuevo no muestra la opción "Préstamo Personal". Si solo una está encendida, la opción muestra solo esa.
- Las reglas se aplican en el servidor (páginas y server actions); ocultar en la UI no es el control.
- Con las dos apagadas, la app usa solo los endpoints de la versión original.

## Pruebas

- Las pruebas existentes corren igual (demo, interruptores sin definir = encendidos).
- Prueba nueva con un segundo servidor demo (puerto 3131) con las dos apagadas: dashboard sin Mi Teléfono ni pausa y con Vale Nuevo normal, Vale Nuevo sin Préstamo Personal, `/telefono` redirige, Perfil sin Reportar, una asociada con equipo reportado en demo (1000012) puede emitir, y llamar a `createPersonalLoanVale` y `requestPhone` directo se rechaza.
