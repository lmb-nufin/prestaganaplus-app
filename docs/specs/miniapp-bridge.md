# Contrato web ↔ miniapp Android (Fase 2)

Para el equipo Android. Describe lo que la web app ya espera de la miniapp del Samsung PrestaGana. El lado web está en `src/hooks/use-device-bridge.ts`, `src/components/device-gate.tsx` y `src/lib/phone.ts`.

## Cuándo se usa

Si la API dice `emisionRestringida: true` y el equipo está `ACTIVO` o `BLOQUEADO`, la web solo permite crear vales, firmarlos, cancelarlos y crear préstamos personales cuando detecta el bridge. Desde cualquier otro navegador, la asociada ve el aviso "Por seguridad, tus vales se emiten desde tu Samsung PrestaGana". Consultar saldo, pagar y pedir soporte funcionan siempre.

## El bridge

La miniapp abre la web en un WebView e inyecta, antes de que cargue la página o en cuanto pueda, este objeto:

```ts
window.PrestaGanaDevice = {
  // Identificador estable del equipo, el mismo que el backend tiene registrado.
  getDeviceId(): Promise<string>;
  // Firma el desafío con la llave privada del equipo y regresa la firma (por ejemplo, base64).
  signChallenge(challenge: string): Promise<string>;
};
```

- **Detección:** la web solo mira si existe `window.PrestaGanaDevice` con esas dos funciones. **Nunca** usa el user agent.
- **Inyección tardía:** si el objeto aparece después de cargar la página, la miniapp debe disparar `window.dispatchEvent(new Event('prestagana-device-ready'))`. La web espera unos 600 ms antes de concluir que no hay bridge.
- **Errores:** si la firma falla o la asociada la cancela, la promesa debe rechazarse con un `Error` cuyo `message` se pueda mostrar.

## Flujo de una operación firmada

1. La asociada confirma la operación en la web (crear vale, firmar, cancelar o préstamo personal).
2. La web llama a la server action `requestDeviceChallenge(operacion, { folio, monto })`. El servidor toma la asociada de la sesión y pide `POST dispositivo/desafio`.
3. La web llama a `getDeviceId()` y a `signChallenge(challenge)`.
4. La web envía el formulario con tres campos extra: `challengeId`, `firma` y `deviceSignatureId` (el `deviceId` del bridge; se llama distinto para no chocar con el campo de auditoría `deviceId`).
5. La server action vuelve a consultar `GET telefono/estado` y verifica con `POST dispositivo/verificar`. Sin firma válida, rechaza la operación.

**D2:** para firmar un vale se siguen pidiendo OTP por SMS y NIP; la firma del equipo se suma, no los reemplaza.

| Operación | Cuándo | `folio` | `monto` |
|---|---|---|---|
| `CREAR_VALE` | Vale de cliente nuevo o existente | — | monto del vale |
| `PRESTAMO_PERSONAL` | Préstamo personal en efectivo | — | monto del préstamo |
| `FIRMAR_VALE` | Firma OTP + NIP | folio | monto del vale |
| `CANCELAR_VALE` | Cancelación con NIP | folio | — |

## Lo que debe garantizar el backend

- El desafío es aleatorio, de un solo uso (se consume al primer intento de verificación), expira (la simulación usa 5 minutos) y queda amarrado a asociada, operación, folio y monto.
- `dispositivo/verificar` comprueba la firma con la llave pública registrada para ese `deviceId` y que el `deviceId` pertenezca a la asociada.
- La llave debe vivir en el Android Keystore (respaldada por hardware) y registrarse con atestación de llave; conviene sumar Play Integrity al registro y a cada verificación.

## Modo demo

Con `DEMO_MODE=true`, abrir cualquier página con `?demoDevice=1` instala un bridge simulado (`src/components/demo-device-bridge.tsx`):

- `getDeviceId()` regresa `DEMO-DEVICE-0001`.
- `signChallenge(c)` regresa `"demo-" + c`, y la verificación simulada acepta solo eso.
- La elección se recuerda en la pestaña; `?demoDevice=0` lo apaga.
- El componente solo se monta cuando el servidor corre con `DEMO_MODE=true`. Fuera del modo demo no existe, y aunque alguien inyectara un objeto igual, la API real no aceptaría esas firmas.
