import {
  Atom, BookOpen, Brain, Calculator, Camera, ChartLine, Check, Circle, CircleDot, Compass, Cpu, Database,
  Dna, FlaskConical, Globe, Hammer, Heart, Landmark, Languages, Leaf, Lightbulb, Lock, Map as MapIcon,
  MessageSquare, Music, Palette, Puzzle, Rocket, Scale, Shield, Star, Target, Telescope, Trophy, Users,
  Code, type LucideIcon,
} from "lucide-react";
import type { NodeIcon } from "@/config/roadmap-visuals";
import type { NodeStatus } from "../../utils/node-status";

/** Cada valor permitido para la IA (config/roadmap-visuals.ts) tiene su componente. */
const ICONS: Record<NodeIcon, LucideIcon> = {
  book: BookOpen, idea: Lightbulb, code: Code, data: Database, globe: Globe, rocket: Rocket, star: Star,
  atom: Atom, flask: FlaskConical, calculator: Calculator, music: Music, palette: Palette, camera: Camera,
  brain: Brain, heart: Heart, leaf: Leaf, landmark: Landmark, scale: Scale, users: Users, chat: MessageSquare,
  tool: Hammer, cpu: Cpu, shield: Shield, chart: ChartLine, map: MapIcon, compass: Compass, puzzle: Puzzle,
  target: Target, trophy: Trophy, telescope: Telescope, dna: Dna, languages: Languages,
};

export function NodeIconView({ icon, className }: { icon: NodeIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" className={className} />;
}

interface StatusMeta {
  icon: LucideIcon;
  /** Borde + resplandor de la tarjeta del nodo. */
  card: string;
  /** Insignia (fondo + texto). */
  badge: string;
}

/** El estado se comunica con color, ícono y texto (el texto sale del diccionario: `map.status`). */
export const STATUS_META: Record<NodeStatus, StatusMeta> = {
  completed: {
    icon: Check,
    card: "border-success/70 shadow-[0_0_28px_-10px_var(--success)]",
    badge: "bg-success/15 text-success",
  },
  in_progress: {
    icon: CircleDot,
    card: "border-info/80 shadow-[0_0_28px_-8px_var(--info)]",
    badge: "bg-info/15 text-info",
  },
  available: {
    icon: Circle,
    card: "border-border-strong hover:border-muted-foreground",
    badge: "border border-border-strong text-muted-foreground",
  },
  locked: {
    icon: Lock,
    card: "border-border opacity-70",
    badge: "bg-surface-raised text-subtle",
  },
};

export const STATUS_ORDER: readonly NodeStatus[] = ["completed", "in_progress", "available", "locked"];
