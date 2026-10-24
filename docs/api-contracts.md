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
