/** Dominio de las cuentas de Google del club. Solo las tiene la junta. */
export const CLUB_DOMAIN = 'arquerscastelldefels.com'

/**
 * Si la cuenta puede usar la app. Es solo para la interfaz: quien decide de verdad son las reglas
 * de Firestore (firestore.rules), que comprueban lo mismo en el servidor.
 */
export function isClubAccount(email: string | null, emailVerified: boolean): boolean {
  return emailVerified && email !== null && /^[^@]+@arquerscastelldefels\.com$/i.test(email)
}
