import type { Dictionary } from "../types";

export const plans: Dictionary["plans"] = {
  metaTitle: "Plans",
  eyebrow: "Plans",
  title: "Learn at your pace. Go further, without limits.",
  subtitle: "Start for free. Upgrade to Premium whenever you want to track your progress and learn faster.",
  monthly: "Monthly",
  yearly: "Yearly",
  yearlySave: "Save 25%",
  perMonth: "/mo",
  perYear: "/yr",
  yearlyEquivalent: "That's {price}/mo",
  free: {
    name: "Free",
    description: "To discover Wiseit.",
    features: [
      "4 generated paths per day",
      "Up to 4 saved paths",
      "Interactive map and list view",
      "Progress on the first topic of each path",
    ],
  },
  premium: {
    name: "Premium",
    description: "To learn for real.",
    badge: "Recommended",
    features: [
      "10 generated paths per day, with a more powerful AI model",
      "Unlimited saved paths",
      "Progress on every topic: check off, complete and unlock",
      "Coming soon: \"Find material\" and \"Go further\"",
    ],
  },
  cta: {
    signup: "Create a free account",
    subscribe: "Upgrade to Premium",
    current: "Your current plan",
    manage: "Manage subscription",
    loading: "Opening checkout…",
  },
  notes: {
    taxes: "Prices in US dollars, taxes included. Payments are processed securely by Paddle.",
    cancel: "Cancel anytime from \"Manage subscription\" and keep Premium until the end of the paid period.",
    sandbox: "Test mode: use card 4242 4242 4242 4242, any future date and any CVC.",
    unavailable: "Payments are not available right now.",
  },
  sidebar: { free: "Free plan", premium: "Premium", upgrade: "Upgrade to Premium" },
  activation: {
    pending: "Thank you! We're activating your Premium. It may take a few seconds…",
    done: "All set! You're Premium now. Enjoy.",
    slow: "Your payment went through, but activation is taking a while. Reload the page in a minute.",
  },
  cancellation: {
    endsOn: "Your Premium ends on {date}.",
    detail: "You canceled the renewal: you keep every feature until then, and then you move to the free plan.",
    resume: "Reactivate Premium",
    resuming: "Reactivating…",
    resumed: "All set! Your Premium will renew again.",
  },
  upsell: "See Premium",
};
