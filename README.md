# PrestaGana+ web app

Web app para asociadas PrestaGana+: dashboard de línea y pagos, vales digitales (cliente nuevo y existente, firma con OTP + NIP), notificaciones, perfil y soporte. Incluye, detrás de interruptores, Préstamo Personal y Teléfono PrestaGana.

## Tecnologías

Next.js 15 (App Router, server actions), TypeScript, NextAuth v5 (credentials), shadcn/ui, Tailwind. Todas las llamadas a la API pasan por `src/lib/api.ts` → `src/lib/data.ts`.

## Documentación

| Tema | Archivo |
|---|---|
| Despliegue en servidor propio (sin Vercel), variables de entorno y verificación | `docs/despliegue.md` |
| Contratos de la API (dashboard, teléfono, dispositivo) | `docs/api-contracts.md` |
| Interruptores por función para el piloto | `docs/specs/interruptores-piloto.md` |
| Préstamo Personal | `docs/specs/prestamo-personal.md` |
| Teléfono PrestaGana | `docs/specs/telefono-financiado.md` |
| Contrato con la miniapp Android | `docs/specs/miniapp-bridge.md` |
| Especificaciones de cada cambio | `docs/specs/` |

## Desarrollo local

```bash
cp .env.example .env.local   # DEMO_MODE=true: datos simulados, sin API real
npm install
npm run dev
```

Con `DEMO_MODE=true` la app usa la simulación en memoria de `src/lib/demo-api.ts`. Las asociadas demo están en `.env.example` (NIP `1234`, OTP `123456`).

## Pruebas

```bash
npx playwright test
```

Siempre en modo demo, nunca contra la API real. `npm run typecheck` tiene errores previos conocidos; un cambio no debe agregar nuevos.
