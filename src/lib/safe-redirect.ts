const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Ruta interna a la que se puede mandar a la asociada después del login.
 * Acepta rutas relativas ("/vales") o URLs absolutas del mismo host (NextAuth agrega
 * callbackUrl completo al redirigir al login). Cualquier otra cosa regresa "/".
 */
export function safeCallbackPath(raw: unknown, host: string | null): string {
  if (typeof raw !== 'string' || raw === '') return '/';
  let url: URL;
  try {
    url = new URL(raw, 'http://internal');
  } catch {
    return '/';
  }
  const isRelative = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\');
  const isSameHost = !isRelative && !!host && url.host === host && /^https?:$/.test(url.protocol);
  if (!isRelative && !isSameHost) return '/';
  // "/.//otro" se normaliza a "//otro": tras parsear se revisa de nuevo.
  if (url.pathname.startsWith('//') || url.pathname.startsWith('/\\')) return '/';
  if (PUBLIC_PATHS.includes(url.pathname)) return '/';
  return `${url.pathname}${url.search}`;
}
