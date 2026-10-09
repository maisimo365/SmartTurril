require('dotenv').config();
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_TOPIC = process.env.MQTT_TOPIC;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
let lastAlertState = null; // 'BAJO' o 'ALTO'

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
  console.log(`Conectado al broker MQTT en ${MQTT_BROKER_URL}`);
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('Error al suscribirse al tópico:', err);
    } else {
      console.log(`Suscrito al tópico: ${MQTT_TOPIC}`);
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const nivel = payload.nivel;

    if (typeof nivel !== 'number') {
      console.warn('Payload inválido: "nivel" no es un número.', payload);
      return;
    }

    console.log(`Nivel recibido: ${nivel}%`);
    evaluarNivel(nivel);
  } catch (error) {
    console.error('Error al parsear el mensaje JSON:', error);
  }
});

function evaluarNivel(nivel) {
  let currentState = null;
  let subject = '';
  let html = '';

  if (nivel < 20) {
    currentState = 'BAJO';
    subject = '⚠️ ALERTA CRÍTICA: Nivel de Tanque Muy Bajo';
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d9534f;">Alerta de Nivel Bajo</h2>
        <p>El nivel del tanque de agua ha descendido a un punto crítico.</p>
        <p><strong>Nivel actual:</strong> <span style="color: #d9534f; font-size: 1.2em;">${nivel}%</span></p>
        <p>Existe riesgo de desabastecimiento o marcha en vacío de las bombas.</p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">Sistema Automático de Alertas - SmartTurril</p>
      </div>
    `;
  } else if (nivel > 95) {
    currentState = 'ALTO';
    subject = '⚠️ ALERTA CRÍTICA: Riesgo de Desborde del Tanque';
    html = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0275d8;">Alerta de Nivel Alto</h2>
        <p>El nivel del tanque de agua está por encima del límite de seguridad.</p>
        <p><strong>Nivel actual:</strong> <span style="color: #0275d8; font-size: 1.2em;">${nivel}%</span></p>
        <p>Existe riesgo inminente de desborde y desperdicio de agua.</p>
        <hr>
        <p style="font-size: 0.8em; color: #777;">Sistema Automático de Alertas - SmartTurril</p>
      </div>
    `;
  } else {
    // Si vuelve a la normalidad, reiniciamos el estado
    lastAlertState = null;
    return;
  }

  const now = Date.now();
  
  // Control Anti-spam: Solo enviar si el estado cambió, o si pasó el tiempo de cooldown (5 min)
  if (currentState !== lastAlertState || (now - lastAlertTime) >= ALERT_COOLDOWN_MS) {
    enviarCorreo(subject, html);
    lastAlertState = currentState;
    lastAlertTime = now;
  } else {
    console.log(`Alerta de nivel ${currentState} suprimida (control anti-spam, no han pasado 5 min).`);
  }
}

function enviarCorreo(subject, html) {
  const mailOptions = {
    from: SMTP_USER,
    to: EMAIL_TO,
    subject: subject,
    html: html
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error al enviar el correo:', error);
    } else {
      console.log('Correo enviado exitosamente:', info.response);
    }
  });
}

client.on('error', (err) => {
  console.error('Error en el cliente MQTT:', err);
});
