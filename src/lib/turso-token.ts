/** Restore JWT header if the token was copied without the leading `eyJhbGciOiJFZER` prefix. */
export function normalizeTursoToken(token: string): string {
  const trimmed = token.trim()
  if (trimmed.startsWith('eyJ')) return trimmed
  if (trimmed.startsWith('TQSIsInR5cCI6IkpXVCJ9')) return `eyJhbGciOiJFZERTQ${trimmed}`
  return trimmed
}
