// Node 25 trae un localStorage global que, sin --localstorage-file, no tiene getItem. Next.js en
// desarrollo lo detecta como si fuera el del navegador y truena con "localStorage.getItem is not a
// function". Se quita para que el servidor se comporte como en Node 20 y 22, donde no existe.
export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const storage = (globalThis as { localStorage?: { getItem?: unknown } }).localStorage;
  if (storage && typeof storage.getItem !== 'function') {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}
