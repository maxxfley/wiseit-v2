import { describe, expect, it } from "vitest";
import { AI_LIMITS } from "@/config/ai";
import { DEFAULT_NODE_ICON, DEFAULT_ROADMAP_THEME } from "@/config/roadmap-visuals";
import { DIFFICULTY_LEVELS, roadmapOutputSchema, type DifficultyLevel } from "./roadmap-output.schema";

function rawNode(id: number, difficulty: DifficultyLevel): Record<string, unknown> {
  return {
    id: `n${id}`,
    title: `  Nodo ${id}  `,
    description: "Descripción",
    difficulty,
    requires: [],
    icon: "book",
    key_concepts: ["a", "b", "c"],
    practice: "Práctica",
  };
}

/** Ruta válida mínima: `perLevel` nodos de cada nivel. */
function rawRoadmap(perLevel = 3): { title: string; theme: string; nodes: Record<string, unknown>[] } {
  const nodes = DIFFICULTY_LEVELS.flatMap((level, l) =>
    Array.from({ length: perLevel }, (_, i) => rawNode(l * perLevel + i, level)),
  );
  return { title: "Ruta", theme: "tech", nodes };
}

describe("roadmapOutputSchema", () => {
  it("acepta una ruta válida y recorta espacios", () => {
    const result = roadmapOutputSchema.parse(rawRoadmap());
    expect(result.nodes[0]?.title).toBe("Nodo 0");
  });

  it("un ícono o tema desconocido cae al valor por defecto en vez de invalidar la ruta", () => {
    const raw = rawRoadmap();
    raw.theme = "inventado";
    raw.nodes[0] = { ...raw.nodes[0], icon: "dragon" };

    const result = roadmapOutputSchema.parse(raw);
    expect(result.theme).toBe(DEFAULT_ROADMAP_THEME);
    expect(result.nodes[0]?.icon).toBe(DEFAULT_NODE_ICON);
  });

  it("exige al menos 2 pasos de cada nivel", () => {
    const raw = rawRoadmap();
    raw.nodes = raw.nodes.map((n) => (n.difficulty === "Avanzado" ? { ...n, difficulty: "Intermedio" } : n));
    raw.nodes[raw.nodes.length - 1] = { ...raw.nodes[raw.nodes.length - 1], difficulty: "Avanzado" };

    expect(roadmapOutputSchema.safeParse(raw).success).toBe(false);
  });

  it(`rechaza menos de ${AI_LIMITS.minNodes} o más de ${AI_LIMITS.maxNodes} nodos`, () => {
    const tooFew = rawRoadmap(Math.floor((AI_LIMITS.minNodes - 1) / 3));
    const tooMany = rawRoadmap(Math.ceil((AI_LIMITS.maxNodes + 1) / 3));

    expect(roadmapOutputSchema.safeParse(tooFew).success).toBe(false);
    expect(roadmapOutputSchema.safeParse(tooMany).success).toBe(false);
  });

  it.each([
    ["dificultad inexistente", { difficulty: "Experto" }],
    ["menos de 3 conceptos", { key_concepts: ["a", "b"] }],
    ["título vacío tras recortar", { title: "   " }],
  ])("rechaza un nodo con %s", (_, override) => {
    const raw = rawRoadmap();
    raw.nodes[0] = { ...raw.nodes[0], ...override };
    expect(roadmapOutputSchema.safeParse(raw).success).toBe(false);
  });
});
