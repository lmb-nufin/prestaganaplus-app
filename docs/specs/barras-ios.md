# Especificación: header y barra inferior estables en iPhone

**Rama:** `fix/barras-ios`, creada desde `feature/telefono-financiado`. PR hacia `feature/telefono-financiado`, sin merge.

## Problema (reportado por el dueño, Chrome en iPhone)

Al interactuar (hacer scroll, abrir menús, escribir), la barra de título desaparece y la barra inferior (Dashboard, Vales, Vale Nuevo, Perfil, Soporte) queda flotando a media pantalla con un espacio vacío debajo.

## Causa

El header y la barra inferior usan `position: fixed` sobre el scroll del documento. En iOS (WebKit, que usan Safari y Chrome en iPhone), las barras del navegador crecen y se encogen al hacer scroll y el viewport cambia de alto; durante esos cambios, y después de abrir el teclado o un diálogo, WebKit coloca los elementos `fixed` respecto a un viewport desfasado. En Chromium de escritorio con emulación móvil no se reproduce: no hay desbordamiento horizontal, la escala es 1 y las barras quedan en su lugar.

## Solución: "app shell"

- Nuevo `src/components/app-shell.tsx`: contenedor de `100dvh` en columna con `overflow: hidden`; arriba el header, en medio el contenido como **único** contenedor con scroll (`overflow-y: auto`, `overscroll-behavior: contain`) y abajo la barra inferior. El documento ya no hace scroll, así que no hay nada que WebKit pueda desfasar.
- `Header`, `SubPageHeader` y `BottomNavBar` dejan de ser `fixed`: son parte normal del layout (`flex-shrink-0`). Se quitan los espaciadores de 57px y el `padding-bottom` de 6rem que reservaba el lugar de la barra fija.
- Usan el shell: `(app)/layout.tsx` (Dashboard, Notificaciones, Perfil, Soporte), `vales/page.tsx` y `vales/loading.tsx`, `new-vale-flow.tsx`, `telefono/page.tsx` y `sign-page-content.tsx`.
- Sin cambios de diseño, textos, reglas ni server actions.

## Criterios

- En cualquier pantalla con header o barra inferior, a 390x844 y en iPhone emulado: el documento no hace scroll (`scrollHeight == innerHeight`), el header queda en `top = 0` y la barra inferior en `bottom = alto del viewport` después de hacer scroll hasta el final, abrir el menú lateral y cerrarlo, y abrir y cerrar el diálogo de Pagar Ahora.
- El contenido se puede recorrer completo: el último elemento de cada pantalla queda visible arriba de la barra inferior.
- Al navegar entre pantallas del menú, la nueva empieza arriba.
- `npx playwright test` en verde y typecheck sin errores nuevos.

## Limitación

No hay WebKit instalado en esta máquina: la verificación automatizada corre en Chromium con emulación de iPhone. La prueba final es en el iPhone del dueño con el deploy de preview.
