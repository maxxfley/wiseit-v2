import { describe, expect, it } from "vitest";
import { applyProgress, deriveStatus, groupByDifficulty, nodePercent, type RoadmapNodeView } from "./node-status";

const NOW = "2026-11-18T12:00:00.000Z";
const EARLIER = "2026-11-17T12:00:00.000Z";

function view(id: string, overrides: Partial<RoadmapNodeView> = {}): RoadmapNodeView {
  return {
    id,
    title: `Nodo ${id}`,
    description: "Descripción",
    difficulty: "Básico",
    orderIndex: 0,
    icon: "book",
    key_concepts: ["a", "b", "c", "d"],
    practice: "Práctica",
    requires: [],
    completedConcepts: [],
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

const index = (...nodes: RoadmapNodeView[]): Map<string, RoadmapNodeView> => new Map(nodes.map((n) => [n.id, n]));

describe("deriveStatus", () => {
  it("bloquea un nodo con un prerrequisito sin completar", () => {
    const pre = view("pre", { startedAt: EARLIER });
    const target = view("t", { requires: ["pre"] });
    expect(deriveStatus(target, index(pre, target))).toBe("locked");
  });

  it("bloquea si el prerrequisito no existe (dato inconsistente: se elige lo seguro)", () => {
    const target = view("t", { requires: ["fantasma"] });
    expect(deriveStatus(target, index(target))).toBe("locked");
  });

  it("'bloqueado' tiene prioridad sobre 'completado', igual que en la base", () => {
    const pre = view("pre");
    const target = view("t", { requires: ["pre"], completedAt: EARLIER });
    expect(deriveStatus(target, index(pre, target))).toBe("locked");
  });

  it("desbloquea cuando todos los prerrequisitos están completos", () => {
    const pre = view("pre", { completedAt: EARLIER });
    const target = view("t", { requires: ["pre"] });
    expect(deriveStatus(target, index(pre, target))).toBe("available");
  });

  it.each<[string, Partial<RoadmapNodeView>, string]>([
    ["completado", { completedAt: EARLIER }, "completed"],
    ["empezado", { startedAt: EARLIER }, "in_progress"],
    ["con conceptos marcados", { completedConcepts: [1] }, "in_progress"],
    ["sin actividad", {}, "available"],
  ])("un nodo %s queda %s", (_, overrides, expected) => {
    const target = view("t", overrides);
    expect(deriveStatus(target, index(target))).toBe(expected);
  });
});

describe("nodePercent", () => {
  it("redondea el porcentaje de conceptos completados", () => {
    expect(nodePercent(view("t", { key_concepts: ["a", "b", "c"], completedConcepts: [0] }))).toBe(33);
  });

  it("devuelve 100 si está completo y 0 si no tiene conceptos", () => {
    expect(nodePercent(view("t", { completedAt: EARLIER }))).toBe(100);
    expect(nodePercent(view("t", { key_concepts: [] }))).toBe(0);
  });
});

describe("applyProgress", () => {
  it("limpia los índices: deduplica, ordena y descarta los fuera de rango", () => {
    const result = applyProgress(view("t"), [2, 0, 2, -1, 9], false, NOW);
    expect(result.completedConcepts).toEqual([0, 2]);
    expect(result.completedAt).toBeNull();
  });

  it("marca el inicio una sola vez", () => {
    expect(applyProgress(view("t"), [0], false, NOW).startedAt).toBe(NOW);
    expect(applyProgress(view("t", { startedAt: EARLIER }), [0], false, NOW).startedAt).toBe(EARLIER);
  });

  it("completa el nodo al marcar todos los conceptos", () => {
    const result = applyProgress(view("t"), [0, 1, 2, 3], false, NOW);
    expect(result.completedAt).toBe(NOW);
  });

  it("`markComplete` marca todos los conceptos", () => {
    const result = applyProgress(view("t"), [], true, NOW);
    expect(result.completedConcepts).toEqual([0, 1, 2, 3]);
    expect(result.completedAt).toBe(NOW);
  });

  it("conserva la fecha de completado original y la borra al desmarcar", () => {
    const done = view("t", { completedAt: EARLIER, completedConcepts: [0, 1, 2, 3] });
    expect(applyProgress(done, [0, 1, 2, 3], false, NOW).completedAt).toBe(EARLIER);
    expect(applyProgress(done, [0, 1], false, NOW).completedAt).toBeNull();
  });

  it("no muta el nodo original", () => {
    const original = view("t");
    applyProgress(original, [0], false, NOW);
    expect(original.completedConcepts).toEqual([]);
    expect(original.startedAt).toBeNull();
  });
});

describe("groupByDifficulty", () => {
  it("agrupa por nivel en orden y omite niveles vacíos", () => {
    const nodes = [view("a", { difficulty: "Avanzado" }), view("b", { difficulty: "Básico" })];
    const groups = groupByDifficulty(nodes);

    expect(groups.map((g) => g.level)).toEqual(["Básico", "Avanzado"]);
    expect(groups[1]?.nodes.map((n) => n.id)).toEqual(["a"]);
  });
});
