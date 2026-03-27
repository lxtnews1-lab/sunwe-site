/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WC_KEY: string;
  readonly WC_SECRET: string;
  readonly YOUTUBE_KEY: string;
  readonly YOUTUBE_PLAYLISTS: string;
  readonly WEB3FORMS_KEY: string;
  readonly WA_NUMBER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
