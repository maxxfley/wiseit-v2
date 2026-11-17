import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  period?: string;
  priceNote?: string;
  badge?: string;
  features: readonly string[];
  highlighted?: boolean;
  action: ReactNode;
}

/** Tarjeta de un plan: nombre, precio, beneficios y acción. Presentacional (sin estado). */
export function PlanCard({ name, description, price, period, priceNote, badge, features, highlighted, action }: PlanCardProps) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-surface p-6",
        highlighted ? "border-primary/60 shadow-glow" : "border-border",
      )}
    >
      {badge ? (
        <span className="absolute -top-3 left-6 rounded-sm bg-primary px-2 py-0.5 font-mono text-xs font-medium text-primary-foreground">
          {badge}
        </span>
      ) : null}
      <h2 className="font-display text-2xl font-medium text-foreground">{name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-medium tracking-[-0.8px] text-foreground">{price}</span>
        {period ? <span className="text-sm text-muted-foreground">{period}</span> : null}
      </p>
      {/* Reserva la línea aunque no haya nota: las dos tarjetas quedan alineadas. */}
      <p className="mt-1 min-h-5 text-sm text-subtle">{priceNote}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-body">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="mt-8">{action}</div>
    </article>
  );
}
