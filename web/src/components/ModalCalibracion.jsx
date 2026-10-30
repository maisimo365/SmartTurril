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
          <div style={s.tituloWrapper}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2 style={s.titulo}>Calibración del Tanque</h2>
          </div>
          <button style={s.btnX} onClick={onCerrar} aria-label="Cerrar modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p style={s.hint}>
          Asegúrate de que el sensor esté en su posición de montaje con el tanque vacío.
          El sistema fijará la lectura actual como referencia de tanque vacío (0%).
        </p>

        {/* Panel de captura en vivo */}
        <div style={s.panelLectura}>
          <div style={s.lecturaHeader}>
            <div style={s.labelLiveWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
                <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 14v7" />
              </svg>
              <span style={s.labelLive}>Lectura en tiempo real:</span>
            </div>
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
            <span>Fondo guardado: <strong>{calibracionActual.distanciaVacio} cm</strong></span>
            <span>Lleno seguro: <strong>{calibracionActual.distanciaLleno} cm</strong></span>
          </div>
        )}

        <div style={s.footer}>
          <button style={s.btnCancelar} onClick={onCerrar}>Cancelar</button>
          <button
            style={{
              ...s.btnCapturar,
              ...(!distanciaActual ? s.btnDisabled : {}),
              ...(ok ? s.btnOk : {})
            }}
            onClick={autocalibrarFondo}
            disabled={!distanciaActual || ok}
          >
            {ok ? (
              <span style={s.btnContent}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Fondo Calibrado
              </span>
            ) : (
              'Guardar como Vacío'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '1rem', fontFamily: 'inherit' },
  modal: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 45px rgba(0,0,0,0.12)', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #e2e8f0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tituloWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  titulo: { margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' },
  btnX: { background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'background-color 0.15s' },
  hint: { margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' },
  panelLectura: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  lecturaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  labelLiveWrapper: { display: 'flex', alignItems: 'center', gap: '6px' },
  labelLive: { fontSize: '0.85rem', color: '#475569', fontWeight: '500' },
  valorLive: { fontSize: '1.25rem', color: '#0284c7', fontWeight: '700' },
  barraContainer: { height: '10px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' },
  barraFill: { height: '100%', backgroundColor: '#0284c7', borderRadius: '999px', transition: 'width 0.4s ease' },
  subInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' },
  calibracionGuardada: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px' },
  footer: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' },
  btnCancelar: { padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' },
  btnCapturar: { padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' },
  btnContent: { display: 'flex', alignItems: 'center', gap: '6px' },
  btnDisabled: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
  btnOk: { backgroundColor: '#10b981', cursor: 'default' },
};
