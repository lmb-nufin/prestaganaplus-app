# Guía de Despliegue y Conexión: PrestaGana+

Este documento proporciona una guía técnica detallada para que tu equipo de desarrollo finalice la conexión de la aplicación a los servicios reales y la despliegue a producción.

## 1. Resumen de la Arquitectura

Esta es una aplicación web construida con **Next.js (App Router)** y **TypeScript**, diseñada para ser desplegada en **Vercel**.

### Tecnologías Principales:
- **Framework**: Next.js 15 (con Server Components y Server Actions)
- **Lenguaje**: TypeScript
- **UI**: React, ShadCN UI, TailwindCSS, Lucide Icons
- **Autenticación**: NextAuth.js v5 (Beta) con el proveedor `credentials`.
- **Datos (Actual)**: Con `DEMO_MODE=true` usa una **API simulada en memoria** (`src/lib/demo-api.ts`); sin él, llama a la API real en `API_BASE_URL`. Asociadas demo (NIP `1234`, OTP siempre `123456`): `1000001` elegible para préstamo personal, `1000002` atrasada, `1000003` con menos de 3 meses, `1000004` con el servicio de préstamo personal caído, `1000005` con una respuesta de préstamo personal mal formada.
- **Despliegue**: Preparada para desplegarse en **Vercel**.

## 2. Funcionalidades Implementadas (con datos de prueba)

- **Autenticación**: Login, logout, protección de rutas y recuperación de NIP (simulada).
- **Registro de Asociadas**: Flujo de 3 pasos (verificación de identidad, OTP simulado, creación de NIP).
- **Dashboard de Asociada**: Muestra un resumen del estado de la línea de crédito y datos personales (actualmente con datos fijos).
- **Gestión de Vales**: Creación, listado y firma de vales con un flujo de doble factor (OTP + NIP) simulado.

---

## 3. Pasos para Finalizar y Publicar (ACCIÓN REQUERIDA)

### Paso 3.1: Desarrollar la API REST Intermediaria (Backend)

Por seguridad, la aplicación web **NUNCA debe conectarse directamente a la base de datos SQL Server**. Se debe desarrollar una **API REST segura** que actúe como intermediaria.

**Requisitos de la API:**
1.  **Conexión Segura**: Debe ser la única capa con acceso a la base de datos.
2.  **Autenticación**: Proteger los endpoints con API Keys, JWT, o un método similar.
3.  **Endpoints Necesarios**:
    - `POST /users`: Para el registro de nuevas asociadas.
    - `GET /users/{associateNumber}`: Busca una asociada. Debe devolver el usuario con su **NIP ya hasheado con bcrypt**.
    - `POST /verification/send-otp`: Para enviar el OTP de firma de vale (esta API interna puede llamar a Sinch).
    - `POST /verification/verify-otp`: Para verificar el OTP.
    - `GET /vales?associateNumber={associateNumber}`: Obtiene el historial de vales de una asociada.
    - `POST /vales`: Crea un nuevo vale.
    - `PUT /vales/{folio}`: Actualiza el estado y datos de un vale.
    - **`GET /dashboard/{associateNumber}`**: Obtiene todos los datos para el dashboard de la asociada. La estructura de la respuesta JSON se encuentra documentada en `docs/api-contracts.md`.

### Paso 3.2: Conectar la App Web a la API REST (Frontend)

Una vez que la API esté lista, hay que reemplazar toda la lógica simulada en la aplicación Next.js. **Todos los puntos de modificación están centralizados en `src/lib/data.ts` y marcados con comentarios `// TODO:`**.

**Acciones para la programadora:**

1.  **Configurar Variables de Entorno**:
    Copia `.env.example` a `.env.local` y asegúrate de que la variable `API_BASE_URL` apunte a tu nueva API. En producción, esta variable debe estar configurada en las Environment Variables del proyecto en Vercel.

2.  **Modificar `src/lib/data.ts`**:
    - **Esta es la tarea principal.**
    - Abre el archivo `src/lib/data.ts`.
    - Reemplaza el contenido de todas las funciones (`findUserByAssociateNumber`, `getVales`, `getAssociateDashboard`, etc.) con llamadas `fetch` a tu nueva API REST.
    - **Ejemplo para `findUserByAssociateNumber`**:
        ```typescript
        export async function findUserByAssociateNumber(associateNumber: string) {
            // TODO: Reemplazar esta lógica de prueba con una llamada a la API.
            // Ejemplo:
            // const response = await fetch(`${API_BASE_URL}/users/${associateNumber}`);
            // if (!response.ok) return null;
            // const user = await response.json(); 
            // // La API debe devolver el usuario con el NIP ya hasheado y el teléfono.
            // return user;

            console.log(`[MOCK] Searching for user with associate number: ${associateNumber}`);
            // ... (lógica de prueba actual)
        }
        ```
    - **Asegúrate de que todas las funciones sean `async`** y manejen adecuadamente las respuestas y errores de la API.

3.  **Conectar el Dashboard de la Asociada**:
    - Abre el archivo `src/components/distributor-dashboard.tsx`.
    - Actualmente, los datos se muestran desde un objeto `distributorData` estático.
    - Se debe reemplazar esta lógica para obtener los datos del usuario logueado. He dejado un ejemplo comentado de cómo se haría: obtener la sesión, el número de asociada y llamar a la nueva función `getAssociateDashboard` (que deberás crear en `src/lib/data.ts`) que a su vez llamará al endpoint `GET /dashboard/{associateNumber}` de tu API.

### Paso 3.3: Proceso de Despliegue en Vercel

1.  **Importar el Repositorio**: En [vercel.com/new](https://vercel.com/new), importa este repositorio de GitHub. Vercel detecta Next.js automáticamente; no hace falta cambiar el comando de build.
2.  **Configurar Variables de Entorno**: **¡Muy importante!** En *Project Settings → Environment Variables*, añade las variables de `.env.example` (`AUTH_SECRET` y `API_BASE_URL`) para Production y Preview. Genera `AUTH_SECRET` con `npx auth secret`.
3.  **Despliegue Automático**: Cada `git push` a `main` despliega a producción; cada push a otra rama o PR crea un Preview Deployment.

---

Con estos pasos, la aplicación estará completamente funcional, segura, conectada a los datos reales y lista para ser utilizada por las asociadas de PrestaGana+.
