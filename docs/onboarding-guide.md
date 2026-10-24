# Guía de Capacitación para Personal: App PrestaGana+

## 1. Introducción

¡Bienvenidas a la nueva aplicación PrestaGana+!

Esta guía está diseñada para capacitar a nuestro personal sobre cómo usar la aplicación y cómo asistir a nuestras asociadas. El objetivo es entender cada función desde la perspectiva del usuario para poder resolver dudas y dar el mejor soporte posible.

**Este documento NO es técnico.** Se enfoca en los flujos de uso y las funcionalidades.

---

## 2. El Primer Paso: Registro y Acceso

Toda asociada nueva debe registrarse para poder usar la aplicación. Este es un proceso de única vez que vincula su número de asociada con su teléfono y crea una firma de seguridad (NIP).

### Flujo de Registro en 3 Pasos:

#### **Paso 1: Verificación de Identidad**
La asociada comienza en la pantalla de "Crear Nueva Cuenta". Aquí debe ingresar:
1.  **Número de Asociada**: Su identificador único.
2.  **Teléfono**: Su número de celular a 10 dígitos. **Importante:** Debe ser el mismo número que tenemos registrado en nuestros sistemas.
3.  **Nombre(s) y Apellidos**: Tal como aparecen en su registro.
4.  **Fecha de Nacimiento**.

**¿Qué pasa si los datos no coinciden?** La aplicación mostrará un error. La asociada debe verificar que los datos sean correctos o contactar a soporte para actualizarlos en nuestro sistema.

![Pantalla de Verificación de Identidad](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0AIdentidad)

#### **Paso 2: Verificación por OTP**
- Una vez que la identidad se valida, la aplicación envía un **código de 6 dígitos (OTP)** por SMS al teléfono que registró.
- La asociada debe ingresar este código para demostrar que tiene posesión del número de teléfono.
- **¿Y si no llega el código?** Puede solicitar uno nuevo después de 60 segundos.

![Pantalla de Verificación OTP](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0AOTP)

#### **Paso 3: Creación del NIP de Seguridad**
- Este es el paso final. La asociada crea un **NIP de 4 a 6 dígitos**.
- **¡Este NIP es CRÍTICO!** Funciona como su **firma electrónica**. Lo usará para autorizar cada vale que emita. Es secreto, personal e intransferible.
- Debe ingresarlo dos veces para confirmarlo.

![Pantalla de Creación de NIP](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0ANIP)

Una vez completado, el registro finaliza y la asociada es llevada al dashboard principal de la aplicación.

---

## 3. El Centro de Control: El Dashboard Principal

El dashboard es la pantalla de inicio. Ofrece un resumen completo y en tiempo real del estado de la asociada.

![Pantalla del Dashboard Principal](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0ADashboard)

### Tarjetas del Dashboard:

- **Línea PrestaGana (Tarjeta Principal)**:
    - **Colocado**: La suma total del dinero de los vales que ha firmado y que están activos (aún no canjeados por el cliente) o ya fueron canjeados.
    - **Disponible**: El monto que aún tiene libre para crear y firmar nuevos vales. **Si este monto es menor a $3,000, se mostrará en rojo como una alerta visual.**
    - **Límite de crédito**: El total de su línea de crédito.

- **Situación Actual**:
    - Muestra si la asociada está "Al Día" o "Atrasada" en sus pagos.
    - Indica el "Monto a Pagar" exacto en su próxima fecha de corte.
    - Contiene el botón "Pagar Ahora", que abre las diferentes opciones para liquidar su saldo.

- **Relación de Cobro**:
    - Un acceso directo para descargar su último reporte o relación de cobro en formato PDF.

- **Datos de la Asociada**:
    - Muestra su nombre completo, número de asociada, sucursal y fecha de alta.

- **Nivel de Asociada**:
    - Muestra su nivel actual dentro del programa PrestaGana+ (ej. Senior, Master).

---

## 4. La Herramienta Clave: Gestión de Vales

Esta es la función principal de la app.

### Cómo Crear un Vale Nuevo:

1.  Desde el botón flotante en la barra de navegación inferior, o el botón en la tarjeta de "Línea PrestaGana".
2.  Se abre un formulario donde la asociada debe ingresar los datos del **cliente final**:
    - Nombre(s) y Apellidos (deben ser idénticos a la INE del cliente).
    - Fecha de Nacimiento del cliente.
    - Monto del préstamo.
    - Plazo en quincenas.
    - Teléfono del cliente a 10 dígitos.
3.  Al dar clic en "Crear Vale", el vale se genera y aparece en el historial en estado **"PENDIENTE"**.

![Formulario de Creación de Vale](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0ACrear%20Vale)

### Historial de Vales:

- Se accede desde el ícono "Vales" en la barra de navegación.
- Se divide en dos pestañas:
    - **Activos**: Muestra los vales con estatus "PENDIENTE" (recién creados, sin firmar) y "FIRMADO" (autorizados por la asociada, listos para canjear).
    - **Canjeados**: Muestra el historial de vales que el cliente final ya presentó y cobró en sucursal.

![Pantalla de Historial de Vales](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0AHistorial%20de%20Vales)

### Detalle y Firma de un Vale:

- Al tocar cualquier vale del historial, se abre la pantalla de "Detalles del Vale".
- Aquí se puede ver toda la información del vale.
- Si el vale está "PENDIENTE", aquí es donde la asociada lo firma.

#### **El Proceso de Firma (Doble Factor de Seguridad):**

1.  **Botón "Enviar Código de Firma"**: Al presionarlo, la asociada recibe un **OTP (código de 6 dígitos) en su propio teléfono**. Esto confirma que es ella quien está realizando la operación.
2.  **Ingresar OTP y NIP**: La asociada introduce el código OTP que recibió y su NIP de seguridad (el que creó durante el registro).
3.  **Confirmación**: Si ambos son correctos, el vale cambia su estatus a **"FIRMADO"**. El monto de este vale se descuenta inmediatamente de su crédito "Disponible" y se suma al "Colocado".

### Vale Firmado: QR y Envío por WhatsApp

- Una vez firmado, en la misma pantalla de detalles aparece el **Vale Digital**:
    - Un **código QR** que el cliente puede presentar en sucursal para escanear.
    - Un botón para **"Enviar por WhatsApp"**. Esto envía un mensaje pre-escrito al cliente con un enlace para que pueda ver su vale digital.

![Pantalla de Vale Firmado con QR](https://placehold.co/350x700/EFEFEF/3A3A3A?text=Screenshot:%0AVale%20con%20QR)

### Cancelación de un Vale:

- **¿Qué vales se pueden cancelar?** Los que están en estado "PENDIENTE" o "FIRMADO". Un vale "CANJEADO" ya no se puede cancelar.
- **¿Cómo se cancela?** En la pantalla de detalles del vale, existe el botón "Cancelar Vale".
- **Seguridad**: Para confirmar la cancelación, la asociada debe ingresar su NIP de seguridad. Es una acción irreversible.
- **Efecto en la línea de crédito**: Si se cancela un vale que ya estaba "FIRMADO", el monto de ese vale se regresa al crédito "Disponible" de la asociada.

---

## 5. Perfil y Soporte

### Mi Perfil:
- Muestra los datos de la asociada (nombre, email, teléfono, No. de asociada).
- Permite acceder a las opciones para restablecer el NIP (que dirige a los canales de soporte).

### Soporte:
- Ofrece acceso directo para contactar al equipo de soporte de PrestaGana+ vía WhatsApp o llamada telefónica. Es el canal para resolver cualquier duda o problema que la asociada no pueda solucionar desde la app.

---

Esta guía cubre todas las funcionalidades actuales. Es vital que nuestro personal domine estos flujos para ofrecer una experiencia de soporte de primer nivel a nuestras asociadas.
