import type { Dictionary } from "../types";

export const map: Dictionary["map"] = {
  status: { completed: "Completed", in_progress: "In progress", available: "Available", locked: "Locked" },
  premium: {
    title: "Your progress, with Wiseit Premium",
    body: "On the free plan you can save progress on the first topic. With Premium you check off concepts across the whole path, complete topics and unlock the next ones.",
  },
  nodeAria: "{title}. {status}, {percent}%",
  percentDone: "{percent}% completed",
  overallAria: "Overall progress: {percent}%",
  overallTitle: "Your progress",
  overallCount: "{completed} of {total} topics completed",
  legend: "Status legend",
  zoomControls: "Zoom controls",
  panelAria: "Details: {title}",
  close: "Close panel",
  completeFirst: "Complete first:",
  content: "Content",
  practice: "Practice",
  noConcepts: "This topic has no key concepts.",
  start: "Start studying",
  complete: "Mark as completed",
  reset: "Reset progress",
};
