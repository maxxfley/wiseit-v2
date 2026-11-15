/**
 * Vocabulario visual que la IA puede elegir. Son listas cerradas: el modelo nunca inventa
 * nombres de íconos ni estilos, y la UI mapea cada valor a un componente o a tokens CSS.
 * Agregar valores aquí no requiere migración (la base solo valida el formato).
 */
export const NODE_ICONS = [
  "book", "idea", "code", "data", "globe", "rocket", "star", "atom", "flask", "calculator",
  "music", "palette", "camera", "brain", "heart", "leaf", "landmark", "scale", "users", "chat",
  "tool", "cpu", "shield", "chart", "map", "compass", "puzzle", "target", "trophy", "telescope",
  "dna", "languages",
] as const;
export type NodeIcon = (typeof NODE_ICONS)[number];
export const DEFAULT_NODE_ICON: NodeIcon = "book";

/** Presets de acento por tema. "default" = estilo neutro de Wiseit. */
export const ROADMAP_THEMES = ["default", "cosmos", "nature", "history", "tech", "art", "science"] as const;
export type RoadmapTheme = (typeof ROADMAP_THEMES)[number];
export const DEFAULT_ROADMAP_THEME: RoadmapTheme = "default";
