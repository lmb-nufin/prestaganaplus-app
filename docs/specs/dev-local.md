# Especificación: `npm run dev` funcionando en local

**Rama:** `fix/dev-local`, creada desde `main` (`piloto-v2`).

## Problema

`npm run dev` truena en local con dos errores independientes. Ninguno afecta `npm run build` ni `npm start`, que es lo que corre en el piloto.

| Error | Causa | Dónde se ve |
|---|---|---|
| `Could not parse module '[project]/node_modules/next/dist/server/route-modules/app-route/vendored/contexts/app-router-context.js'` | Turbopack en desarrollo con NextAuth v5: `next-auth` importa `next/navigation` dentro de la ruta `/api/auth`, y Next 15.3.8 no publica ese módulo para rutas | `/api/auth/*`, así que falla el inicio de sesión |
| `localStorage.getItem is not a function` | Node 25 trae un `localStorage` global que sin `--localstorage-file` no funciona; Next en desarrollo lo toma por el del navegador | `/login` y demás páginas, con y sin Turbopack |

## Solución

- `package.json`: `dev` pasa a `next dev`, sin `--turbopack`. `next build` ya no usaba Turbopack, así que desarrollo queda igual que el build.
- `src/instrumentation.ts`: en el servidor Node, si `localStorage` existe sin `getItem`, se quita. En Node 20 y 22 no hace nada.
- `README.md`: versión de Node recomendada y por qué no se usa Turbopack.

## Verificación

Con `DEMO_MODE=true`, en Node 25: `GET /login` responde 200 y `GET /api/auth/csrf` responde 200 con `npm run dev`. `npx playwright test` en verde y typecheck sin errores nuevos.
