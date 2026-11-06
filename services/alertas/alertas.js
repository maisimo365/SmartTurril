const path = require('path');
// Carga el archivo .env unificado desde la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const brokerUrl = process.env.MQTT_BROKER_URL;
const topic = process.env.MQTT_TOPIC || 'smartturril/tanque01/nivel';
const umbralCritico = parseFloat(process.env.UMBRAL_CRITICO) || 80;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✓ Supabase inicializado correctamente para registrar historial');
} else {
  console.warn('⚠️ Supabase no configurado en .env (faltan variables de Supabase). No se guardará historial.');
}

// Intervalo para guardar en Supabase (evita saturar la BD con lecturas cada 3 seg)
const INTERVALO_HISTORIAL_MS = (parseInt(process.env.HISTORIAL_INTERVALO_SEGUNDOS, 10) || 30) * 1000;
let ultimoGuardadoTs = 0;

// Cooldown: evita enviar más de 1 correo cada 5 minutos
const COOLDOWN_MS = 0; // Sin cooldown — cada alerta dispara correo inmediato
let ultimaAlertaTs = 0;

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar autenticación SMTP al arrancar
transporter.verify((err) => {
  if (err) {
    console.error('SMTP Error de autenticación:', err.message);
  } else {
    console.log('SMTP autenticado correctamente con Gmail');
  }
});

// Conexión al Broker MQTT
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('Conectado al Broker MQTT:', brokerUrl);
  console.log(`Umbral crítico configurado: ${umbralCritico}%`);
  console.log(`Intervalo de guardado en Supabase: ${INTERVALO_HISTORIAL_MS / 1000}s`);
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Suscrito al tópico: ${topic}`);
      console.log('Esperando lecturas del ESP32...\n');
    } else {
      console.error('Error al suscribirse:', err);
    }
  });
});

// Manejo de mensajes entrantes del ESP32
client.on('message', async (recvTopic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const nivelActual = data.nivel;
    const distancia = data.distancia_cm;

    const ahora = Date.now();
    const tiempoDesdeUltimaAlerta = ahora - ultimaAlertaTs;
    const enCooldown = tiempoDesdeUltimaAlerta < COOLDOWN_MS;

    console.log(`[Lectura] distancia: ${distancia} cm | nivel: ${nivelActual}% | umbral: ${umbralCritico}%`);

    // 1. Guardar en Supabase respetando el intervalo configurado
    if (supabase && (ahora - ultimoGuardadoTs >= INTERVALO_HISTORIAL_MS)) {
      ultimoGuardadoTs = ahora;
      const tanqueId = recvTopic.split('/')[1] || 'tanque01';
      guardarEnSupabase(tanqueId, distancia, nivelActual);
    }

    // 2. Control de alertas críticas
    if (nivelActual >= umbralCritico) {
      if (enCooldown) {
        const restante = Math.ceil((COOLDOWN_MS - tiempoDesdeUltimaAlerta) / 1000);
        console.log(`Nivel crítico (${nivelActual}%) pero en cooldown. Próxima alerta en ${restante}s`);
      } else {
        console.log(`ALERTA: Nivel ${nivelActual}% >= ${umbralCritico}%. Enviando correo...`);
        ultimaAlertaTs = ahora;
        await enviarCorreoAlerta(nivelActual, distancia);
      }
    } else {
      console.log(`   Nivel normal ✓`);
    }
  } catch (error) {
    console.error('Error procesando payload MQTT:', error.message, '| Raw:', message.toString());
  }
});

// Función para insertar lectura en Supabase
async function guardarEnSupabase(tanqueId, distancia_cm, nivel) {
  try {
    const { error } = await supabase
      .from('lecturas_tanque')
      .insert([
        {
          tanque_id: tanqueId,
          distancia_cm: distancia_cm,
          nivel: nivel,
        },
      ]);

    if (error) {
      console.error('❌ Error guardando lectura en Supabase:', error.message);
    } else {
      console.log(`💾 [Historial] Guardado en Supabase -> Tanque: ${tanqueId} | Nivel: ${nivel}% | Distancia: ${distancia_cm} cm`);
    }
  } catch (err) {
    console.error('❌ Excepción al guardar en Supabase:', err.message);
  }
}

async function enviarCorreoAlerta(nivel, distancia) {
  const mailOptions = {
    from: `"SmartTurril Alertas" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `Alerta Crítica: Nivel de Tanque al ${nivel}%`,
    text: `Atención: El sensor del tanque reporta un nivel de ${nivel}% (distancia: ${distancia} cm), superando el límite seguro de ${umbralCritico}%.`,
    html: `
      <h3> Alerta de Nivel de Tanque - SmartTurril</h3>
      <p>El sensor <b>smartturril/tanque01</b> reporta:</p>
      <ul>
        <li>Nivel actual: <b>${nivel}%</b></li>
        <li>Distancia medida: <b>${distancia} cm</b></li>
        <li>Umbral configurado: <b>${umbralCritico}%</b></li>
      </ul>
      <p>Por favor revise el llenado para evitar rebalses.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Correo enviado. ID:', info.messageId);
  } catch (err) {
    console.error('Error enviando correo:', err.message);
  }
}

client.on('error', (err) => {
  console.error('Error en la conexión MQTT:', err.message);
});
