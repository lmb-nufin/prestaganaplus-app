import 'server-only';

/** true solo cuando DEMO_MODE se configuró explícitamente (acepta mayúsculas, espacios y comillas). */
export const isDemoModeEnabled = () => {
  const flag = (process.env.DEMO_MODE ?? '').trim().replace(/^["']|["']$/g, '').toLowerCase();
  return flag === 'true' || flag === '1';
};
