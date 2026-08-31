/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
  readonly VITE_TURSO_DATABASE_URL: string
  readonly VITE_TURSO_AUTH_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
