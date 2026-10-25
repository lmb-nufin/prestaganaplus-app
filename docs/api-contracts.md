# Documentación de Contratos de API

Este documento describe las estructuras JSON esperadas para las respuestas de la API REST de PrestaGana+.

## 1. Dashboard de la Asociada

Este contrato define los datos que debe devolver el endpoint `GET /dashboard/{associateNumber}`.

### Estructura JSON

```json
{
  "associateInfo": {
    "name": "TERESA DE JESUS SENCION MORALES",
    "associateNumber": "1094581",
    "branch": "ORIZABA 178",
    "activationDate": "2023-06-03T00:00:00.000Z",
    "monthlyPlacementAvg": 4834.00
  },
  "associateLevel": {
    "name": "Nivel Senior",
    "badgeLabel": "ASOCIADA"
  },
  "creditLine": {
    "limit": 150000.00,
    "placed": 50000.00,
    "available": 100000.00
  },
  "paymentStatus": {
    "status": "Al Día",
    "amountDue": 0.00,
    "paymentDeadline": "2025-09-05T00:00:00.000Z"
  },
  "paymentReferences": {
    "stpClabe": "646180242910945818",
    "cieConvenio": "002287439",
    "cieReference": "17810945810",
    "payCashReference": "1354256007352"
  },
  "reports": {
    "latestCollectionReportUrl": "https://api.prestaganadigital.com/reports/1094581/latest.pdf"
  }
}
```

### Descripción de los Campos

- **`associateInfo`**: Objeto con los datos personales y de identificación de la asociada.
  - `name`: Nombre completo.
  - `associateNumber`: Número único de la asociada.
  - `branch`: Sucursal a la que pertenece.
  - `activationDate`: Fecha de alta en formato ISO 8601.
  - `monthlyPlacementAvg`: Colocación promedio mensual.

- **`associateLevel`**: Objeto con la información sobre el nivel o estatus de la asociada.
  - `name`: Nombre del nivel (ej. "Nivel Senior", "Nivel Master").
  - `badgeLabel`: Texto corto para mostrar en una insignia (ej. "ASOCIADA").

- **`creditLine`**: Objeto que detalla el estado de la línea de crédito.
  - `limit`: Límite máximo de crédito.
  - `placed`: Monto total colocado (utilizado).
  - `available`: Monto disponible para colocar.

- **`paymentStatus`**: Objeto con la situación actual de los pagos.
  - `status`: Estatus del pago (ej. "Al Día", "Atrasada").
  - `amountDue`: Monto exacto a pagar en la fecha de corte.
  - `paymentDeadline`: Fecha límite de pago en formato ISO 8601.

- **`paymentReferences`**: Objeto con las referencias necesarias para realizar pagos.
  - `stpClabe`: CLABE interbancaria para transferencias STP.
  - `cieConvenio`: Número de convenio CIE de BBVA.
  - `cieReference`: Referencia numérica para el pago CIE.
  - `payCashReference`: El número de referencia para pagos en efectivo en tiendas (el que se usa para generar el código de barras).

- **`reports`**: Objeto con enlaces a documentos relevantes.
  - `latestCollectionReportUrl`: URL directa para descargar el último reporte o relación de cobro en PDF.

## 2. Teléfono financiado (Samsung Galaxy A17 4G 128GB)

Contrato de la Fase 1 (web). La app nunca tiene precios fijos: precio, enganche, pago quincenal y total a pagar vienen siempre de estos endpoints. Todas las respuestas pueden venir directas o dentro de `{ "data": ... }`. La simulación está en `src/lib/demo-api.ts`.

**Reglas que la API debe validar en el servidor** (la app también las revisa, pero solo como UX):

- Elegibilidad, plan permitido y que no haya otra solicitud abierta ni equipo activo, en `POST telefono/solicitudes`.
- Restricción de emisión: mientras `emisionRestringida` sea `true` y el equipo esté `ACTIVO` o `BLOQUEADO`, crear, firmar o cancelar vales y préstamos personales requiere un desafío firmado por el equipo.
- Desafíos de un solo uso, con expiración, y amarrados a asociada, operación, folio y monto.

### `GET telefono/oferta/{associateNumber}`

```json
{
  "elegible": true,
  "motivo": null,
  "modelo": { "nombre": "Samsung Galaxy A17 4G", "almacenamiento": "128GB", "imagenUrl": "https://.../galaxy-a17.png" },
  "precio": 4499.00,
  "engancheMonto": 225.00,
  "planes": [
    { "quincenas": 12, "pagoQuincenal": 445.00, "totalPagar": 5340.00 },
    { "quincenas": 18, "pagoQuincenal": 320.00, "totalPagar": 5760.00 }
  ]
}
```

- `elegible: false` lleva `motivo` en texto para mostrar a la asociada.
- Si falta `elegible` (booleano), `modelo`, `precio`, `engancheMonto` o algún plan completo, la app trata la oferta como **no disponible** (fail-closed).

### `POST telefono/solicitudes`

Body: `{ "associateNumber": "1000006", "quincenas": 18, "aceptoTerminos": true }`

Respuesta: `{ "folio": "TEL-1000006-AB12CD", "estatus": "SOLICITADO" }`. Si la validación falla, 4xx con `{ "message": "..." }`; la app muestra ese mensaje.

### `GET telefono/estado/{associateNumber}`

```json
{
  "solicitud": { "folio": "TEL-1000011-DEMO", "estatus": "ACTIVO", "fecha": "2026-10-01T16:00:00.000Z" },
  "dispositivo": { "estatus": "ACTIVO", "modelo": "Samsung Galaxy A17 4G 128GB", "ultimos4Imei": "0011" },
  "emisionRestringida": true,
  "cuotas": { "actual": 3, "total": 18, "pagoQuincenal": 320.00, "saldo": 4800.00 },
  "mora": { "dias": 3, "monto": 320.00, "nivel": "AVISO" }
}
```

- `solicitud.estatus`: `SOLICITADO | ENGANCHE_CONFIRMADO | EN_PREPARACION | LISTO_PARA_RECOGER | ACTIVO | CANCELADO`.
- `dispositivo.estatus`: `ACTIVO | BLOQUEADO | REPORTADO | REVOCADO`. Con `REPORTADO` o `REVOCADO` la emisión queda bloqueada ("Acude a sucursal para reactivar").
- `mora.nivel`: `AVISO | GRACIA | BLOQUEO`. Los bloqueos Knox no los maneja la web.
- `solicitud`, `dispositivo`, `cuotas` y `mora` son opcionales; `emisionRestringida` es obligatorio. Si la respuesta falla o tiene otra forma, la app **no permite emitir vales** (fail-closed).

### `POST dispositivo/desafio`

Body: `{ "associateNumber": "1000011", "operacion": "CREAR_VALE", "folio": null, "monto": 5000 }`

- `operacion`: `CREAR_VALE | FIRMAR_VALE | PRESTAMO_PERSONAL | CANCELAR_VALE`. `CANCELAR_VALE` es una extensión de esta fase.
- Respuesta: `{ "challengeId": "uuid", "challenge": "cadena aleatoria", "expiraEn": "ISO 8601" }`.

### `POST dispositivo/verificar`

Body del contrato: `{ "challengeId", "firma", "deviceId" }`. La app agrega `associateNumber`, `operacion`, `folio` y `monto` para que la API confirme que el desafío corresponde a la operación que se está ejecutando.

Respuesta: `{ "valido": true }` o `{ "valido": false, "motivo": "..." }`. El desafío se consume en el primer intento, válido o no.

### `POST dispositivo/reporte`

Body: `{ "associateNumber": "1000011", "motivo": "ROBO" }` con `motivo`: `ROBO | PERDIDA | DANO | OTRO`. Deja el equipo en `REPORTADO` y bloquea la emisión.

### Cambio en `GET dashboardData/{associateNumber}`

Agrega `telefono` cuando hay equipo, para el desglose del Monto a Pagar:

```json
"telefono": { "pagoQuincenal": 320.00, "cuotaActual": 3, "totalCuotas": 18, "saldo": 4800.00 }
```

La app asume que `paymentStatus.amountDue` ya incluye la cuota del teléfono y su mora, y muestra Vales = `amountDue − (pagoQuincenal + mora.monto)`. Pendiente de confirmar con el backend.
