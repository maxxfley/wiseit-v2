/**
 * Tema escrito en la landing por alguien sin cuenta: se guarda en una cookie para precargar el
 * formulario del dashboard después del registro (nunca dispara una generación por sí solo).
 */
export const TOPIC_DRAFT_COOKIE = {
  name: "wiseit_topic_draft",
  /** Un día: alcanza para registrarse y confirmar el email. */
  maxAgeSeconds: 60 * 60 * 24,
} as const;
