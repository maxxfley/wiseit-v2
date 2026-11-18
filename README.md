# Wiseit

[![CI](https://github.com/maxxfley/wiseit-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/maxxfley/wiseit-v2/actions/workflows/ci.yml)

Plataforma de aprendizaje guiado: la IA genera rutas (roadmaps) por niveles Básico, Intermedio y Avanzado.

Stack: Next.js (App Router) · TypeScript estricto · Tailwind CSS v4 · Supabase · Groq.

```bash
cp .env.example .env.local   # completar variables
npm install
npm run dev
```

Scripts de calidad: `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`.

## Tests

- **Unitarios (Vitest):** `npm test` (o `npm run test:watch`). Cubren la lógica que no puede fallar en silencio: la normalización del grafo que devuelve la IA, la protección contra open redirect, el estado y progreso de los nodos, la traducción de eventos del webhook de Paddle y los schemas de validación. Cada test vive junto al archivo que prueba (`*.test.ts`).
- **Base de datos:** `supabase/checks/verify_setup.sql` verifica políticas, funciones y permisos. `supabase/checks/smoke_rls.sql` prueba el aislamiento RLS entre usuarios, las cuotas, el webhook y el progreso, dentro de una transacción con `ROLLBACK`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) corre en cada push a `main` y en cada PR:

1. **quality:** lint → typecheck → tests → build.
2. **database:** levanta Postgres en Docker con el CLI de Supabase, aplica todas las migraciones sobre una base vacía y ejecuta las dos checks SQL.
