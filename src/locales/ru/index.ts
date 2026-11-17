import type { Dictionary } from "../types";
import { auth } from "./auth";
import { common } from "./common";
import { landing } from "./landing";
import { map } from "./map";
import { messages, validation } from "./messages";
import { roadmaps } from "./roadmaps";

export const ru: Dictionary = { common, auth, messages, validation, landing, roadmaps, map };
