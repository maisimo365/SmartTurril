require('dotenv').config();
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

const brokerUrl = process.env.MQTT_BROKER_URL;
const topic = process.env.MQTT_TOPIC || 'smartturril/tanque01/nivel';
const umbralCritico = parseFloat(process.env.UMBRAL_CRITICO) || 80;

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
    console.error('❌ SMTP Error de autenticación:', err.message);
  } else {
    console.log('📧 SMTP autenticado correctamente con Gmail');
  }
});

// Conexión al Broker MQTT
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('✅ Conectado al Broker MQTT:', brokerUrl);
  console.log(`🎯 Umbral crítico configurado: ${umbralCritico}%`);
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

    console.log(`[Lectura] distancia: ${distancia} cm | nivel: ${nivelActual}% | umbral: ${umbralCritico}%`);

    if (nivelActual >= umbralCritico) {
      if (enCooldown) {
        const restante = Math.ceil((COOLDOWN_MS - tiempoDesdeUltimaAlerta) / 1000);
        console.log(`⏸️  Nivel crítico (${nivelActual}%) pero en cooldown. Próxima alerta en ${restante}s`);
      } else {
        console.log(`⚠️  ALERTA: Nivel ${nivelActual}% >= ${umbralCritico}%. Enviando correo...`);
        ultimaAlertaTs = ahora;
        await enviarCorreoAlerta(nivelActual, distancia);
      }
    } else {
      console.log(`   Nivel normal ✓`);
    }
  } catch (error) {
    console.error('❌ Error procesando payload MQTT:', error.message, '| Raw:', message.toString());
  }
});

async function enviarCorreoAlerta(nivel, distancia) {
  const mailOptions = {
    from: `"SmartTurril Alertas" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `⚠️ Alerta Crítica: Nivel de Tanque al ${nivel}%`,
    text: `Atención: El sensor del tanque reporta un nivel de ${nivel}% (distancia: ${distancia} cm), superando el límite seguro de ${umbralCritico}%.`,
    html: `
      <h3>⚠️ Alerta de Nivel de Tanque - SmartTurril</h3>
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
    console.log('📧 Correo enviado. ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error enviando correo:', err.message);
  }
}

client.on('error', (err) => {
  console.error('❌ Error en la conexión MQTT:', err.message);
});