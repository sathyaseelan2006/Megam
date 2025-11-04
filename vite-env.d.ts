/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly VITE_OPENAQ_API_KEY: string;
  readonly VITE_WAQI_API_KEY: string;
  readonly VITE_NASA_API_KEY: string;
  readonly VITE_IQAIR_API_KEY: string;
  readonly VITE_GEE_PROJECT_ID?: string;
  readonly VITE_PREDICTION_API_URL?: string;
  readonly VITE_PORT?: string;
  readonly VITE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
