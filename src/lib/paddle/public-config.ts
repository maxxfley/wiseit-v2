/**
 * Configuración PÚBLICA de Paddle.js (va al navegador por diseño: el client-side token solo
 * permite abrir el checkout, no leer ni modificar datos). Next solo inyecta las variables
 * NEXT_PUBLIC_ si se leen de forma literal, por eso no se arma el nombre dinámicamente.
 */
export interface PaddlePublicConfig {
  token: string;
  environment: "sandbox" | "production";
}

export function getPaddlePublicConfig(): PaddlePublicConfig | null {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENV;
  if (!token || (environment !== "sandbox" && environment !== "production")) return null;
  return { token, environment };
}
