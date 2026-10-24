# Guía de Despliegue y Conexión a Producción: PrestaGana+

Este documento proporciona una guía técnica detallada para que el equipo de desarrollo finalice la conexión de la aplicación a los servicios reales y la despliegue a producción.

## Resumen de Tareas Críticas

Actualmente, la aplicación opera con una **base de datos simulada en `src/lib/data.ts`**. Para salir a producción, es necesario reemplazar esta simulación por conexiones a una API real y segura.

---

### **Paso 1: Desarrollar la API REST Intermediaria (Backend)**

Por seguridad y buenas prácticas, la aplicación web **NUNCA** debe conectarse directamente a la base de datos de producción. Se debe desarrollar una API REST segura que actúe como intermediaria.

**Requisitos de la API:**
1.  **Conexión Segura**: Debe ser la única capa con acceso a la base de datos.
2.  **Autenticación**: Proteger los endpoints con un método robusto (ej. API Keys, JWT).
3.  **Endpoints Necesarios**: La API debe implementar los siguientes endpoints. La estructura de datos para el dashboard está documentada en `docs/api-contracts.md`.

    - `GET /dashboard/{associateNumber}`: Obtiene todos los datos para el dashboard de la asociada.
    - `GET /users/{associateNumber}`: Busca una asociada. Debe devolver el usuario con su **NIP ya hasheado con bcrypt**.
    - `POST /users`: Para el registro de nuevas asociadas.
    - `GET /vales?associateNumber={associateNumber}`: Obtiene el historial de vales de una asociada.
    - `POST /vales`: Crea un nuevo vale.
    - `PUT /vales/{folio}`: Actualiza el estado y datos de un vale (ej. para firmarlo).
    - `DELETE /vales/{folio}`: Elimina un vale (cancelación).
    - `POST /verification/send-otp`: Endpoint para enviar el OTP de firma de vale (puede llamar a un servicio como Sinch).
    - `POST /verification/verify-otp`: Endpoint para verificar el OTP.

---

### **Paso 2: Conectar la Aplicación Next.js a la API (Frontend)**

Una vez que la API esté lista, hay que reemplazar toda la lógica simulada en la aplicación.

**Acciones para el equipo de desarrollo:**

1.  **Modificar `src/lib/data.ts` (Tarea Principal)**:
    - Este archivo centraliza toda la lógica de acceso a datos.
    - Reemplazar el contenido de **todas** las funciones (`findUserByAssociateNumber`, `getVales`, `addVale`, `updateValeStatus`, `deleteValeByFolio`, etc.) con llamadas `fetch` a los endpoints correspondientes de la nueva API REST.
    - Todos los puntos a modificar están marcados con comentarios `// TODO:`.
    - **Ejemplo de modificación para `findUserByAssociateNumber`**:
        ```typescript
        export async function findUserByAssociateNumber(associateNumber: string) {
            // TODO: Reemplazar esta lógica de prueba con una llamada a la API.
            // Ejemplo:
            const response = await fetch(`${process.env.API_BASE_URL}/users/${associateNumber}`);
            if (!response.ok) return null;
            const user = await response.json(); 
            // La API debe devolver el usuario con el NIP ya hasheado y el teléfono.
            return user;
        }
        ```

2.  **Conectar el Dashboard de la Asociada**:
    - Abrir `src/components/distributor-dashboard.tsx`.
    - Actualmente, los datos se muestran desde un objeto estático `distributorData`.
    - Esta lógica debe ser reemplazada para obtener los datos del usuario logueado, llamando a la nueva función `getAssociateDashboard` (que se deberá implementar en `src/lib/data.ts`).

3.  **Habilitar Verificación OTP Real**:
    - Abrir `src/app/actions.ts`.
    - En las funciones `sendValeOtp` y `signValeWithOtp`, la lógica de llamada al servicio real de Sinch está comentada.
    - Se debe eliminar la lógica de prueba (`DUMMY OTP`) y descomentar los bloques de código para la integración real.

---

### **Paso 3: Configuración y Despliegue en Firebase App Hosting**

1.  **Configurar Variables de Entorno en Firebase**:
    - En la consola de Firebase App Hosting, añadir las siguientes variables de entorno para el backend:
      - `API_BASE_URL`: La URL de producción de la API REST desarrollada en el Paso 1.
      - `AUTH_SECRET`: Un secreto aleatorio y seguro para NextAuth.js.
      - `SINCH_SERVICE_PLAN_ID`: Tu Service Plan ID de Sinch.
      - `SINCH_API_TOKEN`: Tu API Token de Sinch.

2.  **Despliegue Automático**:
    - Conecta tu repositorio de GitHub a Firebase App Hosting.
    - Cada `git push` a la rama principal (generalmente `main`) iniciará un nuevo despliegue a producción.

---

Siguiendo estos pasos, la aplicación estará completamente funcional, segura y conectada a los datos reales, lista para ser utilizada por las asociadas de PrestaGana+.
