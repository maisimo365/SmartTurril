import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (typeof window !== 'undefined') {
  if (supabaseUrl && supabaseKey) {
    console.log('✓ [SmartTurril] Supabase inicializado correctamente.');
  } else {
    console.warn('⚠️ [SmartTurril] Faltan variables de Supabase en este entorno:', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(supabaseUrl),
      NEXT_PUBLIC_SUPABASE_KEY: Boolean(supabaseKey),
    });
  }
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
