/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_S3_BUCKET: string
  readonly VITE_S3_REGION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}