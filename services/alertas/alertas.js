require('dotenv').config();
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

const brokerUrl = process.env.MQTT_BROKER_URL;
const topic = process.env.MQTT_TOPIC || 'smartturril/tanque01/nivel';
const umbralCritico = parseFloat(process.env.UMBRAL_CRITICO) || 80;

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Conexión al Broker MQTT
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('✅ Conectado al Broker MQTT:', brokerUrl);
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`📡 Suscrito exitosamente al tópico: ${topic}`);
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
    console.log(`[Lectura recibida] Nivel: ${nivelActual}%`);

    if (nivelActual >= umbralCritico) {
      console.log(`⚠️ ALERTA: Nivel crítico detectado (${nivelActual}% >= ${umbralCritico}%)`);
      await enviarCorreoAlerta(nivelActual);
    }
  } catch (error) {
    console.error('Error procesando el payload MQTT:', error.message);
  }
});

async function enviarCorreoAlerta(nivel) {
  const mailOptions = {
    from: `"SmartTurril Alertas" <${process.env.SMTP_USER}>`,
    to: process.env.EMAIL_TO,
    subject: `⚠️ Alerta Crítica: Nivel de Tanque al ${nivel}%`,
    text: `Atención: El sensor del tanque reporta un nivel de ${nivel}%, superando el límite seguro de ${umbralCritico}%.`,
    html: `<h3>⚠️ Alerta de Nivel de Tanque</h3>
           <p>El sensor <b>smartturril/tanque01</b> reporta un nivel actual de <b>${nivel}%</b>.</p>
           <p>Por favor revise el llenado para evitar rebalses.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Correo de alerta enviado exitosamente. ID:', info.messageId);
  } catch (err) {
    console.error('❌ Error enviando correo de alerta:', err);
  }
}

client.on('error', (err) => {
  console.error('❌ Error en la conexión MQTT:', err.message);
});