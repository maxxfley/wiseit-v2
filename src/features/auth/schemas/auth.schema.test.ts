import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth.schema";

const VALID = { email: "ana@example.com", password: "segura123", confirmPassword: "segura123" };

/** Clave de validación del primer error (los mensajes son claves que traduce el cliente). */
function firstIssue(result: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined {
  return result.error?.issues[0]?.message;
}

describe("signupSchema", () => {
  it("acepta credenciales válidas", () => {
    expect(signupSchema.safeParse(VALID).success).toBe(true);
  });

  it.each([
    ["corta", "abc12", "passwordMin"],
    ["sin número", "solamente", "passwordNumber"],
    ["sin letra", "12345678", "passwordLetter"],
    ["más larga que el límite de bcrypt", `a1${"x".repeat(71)}`, "passwordMax"],
  ])("rechaza una contraseña %s", (_, password, key) => {
    const result = signupSchema.safeParse({ ...VALID, password, confirmPassword: password });
    expect(firstIssue(result)).toBe(key);
  });

  it("asocia el error de confirmación al campo confirmPassword", () => {
    const result = signupSchema.safeParse({ ...VALID, confirmPassword: "otra1234" });
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
    expect(firstIssue(result)).toBe("passwordsMismatch");
  });

  it("con la confirmación vacía muestra un solo error, no dos", () => {
    const result = signupSchema.safeParse({ ...VALID, confirmPassword: "" });
    expect(result.error?.issues.map((i) => i.message)).toEqual(["confirmRequired"]);
  });

  it("rechaza un email inválido", () => {
    expect(firstIssue(signupSchema.safeParse({ ...VALID, email: "ana@" }))).toBe("emailInvalid");
  });
});

describe("loginSchema", () => {
  it("no re-valida la fortaleza: solo exige que venga una contraseña", () => {
    expect(loginSchema.safeParse({ email: VALID.email, password: "x" }).success).toBe(true);
    expect(firstIssue(loginSchema.safeParse({ email: VALID.email, password: "" }))).toBe("passwordRequired");
  });
});
