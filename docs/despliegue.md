# Despliegue de la web app PrestaGana+ (Firebase App Hosting, sin Vercel)

La app se despliega igual que la app actual en producción: un backend de **Firebase App Hosting** que construye con `npm install` y `npm run build` y arranca con `npm start`. Es Next.js 15 con server actions, así que corre como proceso de Node.js, no como sitio estático.

## Firebase App Hosting (recomendado)

1. Crear un backend nuevo de App Hosting para el piloto, conectado a este repositorio, rama `main` (o fijado a la etiqueta del piloto). Usar un backend aparte del de la app actual, para no tocar producción.
2. `apphosting.yaml` (en la raíz del repo) ya trae las variables del piloto: `DEMO_MODE=false`, los dos interruptores en `false`, `TZ` y una instancia.
3. Crear el secreto de sesión, propio de este backend:

   ```bash
   firebase apphosting:secrets:set prestaganaplus-auth-secret
   ```

   El valor es aleatorio y largo (`openssl rand -base64 32`). No se reutiliza el de otro ambiente ni se escribe en ningún archivo del repo.
4. Definir `API_BASE_URL` del ambiente en un `apphosting.<ambiente>.yaml` o en la consola de Firebase, como en la app actual. Debe terminar en `/`.
5. Desplegar y verificar (ver abajo).

## Servidor propio (alternativa)

- Node.js 20 LTS o 22 LTS. `npm ci`, `npm run build`, `npm start -- -p 3000`, con el proceso vivo bajo el gestor de servicios de Sistemas.
- Detrás de un proxy inverso con HTTPS que reenvíe `Host` y `X-Forwarded-Proto` (NextAuth usa `trustHost: true`).
- Las mismas variables que `apphosting.yaml`, más `API_BASE_URL` y `AUTH_SECRET`.

## Requisitos comunes

- Salida de red del servidor hacia `API_BASE_URL`. No llama a ningún otro servicio desde el servidor.
- HTTPS en el dominio público (las cookies de sesión son seguras).
- `GET /login` responde 200: sirve como health check.
- Una instancia basta para el piloto (igual que producción). Si hay varias, todas comparten el mismo `AUTH_SECRET`.

## Variables de entorno

| Variable | Producción (piloto) | Notas |
|---|---|---|
| `AUTH_SECRET` | **Obligatoria.** Valor aleatorio largo, propio de este ambiente. | En App Hosting es el secreto `prestaganaplus-auth-secret`. Se genera con `openssl rand -base64 32`. Nunca en un archivo del repo. |
| `API_BASE_URL` | **Obligatoria.** URL de la API .NET, terminada en `/`. | Sin ella (y sin `DEMO_MODE=true`) la app falla al arrancar las consultas en producción, a propósito. |
| `DEMO_MODE` | `false` o sin definir. | `true` sirve datos simulados en memoria: **nunca** en producción. |
| `FEATURE_PRESTAMO_PERSONAL` | `false` hasta que backend acepte `tipoVale` en `POST vales` y la app esté lista para encenderlo. | Sin definir = apagada fuera de demo. |
| `FEATURE_TELEFONO` | `false` hasta que backend tenga `telefono/*` y `dispositivo/*` y la miniapp Android esté lista. | Sin definir = apagada fuera de demo. |
| `TZ` | `America/Mexico_City` | |

Cuando el backend entregue una función, se cambia su variable a `true` (en `apphosting.yaml` o en la consola) y se vuelve a desplegar o reiniciar; el código no cambia.

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
