interface Step {
  title: string;
  description: string;
}

const STEPS: readonly Step[] = [
  {
    title: "Elegí un tema",
    description: "Cualquier concepto o disciplina que quieras dominar, desde SQL hasta teoría musical.",
  },
  {
    title: "Recibí tu ruta",
    description:
      "La IA ordena los conceptos en tres niveles (Básico, Intermedio y Avanzado) con una descripción de cada paso.",
  },
  {
    title: "Seguí el recorrido",
    description: "Guardá la ruta en tu panel y volvé a ella cuando quieras, siempre en el orden correcto.",
  },
];

/** Timeline vertical con riel lateral (DESIGN.md › Grid & Container). */
export function HowItWorks() {
  return (
    <section data-snap-section className="mx-auto w-full max-w-page px-6 py-section">
      <h2 className="max-w-[20ch] font-serif text-4xl font-medium tracking-[-0.8px] text-foreground">
        De una idea a un plan de estudio
      </h2>
      <ol className="mt-12 max-w-2xl space-y-10 border-l border-border-strong pl-8">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-primary"
            />
            <span className="font-mono text-xs font-medium tracking-[0.6px] text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
