import { cn } from "@/utils/cn";

interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  /** Clase de color del arco (ej. "text-success"). */
  tone?: string;
  /** Texto accesible ya traducido (ej. "40% completado"). */
  label: string;
  className?: string;
}

/** Anillo de progreso en SVG. El valor también se expone como texto accesible. */
export function ProgressRing({ percent, size = 32, stroke = 3, tone = "text-info", label, className }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <span
      role="img"
      aria-label={label}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-border-strong" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn("transition-[stroke-dashoffset] duration-500 ease-out", tone)}
        />
      </svg>
    </span>
  );
}
