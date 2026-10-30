'use client';
import { useState, useEffect } from 'react';

const CLAVE_STORAGE = 'smartturril_calibracion';
const MARGEN_LLENO_CM = 5; // Margen de seguridad superior (punto ciego HC-SR04)

export function leerCalibracion() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ModalCalibracion({ abierto, distanciaActual, onCerrar, onGuardar }) {
  const [calibracionActual, setCalibracionActual] = useState(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setOk(false);
    setCalibracionActual(leerCalibracion());
  }, [abierto]);

  function autocalibrarFondo() {
    if (!distanciaActual || distanciaActual <= MARGEN_LLENO_CM) return;

    const nueva = {
      distanciaVacio: Math.round(distanciaActual * 10) / 10,
      distanciaLleno: MARGEN_LLENO_CM,
    };

    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(nueva));
    setCalibracionActual(nueva);
    setOk(true);

    setTimeout(() => {
      onGuardar(nueva);
      onCerrar();
    }, 700);
  }

  if (!abierto) return null;

  // Calculamos porcentaje visual de la distancia para la barra (referencia base 150cm)
  const maxBarra = Math.max(120, (distanciaActual || 100));
  const porcentajeBarra = distanciaActual ? Math.min(100, Math.round((distanciaActual / maxBarra) * 100)) : 0;

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <h2 style={s.titulo}>⚙️ Autocalibración del Tanque</h2>
          <button style={s.btnX} onClick={onCerrar}>✕</button>
        </div>

        <p style={s.hint}>
          Coloca el sensor en la posición final con el tanque vacío.
          El sensor capturará la distancia automáticamente como el nivel de fondo (0%).
        </p>

        {/* Panel de captura en vivo */}
        <div style={s.panelLectura}>
          <div style={s.lecturaHeader}>
            <span style={s.labelLive}>📡 Lectura en vivo del sensor:</span>
            <span style={s.valorLive}>
              {distanciaActual != null ? `${distanciaActual.toFixed(1)} cm` : 'Esperando señal...'}
            </span>
          </div>

          <div style={s.barraContainer}>
            <div style={{ ...s.barraFill, width: `${porcentajeBarra}%` }} />
          </div>

          <div style={s.subInfo}>
            <span>0 cm</span>
            <span>{maxBarra} cm</span>
          </div>
        </div>

        {/* Estado actual configurado */}
        {calibracionActual && (
          <div style={s.calibracionGuardada}>
            <span>Fondo actual guardado: <strong>{calibracionActual.distanciaVacio} cm</strong></span>
            <span>Lleno seguro: <strong>{calibracionActual.distanciaLleno} cm</strong></span>
          </div>
        )}

        <div style={s.footer}>
          <button style={s.btnCancelar} onClick={onCerrar}>Cerrar</button>
          <button
            style={{
              ...s.btnCapturar,
              ...(!distanciaActual ? s.btnDisabled : {}),
              ...(ok ? s.btnOk : {})
            }}
            onClick={autocalibrarFondo}
            disabled={!distanciaActual || ok}
          >
            {ok ? '✓ ¡Fondo Calibrado!' : 'Capturar lectura como Vacío'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.18)', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' },
  btnX: { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: '700', color: '#64748b' },
  hint: { margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' },
  panelLectura: { backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  lecturaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  labelLive: { fontSize: '0.85rem', color: '#475569', fontWeight: '600' },
  valorLive: { fontSize: '1.25rem', color: '#0284c7', fontWeight: '800' },
  barraContainer: { height: '12px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' },
  barraFill: { height: '100%', backgroundColor: '#0284c7', borderRadius: '999px', transition: 'width 0.4s ease' },
  subInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' },
  calibracionGuardada: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px' },
  footer: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' },
  btnCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer' },
  btnCapturar: { padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' },
  btnDisabled: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
  btnOk: { backgroundColor: '#22c55e', cursor: 'default' },
};
