import { describe, expect, it } from "vitest";
import { AI_LIMITS } from "@/config/ai";
import type { RoadmapNode } from "../schemas/roadmap-output.schema";
import { normalizeNodes } from "./normalize-nodes";

function node(id: string, difficulty: RoadmapNode["difficulty"], requires: string[] = []): RoadmapNode {
  return {
    id,
    title: `Nodo ${id}`,
    description: "Descripción",
    difficulty,
    requires,
    icon: "book",
    key_concepts: ["a", "b", "c"],
    practice: "Práctica",
  };
}

const titles = (nodes: { title: string }[]): string[] => nodes.map((n) => n.title);

describe("normalizeNodes", () => {
  it("ordena Básico → Intermedio → Avanzado y conserva el orden de la IA dentro de cada nivel", () => {
    const result = normalizeNodes([
      node("a1", "Avanzado"),
      node("b1", "Básico"),
      node("i1", "Intermedio"),
      node("b2", "Básico"),
    ]);

    expect(titles(result)).toEqual(["Nodo b1", "Nodo b2", "Nodo i1", "Nodo a1"]);
  });

  it("asigna order_index 0..n-1 en el servidor", () => {
    const result = normalizeNodes([node("x", "Intermedio"), node("y", "Básico")]);
    expect(result.map((n) => n.order_index)).toEqual([0, 1]);
  });

  it("traduce los ids de la IA a order_index de los prerrequisitos", () => {
    const result = normalizeNodes([node("b1", "Básico"), node("b2", "Básico"), node("i1", "Intermedio", ["b2", "b1"])]);
    expect(result[2]?.requires).toEqual([0, 1]);
  });

  it("descarta prerrequisitos posteriores: el grafo es acíclico por construcción", () => {
    // La IA declara un ciclo: b1 depende de b2 y b2 de b1. Solo sobrevive la arista hacia atrás.
    const result = normalizeNodes([node("b1", "Básico", ["b2"]), node("b2", "Básico", ["b1"])]);

    expect(result[0]?.requires).toEqual([]);
    expect(result[1]?.requires).toEqual([0]);
  });

  it("descarta referencias inexistentes, auto-referencias y duplicados", () => {
    const result = normalizeNodes([node("b1", "Básico", ["b1", "fantasma"]), node("b2", "Básico", ["b1", "b1"])]);

    expect(result[0]?.requires).toEqual([]);
    expect(result[1]?.requires).toEqual([0]);
  });

  it("un nodo no puede depender de otro más difícil", () => {
    // La IA pone un Básico que requiere un Avanzado; tras ordenar, el Avanzado queda después.
    const result = normalizeNodes([node("a1", "Avanzado"), node("b1", "Básico", ["a1"])]);
    expect(result[0]?.requires).toEqual([]);
  });

  it("engancha al anterior un Intermedio o Avanzado sin requisitos", () => {
    const result = normalizeNodes([node("b1", "Básico"), node("i1", "Intermedio"), node("a1", "Avanzado")]);
    expect(result.map((n) => n.requires)).toEqual([[], [0], [1]]);
  });

  it("deja los Básicos sin requisitos como puntos de entrada", () => {
    const result = normalizeNodes([node("b1", "Básico"), node("b2", "Básico")]);
    expect(result.map((n) => n.requires)).toEqual([[], []]);
  });

  it("no engancha nada si el primer nodo no es Básico", () => {
    const result = normalizeNodes([node("i1", "Intermedio")]);
    expect(result[0]?.requires).toEqual([]);
  });

  it(`limita los prerrequisitos a ${AI_LIMITS.maxPrerequisites}, quedándose con los primeros`, () => {
    const basics = ["b1", "b2", "b3", "b4", "b5"].map((id) => node(id, "Básico"));
    const result = normalizeNodes([...basics, node("i1", "Intermedio", ["b5", "b4", "b3", "b2", "b1"])]);

    expect(result[5]?.requires).toEqual([0, 1, 2].slice(0, AI_LIMITS.maxPrerequisites));
  });

  it("con ids repetidos, las referencias apuntan al primero", () => {
    const result = normalizeNodes([node("x", "Básico"), node("x", "Básico"), node("i1", "Intermedio", ["x"])]);
    expect(result[2]?.requires).toEqual([0]);
  });

  it("no guarda el id de la IA y devuelve [] para una entrada vacía", () => {
    expect(normalizeNodes([node("b1", "Básico")])[0]).not.toHaveProperty("id");
    expect(normalizeNodes([])).toEqual([]);
  });
});
