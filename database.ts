/** Turso database — https://app.turso.tech/amirrr1987/databases/apartemen */
import { normalizeTursoToken } from './src/lib/turso-token.ts'

export { normalizeTursoToken }

export const tursoLibsqlUrl = 'libsql://apartemen-amirrr1987.aws-ap-northeast-1.turso.io'
export const tursoHttpUrl = 'https://apartemen-amirrr1987.aws-ap-northeast-1.turso.io'

export const tursoAuthToken = normalizeTursoToken(
  'TQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgxNjQyMDMsImlkIjoiMDFhMDU2ZGEtNDcwMS03ZmNkLTgyNmUtOGNmNTcyNDdmYTJhIiwia2lkIjoiLWZjSzlqd19ocnN0WlBTRUVxRUcyOVRFVHo1WjJCUUNGT0kzZ2tvZ1ZzdyIsInJpZCI6IjA5ZGIxNmZkLWRhMzktNGZkNC04YWU0LWZjNTNmYjZkN2Q2ZSJ9.sFqDhhr9ZRy6Tui0vDAoqq6VERBFAcKIhIcMEhaMIUuHYjELNLdhPZPazGkJep-i_CZqzG7AOrr4nx4iCmLeCg',
)

/** Local replica created by Turso CLI (`turso db shell apartemen`). */
export const localDbPath = 'file:apartemen.db'

export function resolveTursoAuthToken(): string {
  const fromEnv = process.env.TURSO_AUTH_TOKEN ?? process.env.VITE_TURSO_AUTH_TOKEN
  return normalizeTursoToken(fromEnv ?? tursoAuthToken)
}
