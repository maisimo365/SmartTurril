import { supabase } from './supabase';

const CLAVE_STORAGE = 'smartturril_calibracion';
export const CALIBRACION_ID = 'tanque01';

function validarCalibracion(calibracion) {
  const distanciaVacio = Number(calibracion?.distanciaVacio ?? calibracion?.distancia_vacio);
  const distanciaLleno = Number(calibracion?.distanciaLleno ?? calibracion?.distancia_lleno);

  if (
    !Number.isFinite(distanciaVacio) ||
    !Number.isFinite(distanciaLleno) ||
    distanciaVacio <= distanciaLleno ||
    distanciaLleno < 0
  ) {
    throw new Error('La calibración guardada tiene valores inválidos.');
  }

  return { distanciaVacio, distanciaLleno };
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado; no se puede sincronizar entre dispositivos.');
  }
  return supabase;
}

export function leerCalibracionLocal() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(CLAVE_STORAGE);
    return raw ? validarCalibracion(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn('No se pudo leer la calibración local:', error);
    return null;
  }
}

export function guardarCalibracionLocal(calibracion) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CLAVE_STORAGE, JSON.stringify(validarCalibracion(calibracion)));
  } catch (error) {
    console.warn('No se pudo guardar una copia local de la calibración:', error);
  }
}

export function normalizarFilaCalibracion(row) {
  if (!row) return null;
  return validarCalibracion(row);
}

async function consultarFilaCalibracion() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('configuracion_tanque')
    .select('distancia_vacio, distancia_lleno, updated_at')
    .eq('id', CALIBRACION_ID)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cargarCalibracionCompartida() {
  const row = await consultarFilaCalibracion();
  return row ? { calibracion: normalizarFilaCalibracion(row), updatedAt: row.updated_at } : null;
}

export async function inicializarCalibracionCompartida() {
  const row = await consultarFilaCalibracion();
  if (row) {
    return { calibracion: normalizarFilaCalibracion(row), updatedAt: row.updated_at };
  }

  const local = leerCalibracionLocal();
  if (!local) return null;

  const client = requireSupabase();
  const { data, error } = await client
    .from('configuracion_tanque')
    .insert({
      id: CALIBRACION_ID,
      distancia_vacio: local.distanciaVacio,
      distancia_lleno: local.distanciaLleno,
    })
    .select('distancia_vacio, distancia_lleno, updated_at')
    .single();

  if (!error) {
    return { calibracion: normalizarFilaCalibracion(data), updatedAt: data.updated_at };
  }

  // Another device may have migrated its local value first; use that shared row.
  if (error.code === '23505') {
    const sharedRow = await consultarFilaCalibracion();
    if (sharedRow) {
      return { calibracion: normalizarFilaCalibracion(sharedRow), updatedAt: sharedRow.updated_at };
    }
  }

  throw error;
}

export async function guardarCalibracionCompartida(calibracion) {
  const normalized = validarCalibracion(calibracion);
  const client = requireSupabase();
  const { data, error } = await client
    .from('configuracion_tanque')
    .upsert({
      id: CALIBRACION_ID,
      distancia_vacio: normalized.distanciaVacio,
      distancia_lleno: normalized.distanciaLleno,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('distancia_vacio, distancia_lleno, updated_at')
    .single();

  if (error) throw error;

  const saved = normalizarFilaCalibracion(data);
  guardarCalibracionLocal(saved);
  return { calibracion: saved, updatedAt: data.updated_at };
}
