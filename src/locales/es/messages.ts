/**
 * Mensajes que devuelven las Server Actions. Las acciones devuelven la CLAVE (no el texto) y el
 * cliente la traduce: así el servidor no depende del idioma.
 */
export const messages = {
  generic: "Ocurrió un error. Intentá de nuevo.",
  sessionExpired: "Tu sesión expiró. Volvé a ingresar.",
  rateLimited: "Demasiados intentos. Esperá un momento.",
  // Auth
  checkEmail: "Si el email es válido, te enviamos un link para confirmar tu cuenta. Revisá tu bandeja de entrada.",
  weakPassword: "Esa contraseña es demasiado débil.",
  signupFailed: "No pudimos completar el registro. Intentá de nuevo más tarde.",
  emailNotConfirmed: "Confirmá tu email antes de ingresar.",
  invalidCredentials: "Credenciales inválidas.",
  confirmInvalid: "El link de confirmación no es válido.",
  confirmExpired: "El link expiró o ya fue usado. Registrate de nuevo para recibir otro.",
  resetSent: "Si el email está registrado, te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada.",
  resetSendFailed: "No pudimos enviar el email. Intentá de nuevo más tarde.",
  recoveryInvalid: "El link de recuperación no es válido.",
  recoveryExpired: "El link expiró o ya fue usado. Pedí uno nuevo.",
  samePassword: "Elegí una contraseña distinta a la anterior. Pedí un link nuevo.",
  passwordSaveFailed: "No pudimos guardar la contraseña. Pedí un link nuevo.",
  // Rutas
  aiRateLimited: "El servicio de IA está saturado. Probá de nuevo en un minuto.",
  aiUnavailable: "No pudimos generar la ruta ahora. Intentá de nuevo más tarde.",
  aiInvalidOutput: "La IA devolvió una ruta inválida. Probá con otro tema o reintentá.",
  quotaExhausted: "Llegaste a tu límite de rutas por día. Volvé mañana.",
  quotaError: "No pudimos verificar tu cupo. Intentá de nuevo más tarde.",
  saveFailed: "Generamos la ruta pero no pudimos guardarla. Intentá de nuevo.",
  roadmapInvalid: "Ruta inválida.",
  deleteFailed: "No pudimos eliminar la ruta. Intentá de nuevo.",
  roadmapGone: "La ruta no existe o ya fue eliminada.",
  // Progreso
  nodeLocked: "Este tema está bloqueado: completá antes sus requisitos.",
  nodeNotFound: "No encontramos este tema.",
  progressInvalid: "El progreso enviado no es válido.",
  progressFailed: "No pudimos guardar tu progreso. Intentá de nuevo.",
  // Planes
  premiumRequired: "Guardar el progreso es una función de Wiseit Premium.",
  roadmapLimit: "Llegaste al máximo de rutas guardadas del plan gratis. Borrá una para crear otra.",
  // Pagos
  checkoutFailed: "No pudimos iniciar el pago. Intentá de nuevo en unos minutos.",
  alreadyPremium: "Ya tenés Premium activo.",
  portalFailed: "No pudimos abrir la gestión de tu suscripción. Intentá de nuevo.",
};

/** Mensajes de validación de Zod: los esquemas usan estas claves como `message`. */
export const validation = {
  emailInvalid: "Ingresá un email válido.",
  emailTooLong: "El email es demasiado largo.",
  passwordMin: "Usá al menos 8 caracteres.",
  passwordMax: "Usá como máximo 72 caracteres.",
  passwordLetter: "Incluí al menos una letra.",
  passwordNumber: "Incluí al menos un número.",
  passwordRequired: "Ingresá tu contraseña.",
  passwordTooLong: "La contraseña es demasiado larga.",
  confirmRequired: "Repetí tu contraseña.",
  passwordsMismatch: "Las contraseñas no coinciden.",
  topicMin: "Escribí un tema de al menos 2 caracteres.",
  topicMax: "El tema es demasiado largo (máximo 200 caracteres).",
};
