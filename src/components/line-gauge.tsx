const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Porcentaje colocado de la línea, acotado a 0–100 y redondeado; límite 0 = 0%. */
export function placedPercent(placed: number, limit: number) {
  if (!limit || limit <= 0 || !Number.isFinite(placed)) return 0;
  return Math.round(Math.min(Math.max((placed / limit) * 100, 0), 100));
}

/** Medidor circular de la Línea PrestaGana: el avance arranca arriba y gira en el sentido del reloj. */
export function LineGauge({ percent }: { percent: number }) {
  return (
    <div
      role="img"
      aria-label={`${percent}% de la línea colocada`}
      className="relative h-32 w-32 flex-shrink-0"
      data-testid="line-gauge"
    >
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#F6E3E8" strokeWidth="12" />
        {percent > 0 && (
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="font-headline text-2xl font-bold tabular-nums text-[#9E2F4B]">{percent}%</span>
        <span className="text-[11px] text-muted-foreground">colocado</span>
      </div>
    </div>
  );
}
