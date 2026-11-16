import { supabase } from './supabase';

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

/**
 * Envía una alerta crítica a Telegram directamente desde la web (CORS habilitado por Telegram)
 */
export async function enviarAlertaTelegramWeb(nivel, distanciaCm, umbral = 80) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Alertas Web] Faltan credenciales de Telegram.');
    return { ok: false, error: 'Credenciales incompletas' };
  }

  const mensaje =
    `🚨 *Alerta de Nivel de Tanque - SmartTurril*\n\n` +
    `📍 *Tanque:* smartturril/tanque01\n` +
    `💧 *Nivel actual:* ${nivel}%\n` +
    `📏 *Distancia medida:* ${distanciaCm != null ? distanciaCm.toFixed(1) : 'N/A'} cm\n` +
    `⚠️ *Umbral configurado:* ${umbral}%\n\n` +
    `⚠️ *Atención:* El tanque ha superado el nivel seguro. Revise el llenado para evitar rebalses.`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensaje,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('📱 [Alertas Web] Alerta enviada a Telegram con éxito.');
      return { ok: true };
    } else {
      console.error('❌ [Alertas Web] Error de Telegram:', data.description);
      return { ok: false, error: data.description };
    }
  } catch (err) {
    console.error('❌ [Alertas Web] Excepción enviando a Telegram:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Inserta una lectura periódica en la tabla lecturas_tanque de Supabase
 */
export async function registrarLecturaSupabase(distanciaCm, nivel, tanqueId = 'tanque01') {
  if (!supabase) {
    console.warn('[Alertas Web] Supabase no está configurado para registrar historial.');
    return { ok: false, error: 'Supabase no inicializado' };
  }

  try {
    const { data, error } = await supabase
      .from('lecturas_tanque')
      .insert([
        {
          tanque_id: tanqueId,
          distancia_cm: distanciaCm != null ? Math.round(distanciaCm * 10) / 10 : 0,
          nivel: typeof nivel === 'number' ? nivel : 0,
        },
      ])
      .select();

    if (error) {
      console.error('❌ [Alertas Web] Error insertando en Supabase:', error.message);
      return { ok: false, error: error.message };
    }

    console.log(`💾 [Alertas Web] Guardado en Supabase -> Tanque: ${tanqueId} | Nivel: ${nivel}% | Distancia: ${distanciaCm} cm`);
    return { ok: true, data };
  } catch (err) {
    console.error('❌ [Alertas Web] Excepción al guardar en Supabase:', err);
    return { ok: false, error: err.message };
  }
}

