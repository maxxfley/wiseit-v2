import { describe, expect, it } from "vitest";
import { AI_LIMITS } from "@/config/ai";
import { generateInputSchema } from "./generate-input.schema";

const issue = (topic: string): string | undefined => generateInputSchema.safeParse({ topic }).error?.issues[0]?.message;

describe("generateInputSchema", () => {
  it("recorta espacios antes de validar la longitud", () => {
    expect(generateInputSchema.parse({ topic: "  SQL  " }).topic).toBe("SQL");
    expect(issue("  a  ")).toBe("topicMin");
  });

  it(`acepta hasta ${AI_LIMITS.topicMaxLength} caracteres y rechaza uno más`, () => {
    expect(issue("x".repeat(AI_LIMITS.topicMaxLength))).toBeUndefined();
    expect(issue("x".repeat(AI_LIMITS.topicMaxLength + 1))).toBe("topicMax");
  });

  it("rechaza un tema que no es texto", () => {
    expect(generateInputSchema.safeParse({ topic: 42 }).success).toBe(false);
  });
});
