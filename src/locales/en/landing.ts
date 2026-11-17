import type { Dictionary } from "../types";

export const landing: Dictionary["landing"] = {
  hero: {
    eyebrow: "Visual, personalized learning paths",
    title: "Learn any topic with a clear path.",
    body: "Write what you want to master and Wiseit builds a step-by-step journey, ordered from Basic to Advanced, so you always know what to study next.",
    primaryCta: "Create my first path",
    secondaryCta: "I already have an account",
  },
  preview: {
    label: "Path · PostgreSQL",
    steps: ["What a relational database is", "Joins, indexes and normalization", "Query plans and partitioning"],
  },
  how: {
    title: "From an idea to a study plan",
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
    levels: {
      title: "Difficulty levels",
      description:
        "Every path moves from the essentials to expert level, so you don't skip the foundations or get stuck on the basics.",
    },
    strict: {
      title: "AI with a strict format",
      description: "Responses are validated against a schema before being saved.",
    },
    privacy: {
      title: "Your data, only yours",
      description: "Every path is private: the database enforces per-user access.",
    },
    panel: {
      title: "A simple dashboard",
      description: "List your paths, open the details as a timeline and delete the ones you no longer need.",
    },
  },
  finalCta: {
    title: "Start your first path today",
    body: "Creating an account is free and takes less than a minute.",
    cta: "Sign up",
  },
};
