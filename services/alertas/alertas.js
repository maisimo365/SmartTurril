require('dotenv').config();
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

const brokerUrl = process.env.MQTT_BROKER_URL;
const topic = process.env.MQTT_TOPIC || 'smartturril/tanque01/nivel';
const umbralCriticoAlto = parseFloat(process.env.UMBRAL_CRITICO) || 80;
const umbralCriticoBajo = parseFloat(process.env.UMBRAL_BAJO) || 20;

// Configuración de Telegram
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

// Cooldown: evita enviar más de 1 alerta cada 5 minutos
const COOLDOWN_MS = 0; // Sin cooldown — cada alerta dispara notificación inmediata
let ultimaAlertaTs = 0;

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar autenticación SMTP al arrancar (solo si está configurado)
if (process.env.SMTP_USER && !process.env.SMTP_USER.includes('tu_correo')) {
  transporter.verify((err) => {
    if (err) {
      console.error('❌ SMTP Error de autenticación:', err.message);
    } else {
      console.log('📧 SMTP autenticado correctamente con Gmail');
    }
  });
} else {
  console.log('ℹ️  SMTP no configurado o credenciales de ejemplo (se omitirá el correo hasta configurar)');
}

// Conexión al Broker MQTT
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('✅ Conectado al Broker MQTT:', brokerUrl);
  console.log(`🎯 Umbrales configurados -> Mínimo: <= ${umbralCriticoBajo}% | Máximo: >= ${umbralCriticoAlto}%`);
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📡 Suscrito al tópico: ${topic}`);
      console.log('⏳ Esperando lecturas del ESP32...\n');
    } else {
      console.error('❌ Error al suscribirse:', err);
    }
  });
});

// Manejo de mensajes entrantes del ESP32
client.on('message', async (recvTopic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const nivelActual = data.nivel;
    const distancia  = data.distancia_cm;

    const ahora = Date.now();
    const tiempoDesdeUltimaAlerta = ahora - ultimaAlertaTs;
    const enCooldown = tiempoDesdeUltimaAlerta < COOLDOWN_MS;

    console.log(`[Lectura] distancia: ${distancia !== undefined ? distancia : 'N/A'} cm | nivel: ${nivelActual}% | rango seguro: ${umbralCriticoBajo}%-${umbralCriticoAlto}%`);

    const esCriticoBajo = nivelActual <= umbralCriticoBajo;
    const esCriticoAlto = nivelActual >= umbralCriticoAlto;
    const esCritico = esCriticoBajo || esCriticoAlto;

    // 📲 Enviar reporte por Telegram en CADA medida recibida
    await enviarTelegramAlerta(nivelActual, distancia);

    // 📧 Enviar correo solo cuando sea crítico (muy bajo o muy alto)
    if (esCritico) {
      if (enCooldown) {
        const restante = Math.ceil((COOLDOWN_MS - tiempoDesdeUltimaAlerta) / 1000);
        console.log(`⏸️  Nivel crítico (${nivelActual}%) pero correo en cooldown. Próximo en ${restante}s`);
      } else {
        const tipoAlerta = esCriticoBajo ? 'bajo' : 'alto';
        console.log(`⚠️  ALERTA CRÍTICA (${tipoAlerta.toUpperCase()}): Nivel ${nivelActual}%. Enviando correo...`);
        ultimaAlertaTs = ahora;
        await enviarCorreoAlerta(nivelActual, distancia, tipoAlerta);
      }
    } else {
      console.log(`   Nivel normal ✓`);
    }
  } catch (error) {
    console.error('❌ Error procesando payload MQTT:', error.message, '| Raw:', message.toString());
  }
});

async function enviarCorreoAlerta(nivel, distancia, tipoAlerta) {
  if (!process.env.SMTP_USER || !process.env.EMAIL_TO || process.env.SMTP_USER.includes('tu_correo')) {
    console.log('ℹ️  Correo omitido (SMTP_USER o EMAIL_TO no configurado en .env)');
    return;
  }

  const esBajo = tipoAlerta === 'bajo';
  const asunto = esBajo 
    ? `🪣 Alerta Crítica: Nivel Muy Bajo de Agua (${nivel}%)`
    : `🚨 Alerta Crítica: Tanque Casi Lleno (${nivel}%)`;

  const descripcion = esBajo
    ? `El nivel de agua ha caído al <b>${nivel}%</b> (por debajo del mínimo seguro de ${umbralCriticoBajo}%). <b>Por favor llene el tanque de inmediato para evitar desabastecimiento.</b>`
    : `El nivel de agua ha alcanzado el <b>${nivel}%</b> (superando el límite de seguridad de ${umbralCriticoAlto}%). <b>Por favor detenga el llenado para evitar desbordes.</b>`;

  const mailOptions = {
    from: `"SmartTurril Alertas" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_TO,
    subject: asunto,
    text: `Alerta SmartTurril: Nivel al ${nivel}%. ${descripcion.replace(/<[^>]*>?/gm, '')}`,
    html: `
      <h3>⚠️ Alerta de Nivel de Tanque - SmartTurril</h3>
      <p>El sensor <b>smartturril/tanque01</b> reporta:</p>
      <ul>
        <li>Nivel actual: <b>${nivel}%</b></li>
        <li>Distancia medida: <b>${distancia !== undefined ? distancia + ' cm' : 'N/A'}</b></li>
        <li>Rango seguro de operación: <b>${umbralCriticoBajo}% a ${umbralCriticoAlto}%</b></li>
      </ul>
      <p>${descripcion}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Correo enviado. ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error enviando correo:', err.message);
  }
}

async function enviarTelegramAlerta(nivel, distancia) {
  if (!telegramToken || !telegramChatId || telegramToken.includes('tu_token')) {
    console.log('ℹ️  Telegram omitido (TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurado en .env)');
    return;
  }

  const distTexto = distancia !== undefined ? `${distancia} cm` : 'N/A';
  const esCriticoBajo = nivel <= umbralCriticoBajo;
  const esCriticoAlto = nivel >= umbralCriticoAlto;

  let header = '';
  let footer = '';

  if (esCriticoBajo) {
    header = `🪣 *ALERTA: NIVEL MUY BAJO - SMARTTURRIL* 🪣`;
    footer = `⚠️ *¡Tanque casi vacío!* El nivel está en *${nivel}%* (debajo del mínimo de ${umbralCriticoBajo}%).\n👉 *Por favor active la bomba o llene el tanque.*`;
  } else if (esCriticoAlto) {
    header = `🚨 *ALERTA: RIESGO DE DESBORDE - SMARTTURRIL* 🚨`;
    footer = `⚠️ *¡Tanque casi lleno!* Nivel en *${nivel}%* (sobre el máximo de ${umbralCriticoAlto}%).\n👉 *Por favor apague el llenado para evitar rebalses.*`;
  } else {
    header = `💧 *Reporte de Nivel - SmartTurril* 🟢`;
    footer = `✅ _Nivel seguro y en rango normal (${umbralCriticoBajo}% - ${umbralCriticoAlto}%)._`;
  }

  const mensaje = 
    `${header}\n\n` +
    `📊 *Nivel actual:* ${nivel}%\n` +
    `📏 *Distancia:* ${distTexto}\n\n` +
    `${footer}`;

  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: mensaje,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log('📲 Alerta enviada a Telegram con éxito');
    } else {
      console.error('❌ Error API Telegram:', data.description);
    }
  } catch (err) {
    console.error('❌ Error enviando alerta a Telegram:', err.message);
  }
}

client.on('error', (err) => {
  console.error('❌ Error en la conexión MQTT:', err.message);
});