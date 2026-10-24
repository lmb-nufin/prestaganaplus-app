
# Guía Técnica: Creación de la API REST en GCP para PrestaGana+

Este documento es una guía técnica para el equipo de backend. Detalla el proceso recomendado para construir, conectar y desplegar la API REST intermediaria que servirá a la aplicación web PrestaGana+.

**Objetivo:** Crear una API segura, escalable y lista para producción en Google Cloud Platform (GCP).

---

## 1. Stack Tecnológico Recomendado

Para una implementación rápida, moderna y escalable, se recomienda el siguiente stack:

-   **Entorno de Ejecución**: **Node.js** con **Express.js**. Es un ecosistema maduro, rápido y muy popular para la creación de APIs.
-   **Base de Datos**: Conexión a la instancia de **SQL Server** existente en GCP.
-   **Despliegue**: **Cloud Run**. Es una plataforma *serverless* que permite desplegar contenedores Docker. Es ideal porque escala automáticamente (incluso a cero, ahorrando costos) y se integra perfectamente con el resto de GCP.
-   **Gestión de Secretos**: **Secret Manager**. Para almacenar de forma segura las credenciales de la base de datos y otras claves de API.

---

## 2. Pasos para la Implementación

### Paso 2.1: Configuración del Proyecto Local

1.  **Inicializar un proyecto Node.js**:
    ```bash
    mkdir prestagana-api
    cd prestagana-api
    npm init -y
    ```

2.  **Instalar dependencias**:
    -   `express`: El framework web.
    -   `mssql`: El conector para SQL Server en Node.js.
    -   `cors`: Para habilitar peticiones desde el frontend (Cross-Origin Resource Sharing).
    -   `dotenv`: Para gestionar variables de entorno en desarrollo.
    -   `bcryptjs`: Para comparar los NIPs hasheados de forma segura (más portable que `bcrypt`).

    ```bash
    npm install express mssql cors dotenv bcryptjs
    ```

3.  **Crear la estructura de archivos**:
    ```
    prestagana-api/
    ├── src/
    │   ├── index.js        # Archivo principal de la API
    │   └── db.js           # Lógica de conexión a la BD
    ├── .env                # Variables de entorno locales
    ├── .gitignore
    └── Dockerfile          # Para la contenedorización
    ```

### Paso 2.2: Conexión Segura a la Base de Datos SQL Server en GCP

La conexión a la base de datos debe ser segura y **NUNCA** debe exponer las credenciales en el código.

1.  **Almacenar Credenciales en Secret Manager**:
    -   Ve a la consola de GCP -> "Secret Manager".
    -   Crea secretos para:
        -   `DB_USER`: El usuario de tu base de datos.
        -   `DB_PASSWORD`: La contraseña del usuario.
        -   `DB_NAME`: El nombre de la base de datos.
        -   `DB_SERVER`: La IP privada de tu instancia de Cloud SQL.

2.  **Lógica de Conexión en la API (`src/db.js`)**:
    Este archivo se encargará de obtener los secretos y establecer una única pool de conexiones a la base de datos.

    ```javascript
    // src/db.js
    const sql = require('mssql');
    // En producción (Cloud Run), las variables de entorno se cargarán desde Secret Manager.
    // Para desarrollo local, `dotenv` las cargará desde el archivo .env.

    const dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER, // ej. 'localhost' en dev, IP privada en prod.
        database: process.env.DB_NAME,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            encrypt: true, // Requerido para Azure SQL, puede ser necesario en GCP. Ajustar a 'false' si la conexión es interna y no usa SSL.
            trustServerCertificate: true, // Poner a 'true' para desarrollo local o si el certificado es autofirmado.
        },
    };

    let poolPromise = null;

    const getConnection = async () => {
        if (poolPromise) {
            return poolPromise;
        }

        try {
            console.log('Attempting to connect to the database...');
            poolPromise = new sql.ConnectionPool(dbConfig)
                .connect()
                .then(pool => {
                    console.log('Database connection successful!');
                    return pool;
                })
                .catch(err => {
                    console.error('Database connection failed!', err);
                    // Reset promise para permitir reintentos
                    poolPromise = null; 
                    // Terminar el proceso si no se puede conectar es una estrategia válida en contenedores
                    process.exit(1); 
                });
            
            return poolPromise;
        } catch (err) {
            console.error('Failed to create connection pool:', err);
            process.exit(1);
        }
    };

    module.exports = { getConnection, sql };
    ```

3.  **Desarrollo Local con Cloud SQL Auth Proxy**:
    Para conectar tu máquina local a la instancia de Cloud SQL sin exponerla a una IP pública, usa el **Cloud SQL Auth Proxy**.
    -   [Descarga e instala el proxy](https://cloud.google.com/sql/docs/mysql/connect-auth-proxy).
    -   Obtén el **nombre de conexión de la instancia** desde la consola de GCP (ej: `project:region:instance-name`).
    -   Ejecuta el proxy en tu terminal. Escuchará en un puerto local (ej: 1433).
        ```bash
        ./cloud-sql-proxy <INSTANCE_CONNECTION_NAME>
        ```
    -   En tu archivo `.env` local, configura `DB_SERVER` para que apunte a `localhost` y el puerto correspondiente.

### Paso 2.3: Implementación de los Endpoints

Crea el servidor Express y define las rutas que necesita la aplicación.

```javascript
// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getConnection, sql } = require('./db');

const app = express();
app.use(express.json());

// Configura CORS para permitir peticiones solo desde el dominio de tu app de Firebase
const corsOptions = {
  // En desarrollo, puedes ser más permisivo. En producción, sé estricto.
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tu-app-en-firebase.apphosting.dev' // Reemplazar con la URL real
    : '*'
};
app.use(cors(corsOptions));

const PORT = process.env.PORT || 8080;

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('API de PrestaGana+ está en funcionamiento.');
});

/**
 * Ejemplo de implementación del endpoint de Login
 * POST /login
 * Body: { "numero_asociada": "1094581", "nip": "1234" }
 */
app.post('/login', async (req, res) => {
    const { numero_asociada, nip } = req.body;

    if (!numero_asociada || !nip) {
        return res.status(400).json({ success: false, message: 'Número de asociada y NIP son requeridos.' });
    }

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('associateNumber', sql.VarChar, numero_asociada)
            .query('SELECT * FROM Users WHERE AssociateNumber = @associateNumber'); // Ajusta la tabla y columna a tu esquema

        const user = result.recordset[0];

        if (!user) {
            // Usa un mensaje genérico para no revelar si el usuario existe o no
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // Compara el NIP proporcionado con el almacenado en la BD
        const nipsMatch = nip === user.Nip;

        if (nipsMatch) {
            // Login exitoso, no devuelvas datos sensibles
            const { Nip, ...userResponse } = user;
            res.status(200).json({ success: true, user: userResponse });
        } else {
            // Contraseña incorrecta
            res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

    } catch (error) {
        console.error('Error en el endpoint de login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Implementa aquí los demás endpoints requeridos en `docs/deployment-guide.md`
// GET /dashboard/{associateNumber}
// GET /vales?associateNumber={associateNumber}
// POST /vales
// etc.

app.listen(PORT, async () => {
  await getConnection(); // Asegura la conexión a la BD al iniciar el servidor
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
```

### Paso 2.4: Contenerización y Despliegue en Cloud Run

1.  **Crear un `Dockerfile`**:
    Este archivo le dice a Docker cómo construir la imagen de tu API.

    ```Dockerfile
    # Usa una imagen oficial de Node.js (versión LTS)
    FROM node:20-slim

    # Crea el directorio de la aplicación
    WORKDIR /usr/src/app

    # Copia los archivos de dependencias
    COPY package*.json ./

    # Instala las dependencias de producción
    RUN npm install --only=production

    # Copia el código fuente de la aplicación
    COPY . .

    # Expone el puerto en el que corre la app
    EXPOSE 8080

    # Comando para iniciar la aplicación
    CMD [ "node", "src/index.js" ]
    ```

2.  **Crear un archivo `.gitignore`**:
    ```
    node_modules
    .env
    ```

3.  **Desplegar en Cloud Run**:
    Usa el CLI de `gcloud`. Este comando construirá la imagen usando Cloud Build, la subirá a Artifact Registry y la desplegará como un nuevo servicio en Cloud Run.

    ```bash
    gcloud run deploy prestagana-api \
      --source . \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-secrets="DB_USER=tu-secreto-usuario:latest,DB_PASSWORD=tu-secreto-pass:latest,DB_NAME=tu-secreto-db:latest,DB_SERVER=tu-secreto-server:latest"
    ```
    -   `--region`: Usa la misma región donde está tu base de datos.
    -   `--allow-unauthenticated`: Permite que la API sea accesible públicamente. La seguridad se gestionará en los endpoints con CORS.
    -   `--set-secrets`: Monta los secretos de Secret Manager como variables de entorno en Cloud Run. **Esta es la forma correcta de pasar credenciales a producción.**

### Paso 2.5: Configuración Final

-   **URL de la API**: Una vez desplegada, Cloud Run te proporcionará una URL pública para tu servicio.
-   **Variables de Entorno del Frontend**: Ve a la configuración de tu backend de Firebase App Hosting y establece la variable de entorno `API_BASE_URL` con la URL que te dio Cloud Run.

Con estos pasos, tendrás una API robusta, segura y escalable que servirá como la columna vertebral para la aplicación PrestaGana+.
