# Despliegue de la web app PrestaGana+ (servidor propio, sin Vercel)

La app es Next.js 15 con server actions: corre como un proceso de Node.js. No es un sitio estático: necesita un servidor que ejecute `next start` detrás de HTTPS.

## Requisitos

- Node.js 20 LTS o 22 LTS y npm.
- Salida de red del servidor hacia `API_BASE_URL` (la API .NET). No llama a ningún otro servicio desde el servidor.
- HTTPS en el dominio público (las cookies de sesión son seguras).
- Zona horaria `America/Mexico_City` en el proceso (`TZ`), para fechas y vencimientos.

## Construir y arrancar

```bash
npm ci
npm run build
npm start -- -p 3000
```

- `npm start` corre `next start` en el puerto indicado. Mantén el proceso vivo con el gestor de servicios que use Sistemas (systemd, PM2, servicio de Windows, contenedor).
- Antes del proxy, `GET /login` responde 200: sirve como health check.
- Detrás de un proxy inverso (Nginx, IIS, balanceador), reenvía `Host` y `X-Forwarded-Proto`. NextAuth usa el host de la petición (`trustHost: true`).
- Una sola instancia es suficiente para el piloto. Si hay varias, todas deben compartir el mismo `AUTH_SECRET`.

## Variables de entorno

| Variable | Producción (piloto) | Notas |
|---|---|---|
| `AUTH_SECRET` | **Obligatoria.** Valor aleatorio largo, propio de producción. | Se genera con `npx auth secret` o `openssl rand -base64 32`. No se reutiliza el de demo ni se sube al repo. |
| `API_BASE_URL` | **Obligatoria.** URL de la API .NET, terminada en `/`. | Sin ella (y sin `DEMO_MODE=true`) la app falla al arrancar las consultas en producción, a propósito. |
| `DEMO_MODE` | `false` o sin definir. | `true` sirve datos simulados en memoria: **nunca** en producción. |
| `FEATURE_PRESTAMO_PERSONAL` | `false` hasta que backend acepte `tipoVale` en `POST vales` y la app esté lista para encenderlo. | Sin definir = apagada fuera de demo. |
| `FEATURE_TELEFONO` | `false` hasta que backend tenga `telefono/*` y `dispositivo/*` y la miniapp Android esté lista. | Sin definir = apagada fuera de demo. |
| `TZ` | `America/Mexico_City` | |

Cuando el backend entregue una función, se enciende su variable y se reinicia el proceso; no hace falta otro build.

## Endpoints que llama la app en el piloto

Con las dos `FEATURE_*` apagadas, la app usa solo los endpoints de la versión original, relativos a `API_BASE_URL`:

| Método y ruta | Para qué |
|---|---|
| `GET dashboard/{n}` | Login (perfil de la asociada) y "Olvidé mi NIP" |
| `GET dashboardData/{n}` | Dashboard: línea, situación de pago, referencias de pago y relación de cobro |
| `GET valesDashboard/{n}` | Lista de vales |
| `GET vales/{folio}` | Detalle del vale |
| `POST vales` | Crear vale de cliente nuevo o existente |
| `PUT vales/{folio}/status` | Firmar el vale |
| `DELETE vales/{folio}` | Cancelar el vale |
| `GET clients/{curp}` | Buscar cliente existente |
| `POST sms/send` | Enviar el OTP de firma |
| `GET validarotp/{n}` | Validar el OTP |
| `POST sms/sendNIP` | "Olvidé mi NIP" |

Con Préstamo Personal encendido se suman `GET prestamoPersonal/{n}` y `POST vales` con `tipoVale`; con el Teléfono, `telefono/*` y `dispositivo/*` (ver `docs/api-contracts.md`).

## Recursos que carga el navegador

Además de la app, el navegador de la asociada carga imágenes de `api.qrserver.com` (QR del vale y código de barras de pago en efectivo) y `placehold.co` (logos de tiendas en las opciones de pago). Vienen del código original. Si la red del piloto filtra salidas, hay que permitirlas o reemplazarlas.

## Verificación después de desplegar

1. `GET /login` responde 200 y la pantalla de inicio carga.
2. Inicio de sesión con una asociada de prueba real: el dashboard muestra su línea y su situación.
3. Vale Nuevo muestra Cliente Nuevo y Cliente Existente; con los interruptores apagados no aparece Préstamo Personal.
4. Crear y firmar un vale de prueba (OTP por SMS + NIP) y verlo en Vales.
5. En el log del servidor no aparecen llamadas a `telefono/`, `dispositivo/` ni `prestamoPersonal/`.

## Pruebas automatizadas

`npx playwright test` construye la app y levanta dos servidores locales en modo demo (puertos 3130 y 3131, el segundo con los interruptores apagados). Nunca apuntan a la API real.
