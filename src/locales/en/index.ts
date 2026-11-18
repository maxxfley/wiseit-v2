import type { Dictionary } from "../types";
import { auth } from "./auth";
import { common } from "./common";
import { landing } from "./landing";
import { map } from "./map";
import { materials } from "./materials";
import { messages, validation } from "./messages";
import { plans } from "./plans";
import { roadmaps } from "./roadmaps";

export const en: Dictionary = { common, auth, messages, validation, landing, roadmaps, map, plans, materials };
