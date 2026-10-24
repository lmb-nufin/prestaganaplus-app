# PrestaGana+ web app

Next.js 15 (App Router, server actions), NextAuth v5, shadcn/ui. Con `DEMO_MODE=true` todas las llamadas a la API van a la simulación en `src/lib/demo-api.ts`.

## Forma de trabajo

- **Spec primero.** Cada tarea tiene su especificación en `docs/specs/<tarea>.md`; guárdala ahí antes de implementar y actualízala si cambia el alcance.
- **Una rama por tarea**, `feature/<tarea>`, y un PR hacia `main`. No se hace merge sin que lo pida el dueño.
- **Revisor al terminar.** Al cerrar la implementación invoca al agente `revisor-prestagana` (`.claude/agents/revisor-prestagana.md`). Corrige lo que reporte y vuelve a invocarlo hasta obtener PASS, con un máximo de 4 rondas; si no llega a PASS, detente y reporta lo pendiente.
- **Nunca probar contra la API real.** Las pruebas, locales o automatizadas, corren con `DEMO_MODE=true`. El `.env` local puede tener la URL real: no levantes la app sin `DEMO_MODE=true` para probar.
- **Reglas en el servidor.** Elegibilidad, límites y restricciones se validan en server actions o en código `server-only`; ocultar un botón no cuenta como control.
- **Typecheck:** `npm run typecheck` no debe agregar errores respecto a `main` (hay errores previos).
- **Pruebas:** `npx playwright test` (ver `playwright.config.ts`).
