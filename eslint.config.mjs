import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Reglas de calidad del proyecto aplicadas de forma automática.
  {
    rules: {
      // Prohibido `any`.
      "@typescript-eslint/no-explicit-any": "error",
      // Evitar type assertions sobre objetos literales.
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      // Ningún archivo de código supera las 150 líneas.
      "max-lines": ["error", { max: 150, skipBlankLines: false, skipComments: false }],
      // Cero bloques catch vacíos.
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },
  // database.types.ts es generado por Supabase CLI (npm run db:types): no se edita a mano.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/types/database.types.ts"]),
]);

export default eslintConfig;
