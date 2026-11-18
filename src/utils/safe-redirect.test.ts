import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import { safeRedirect } from "./safe-redirect";

const FALLBACK = ROUTES.dashboard;

describe("safeRedirect", () => {
  it.each([
    ["/roadmaps", "/roadmaps"],
    ["/roadmaps/123?tab=map#nodo-2", "/roadmaps/123?tab=map#nodo-2"],
    ["/es/dashboard", "/es/dashboard"],
  ])("acepta la ruta interna %s", (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });

  it("resuelve los `..` sin salir del sitio", () => {
    expect(safeRedirect("/roadmaps/../dashboard")).toBe("/dashboard");
  });

  // Cada caso es un intento de open redirect: mandar al usuario a otro dominio tras el login.
  it.each([
    ["URL absoluta", "https://evil.com"],
    ["protocol-relative", "//evil.com"],
    ["barra invertida", "/\\evil.com"],
    ["javascript:", "javascript:alert(1)"],
    ["ruta relativa", "dashboard"],
    ["salto de línea", "/dash\nboard"],
    ["tabulación", "/\t/evil.com"],
    ["`..` que deja //host", "/..//evil.com"],
    ["cadena vacía", ""],
  ])("rechaza %s", (_, input) => {
    expect(safeRedirect(input)).toBe(FALLBACK);
  });

  it.each([null, undefined, 42, { path: "/dashboard" }, ["/dashboard"]])("rechaza el valor no string %j", (input) => {
    expect(safeRedirect(input)).toBe(FALLBACK);
  });

  it("usa el fallback recibido", () => {
    expect(safeRedirect("https://evil.com", "/es")).toBe("/es");
  });
});
