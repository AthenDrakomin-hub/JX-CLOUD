// Global type declarations for ESM.sh modules
declare module 'https://esm.sh/@supabase/supabase-js@*' {
  export * from '@supabase/supabase-js';
}

// Type declarations for environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}