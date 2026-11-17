import type { Dictionary } from "../types";

export const roadmaps: Dictionary["roadmaps"] = {
  dashboard: {
    title: "Dashboard",
    createHeading: "Create a path",
    topicLabel: "What do you want to learn?",
    topicPlaceholder: "E.g. PostgreSQL, music theory, photography…",
    generate: "Generate path",
    generating: "Generating your path…",
    remaining: "You have {remaining} of {limit} attempts left today.",
    recentHeading: "Your latest paths",
    viewAll: "View all",
  },
  list: {
    title: "My paths",
    emptyTitle: "You don't have any paths yet.",
    emptyBody: "Pick a topic and we'll generate your first learning path.",
    emptyCta: "Create a path",
    steps: { one: "{count} step", few: "{count} steps", many: "{count} steps", other: "{count} steps" },
  },
  delete: {
    button: "Delete",
    aria: "Delete {title}",
    title: "Delete this path?",
    body: "“{title}” and all its steps will be permanently deleted. This doesn't give back today's attempts.",
    cancel: "Cancel",
    pending: "Deleting…",
  },
  detail: {
    metaTitle: "Learning path",
    back: "← My paths",
    topics: { one: "{count} topic", few: "{count} topics", many: "{count} topics", other: "{count} topics" },
    created: "created on {date}",
    legacy:
      "This path predates the interactive map, so it's only shown as a list. Generate it again to see it as a map and track your progress.",
    notFoundTitle: "We couldn't find that path",
    notFoundBody: "It may have been deleted or it may not belong to you.",
    notFoundBack: "Back to my paths",
  },
  timeline: { step: "Step {n}", keyConcepts: "Key concepts", practice: "Practice: " },
  views: { label: "Path view", list: "List", map: "Interactive map" },
};
