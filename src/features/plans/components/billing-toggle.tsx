"use client"; // Selector con estado (lo controla PricingCards).

import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/utils/cn";

export type BillingInterval = "month" | "year";

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}

/** Mensual / Anual como grupo de radio: el lector de pantalla anuncia cuál está elegido. */
export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const { t } = useI18n();
  const options: { value: BillingInterval; label: string }[] = [
    { value: "month", label: t.plans.monthly },
    { value: "year", label: t.plans.yearly },
  ];
  return (
    <div role="radiogroup" aria-label={`${t.plans.monthly} / ${t.plans.yearly}`} className="inline-flex rounded-md border border-border bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.value === "year" ? (
              <span className={cn("rounded-sm px-1.5 py-0.5 text-xs", selected ? "bg-background/25" : "bg-primary/15 text-accent animate-firefly-soft motion-reduce:animate-none")}>
                {t.plans.yearlySave}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
