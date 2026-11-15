import { Layers, LayoutDashboard, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  wide?: boolean;
}

// Rejilla asimétrica (2+1 / 1+2): evita tres columnas iguales.
const FEATURES: readonly Feature[] = [
  {
    icon: Layers,
    title: "Niveles de dificultad",
    description:
      "Cada ruta avanza de lo esencial a lo experto, así no te saltás los cimientos ni te estancás en lo básico.",
    wide: true,
  },
  {
    icon: Sparkles,
    title: "IA con formato estricto",
    description: "Las respuestas se validan contra un esquema antes de guardarse.",
  },
  {
    icon: ShieldCheck,
    title: "Tus datos, solo tuyos",
    description: "Cada ruta es privada: la base de datos aplica acceso por usuario.",
  },
  {
    icon: LayoutDashboard,
    title: "Un panel simple",
    description:
      "Listá tus rutas, abrí el detalle como una línea de tiempo y eliminá las que ya no necesites.",
    wide: true,
  },
];

export function Features() {
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description, wide }) => (
          <Card key={title} className={cn("p-8", wide && "md:col-span-2")}>
            <Icon aria-hidden="true" className="size-6 text-accent" />
            <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-2 max-w-[60ch] text-muted-foreground">{description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
