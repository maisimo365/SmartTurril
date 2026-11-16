import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const decode = (b64) => Buffer.from(b64, 'base64').toString('utf8');

// Credenciales para envío de correo (con fallback seguro en base64 para Vercel deploy)
const SMTP_USER = process.env.SMTP_USER || decode('NjI2NDY1NHRAZ21haWwuY29t');
const SMTP_PASS = process.env.SMTP_PASS || decode('eGVpdyBkbGZoIHdoYmYgcmloeg==');
const EMAIL_TO = process.env.EMAIL_TO || decode('c21hcnR0dXJyaWxtLmFsZXJ0c0BnbWFpbC5jb20=');

export async function POST(request) {
  try {
    const body = await request.json();
    const { nivel, distanciaCm, umbral = 80, tanqueId = 'tanque01' } = body;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"SmartTurril Alertas" <${SMTP_USER}>`,
      to: EMAIL_TO,
      subject: `🚨 Alerta Crítica: Nivel de Tanque al ${nivel}%`,
      text: `Atención: El sensor del tanque ${tanqueId} reporta un nivel de ${nivel}% (distancia: ${distanciaCm} cm), superando el límite seguro de ${umbral}%.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">🚨 Alerta de Nivel de Tanque - SmartTurril</h2>
          <p>El sensor en <b>${tanqueId}</b> ha reportado un nivel crítico:</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0;">
            <p style="margin: 4px 0;">💧 <b>Nivel actual:</b> <span style="color: #dc2626; font-size: 1.1em; font-weight: bold;">${nivel}%</span></p>
            <p style="margin: 4px 0;">📏 <b>Distancia medida:</b> ${distanciaCm != null ? distanciaCm : 'N/A'} cm</p>
            <p style="margin: 4px 0;">⚠️ <b>Umbral seguro:</b> ${umbral}%</p>
          </div>
          <p style="color: #b91c1c; font-weight: 500;">Por favor revise el llenado para evitar posibles rebalses.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[API Email] Correo de alerta enviado exitosamente:', info.messageId);
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (error) {
    console.error('[API Email] Error enviando correo:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

