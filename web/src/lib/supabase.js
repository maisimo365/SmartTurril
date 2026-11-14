import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://aflllymngdwcwcfghera.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_i1FkJnuBfh1GIcntd4yKYw_g2u6_kST';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  DEFAULT_SUPABASE_KEY;

if (typeof window !== 'undefined') {
  if (supabaseUrl && supabaseKey) {
    console.log('✓ [SmartTurril] Supabase inicializado correctamente.');
  } else {
    console.warn('⚠️ [SmartTurril] Faltan variables de Supabase en este entorno.');
  }
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
