import type { Dictionary } from "../types";

export const common: Dictionary["common"] = {
  meta: {
    description: "AI-generated learning paths, organized into Basic, Intermediate and Advanced levels.",
    notFound: "Page not found",
  },
  nav: {
    primary: "Main",
    dashboard: "Dashboard",
    myRoadmaps: "My paths",
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    userFallback: "User",
  },
  language: { label: "Language" },
  footer: { tagline: "AI learning paths, from Basic to Advanced." },
  levels: { Básico: "Basic", Intermedio: "Intermediate", Avanzado: "Advanced" },
  error: {
    title: "Something went wrong",
    body: "An unexpected error occurred. You can try again; if it persists, come back later.",
    sectionTitle: "We couldn't load this section",
    sectionBody: "Try again; if it persists, come back later.",
    retry: "Try again",
  },
  notFound: {
    title: "This page doesn't exist",
    body: "The link may be broken or the page may have moved.",
    back: "Back to home",
  },
};
