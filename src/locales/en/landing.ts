import type { Dictionary } from "../types";

export const landing: Dictionary["landing"] = {
  hero: {
    eyebrow: "Visual, personalized learning paths",
    title: "Learn any topic with a clear path.",
    body: "Write what you want to master and Wiseit builds a step-by-step journey, ordered from Basic to Advanced, so you always know what to study next.",
    primaryCta: "Create my first path",
    secondaryCta: "I already have an account",
    topicLabel: "Topic you want to learn",
    topicPlaceholder: "Create yours: what do you want to learn?",
  },
  preview: {
    label: "Path · PostgreSQL",
    steps: ["What a relational database is", "Joins, indexes and normalization", "Query plans and partitioning"],
    concepts: ["JOIN types (INNER, LEFT, RIGHT)", "B-tree indexes and when to use them", "Normal forms (1NF, 2NF, 3NF)"],
    mapAria: "Sample interactive map: three connected PostgreSQL topics",
    cta: "Create yours",
  },
  how: {
    title: "From an idea to a study plan",
    visual: { generating: "Generating your path…", ready: "Your path is ready" },
    steps: [
      {
        title: "Pick a topic",
        description: "Any concept or discipline you want to master, from SQL to music theory.",
      },
      {
        title: "Get your path",
        description:
          "The AI organizes the concepts into three levels (Basic, Intermediate and Advanced) with a description of each step.",
      },
      {
        title: "Follow the journey",
        description: "Save the path to your dashboard and come back whenever you want, always in the right order.",
      },
    ],
  },
  features: {
    hint: {
      pointer: "Hover over a card to see what Premium adds.",
      touch: "Tap a card to see what Premium adds.",
    },
    badges: { free: "Free", premium: "Premium" },
    items: {
      routes: {
        title: "AI learning paths",
        free: "4 paths per day, from the essentials to expert level, validated before being saved.",
        premium: "10 paths per day with a more powerful AI model, going deeper into every topic.",
      },
      progress: {
        title: "Your progress",
        free: "Check off the concepts of the first topic of each path.",
        premium: "Progress on every topic: check off, complete and unlock the next one.",
      },
      material: {
        title: "Find material",
        free: "1 recommended link per path, found with web search.",
        premium: "Up to 5 sources per topic: articles, videos, documentation and forums.",
      },
      saved: {
        title: "Your paths",
        free: "Up to 4 saved paths, as an interactive map or a list.",
        premium: "Unlimited saved paths and \"Go further\" to extend a path once you finish it.",
      },
    },
  },
};
